use crate::crawler::db::open_db_connection;
use rusqlite::Result;
use rust_xlsxwriter::Workbook;

#[tauri::command]
pub fn export_to_excel_command() {
    export_db_to_excel();
}

fn export_db_to_excel() -> Result<()> {
    let excel_path = "data.xlsx";
    let _db_path = "data.db";

    // Open the database connection
    let conn = open_db_connection("crawl_results.db").expect("Failed to open database connection");

    // Connect to the database

    // Create a new Excel workbook
    let mut workbook = Workbook::new();
    let sheet = workbook.add_worksheet();

    // Get the table names from the database
    let mut stmt = conn.prepare("SELECT name FROM sqlite_master WHERE type='table'")?;
    let table_names: Vec<String> = stmt
        .query_map([], |row| row.get(0))?
        .collect::<Result<Vec<String>>>()?;

    let mut row = 0;

    // Iterate through each table
    for table_name in table_names {
        // Write table name as a header
        sheet.write_string(row, 0, &table_name);
        row += 1;

        // Get column names
        let mut stmt = conn.prepare(&format!("PRAGMA table_info({})", table_name))?;
        let column_names: Vec<String> = stmt
            .query_map([], |row| row.get(2))?
            .collect::<Result<Vec<String>>>()?;

        // Write column headers
        for (col, name) in column_names.iter().enumerate() {
            sheet.write_string(row, col as u16, name);
        }
        row += 1;

        // Fetch and write data
        let mut stmt = conn.prepare(&format!("SELECT * FROM {}", table_name))?;
        let mut rows = stmt.query([])?;

        while let Some(db_row) = rows.next()? {
            for col in 0..column_names.len() {
                let value: String = db_row.get(col)?;
                sheet.write_string(row, col as u16, &value);
            }
            row += 1;
        }

        row += 1; // Add an empty row between tables
    }

    workbook.save(excel_path);
    println!("Excel file saved to {}", excel_path);
    Ok(())
}
