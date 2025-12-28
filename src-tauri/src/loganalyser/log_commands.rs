use super::database::{add_data_to_serverlog_db, create_serverlog_db};
use crate::loganalyser::analyser::{analyse_log, LogInput};
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
    println!("DEBUG: Received {} rows", data.len());

    // Extract all data first
    let mut uploads = Vec::new();

    for (index, row) in data.iter().enumerate() {
        match extract_excel_upload(row, index) {
            Ok(upload) => {
                // Only add if it has actual data
                if !upload.date.is_empty() || !upload.url.is_empty() {
                    uploads.push(upload);
                }
            }
            Err(e) => println!("Row {} error: {}", index, e),
        }
    }

    println!("Extracted {} valid rows", uploads.len());

    if uploads.is_empty() {
        return Err("No valid data to insert".to_string());
    }

    // Use mut here since we're creating a new Storage instance
    let mut db =
        storage::Storage::new("gsc_excel.db").map_err(|e| format!("Failed to open DB: {}", e))?;

    // Ensure table exists
    db.create_table()
        .map_err(|e| format!("Failed to create table: {}", e))?;

    // OPTION 1: Use transaction method (requires mut)
    let inserted = db
        .replace_all_data_transaction(&uploads)
        .map_err(|e| format!("Failed to replace data: {}", e))?;

    // OPTION 2: Or use non-transaction method (doesn't require mut)
    // let inserted = db.replace_all_data(&uploads)
    //     .map_err(|e| format!("Failed to replace data: {}", e))?;

    // Verify
    let final_count = db
        .get_row_count()
        .map_err(|e| format!("Failed to count rows: {}", e))?;

    println!("=== DATA REPLACEMENT COMPLETE ===");
    println!("Old data cleared, {} new rows inserted", inserted);
    println!("Total rows in database: {}", final_count);

    Ok(format!(
        "Replaced all data with {} new rows. Total in DB: {}",
        inserted, final_count
    ))
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
