use super::{
    analyser::LogResult,
    database::{add_data_to_serverlog_db, create_serverlog_db},
};
use crate::loganalyser::analyser::{analyse_log, LogAnalysisResult, LogInput};
use crate::uploads::storage;

#[tauri::command]
pub fn check_logs_command(
    data: LogInput,
    storing_logs: bool,
    project: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let app = app.clone();

    // IF THE USER HAS CHOOSEN TO STORE THE LOGS IN A DB
    if storing_logs == true {
        // Create the DB
        let _create_table = create_serverlog_db("serverlog.db");
        // Add the data to the debug_assert!
        let _add_data = add_data_to_serverlog_db("serverlog.db", &data, &project);

        println!("Stored logs in serverlog.db");
    } else {
        println!("Not storing logs");
    }

    match analyse_log(data, app) {
        Ok(()) => {
            // Optional: You could include the current total in the result
            Ok(())
        }
        Err(e) => Err(e),
    }
}

// ------- SAVE GSC DATA FROM FRONTEND
#[tauri::command]
pub fn save_gsc_data(data: Vec<serde_json::Value>) -> Result<String, String> {
    println!("DEBUG: First 2 rows of received data:");
    for (i, row) in data.iter().take(2).enumerate() {
        println!(
            "Row {} keys: {:?}",
            i,
            row.as_object().map(|obj| obj.keys().collect::<Vec<_>>())
        );
        println!(
            "Row {} full: {}",
            i,
            serde_json::to_string_pretty(row).unwrap_or_default()
        );
    }

    let db =
        storage::Storage::new("gsc_excel.db").map_err(|e| format!("Failed to open DB: {}", e))?;

    // Ensure table exists
    db.create_table()
        .map_err(|e| format!("Failed to create table: {}", e))?;

    // Insert each row with PROPER DATA EXTRACTION
    let mut inserted = 0;
    let mut errors = Vec::new();

    for (index, row) in data.iter().enumerate() {
        // Extract data from JSON - THIS IS THE CRITICAL PART
        let upload_result = extract_excel_upload(row, index);

        match upload_result {
            Ok(upload) => {
                // Validate we have actual data (not all zeros/empty)
                if upload.date.is_empty() && upload.url.is_empty() {
                    errors.push(format!("Row {}: Both date and url are empty", index));
                    continue;
                }

                db.add_data(&upload)
                    .map_err(|e| format!("Failed to insert row {}: {}", index, e))?;
                inserted += 1;

                // Print first few successful inserts for verification
                if inserted <= 3 {
                    println!("SUCCESS insert {}: {:?}", inserted, upload);
                }
            }
            Err(e) => {
                errors.push(format!("Row {}: {}", index, e));
            }
        }
    }

    // Print summary
    println!("=== INSERTION SUMMARY ===");
    println!("Total rows attempted: {}", data.len());
    println!("Successfully inserted: {}", inserted);
    println!("Failed: {}", errors.len());

    if !errors.is_empty() {
        println!("First 5 errors:");
        for err in errors.iter().take(5) {
            println!("  {}", err);
        }
    }

    // Debug: Show what's actually in the database
    println!("\n=== DATABASE CONTENTS (first 5 rows) ===");
    db.print_table()
        .map_err(|e| format!("Failed to print table: {}", e))?;

    Ok(format!("Inserted {}/{} rows", inserted, data.len()))
}

// Helper function to properly extract data from JSON
fn extract_excel_upload(
    row: &serde_json::Value,
    index: usize,
) -> Result<storage::ExcelUpload, String> {
    // Check if row is an object
    let obj = row
        .as_object()
        .ok_or_else(|| format!("Row {} is not a JSON object", index))?;

    // Try different possible field names (Google Search Console exports can vary)
    let date = obj
        .get("date")
        .or_else(|| obj.get("Date"))
        .or_else(|| obj.get("DATE"))
        .or_else(|| obj.get("Query date"))
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let url = obj
        .get("url")
        .or_else(|| obj.get("URL"))
        .or_else(|| obj.get("Page"))
        .or_else(|| obj.get("Top pages"))
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let position = obj
        .get("position")
        .or_else(|| obj.get("Position"))
        .or_else(|| obj.get("Avg. position"))
        .and_then(|v| v.as_f64()) // GSC often provides float positions
        .unwrap_or(0.0) as i32;

    let clicks = obj
        .get("clicks")
        .or_else(|| obj.get("Clicks"))
        .or_else(|| obj.get("Total Clicks"))
        .and_then(|v| v.as_i64())
        .unwrap_or(0) as i32;

    let impressions = obj
        .get("impressions")
        .or_else(|| obj.get("Impressions"))
        .or_else(|| obj.get("Total Impressions"))
        .and_then(|v| v.as_i64())
        .unwrap_or(0) as i32;

    Ok(storage::ExcelUpload {
        id: 0, // Will be auto-incremented
        date,
        url,
        position,
        clicks,
        impressions,
    })
}
