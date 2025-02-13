use rust_xlsxwriter::{Workbook, XlsxError};
use serde::Deserialize;
use tauri::command;

#[derive(Deserialize)]
struct TableRow {
    id: u32,
    name: String,
    age: u32,
}

pub fn export_to_excel(data: Vec<TableRow>) -> Result<(), String> {
    // Create a new Excel workbook
    let mut workbook = Workbook::new();

    // Add a worksheet
    let mut worksheet = workbook.add_worksheet().map_err(|e| e.to_string())?;

    // Write headers
    worksheet
        .write_string(0, 0, "ID")
        .map_err(|e| e.to_string())?;
    worksheet
        .write_string(0, 1, "Name")
        .map_err(|e| e.to_string())?;
    worksheet
        .write_string(0, 2, "Age")
        .map_err(|e| e.to_string())?;

    // Write data rows
    for (i, row) in data.iter().enumerate() {
        let row_idx = (i + 1) as u32; // Convert to u32 once

        worksheet
            .write_number(row_idx, 0, row.id as f64)
            .map_err(|e| e.to_string())?;
        worksheet
            .write_string(row_idx, 1, &row.name)
            .map_err(|e| e.to_string())?;
        worksheet
            .write_number(row_idx, 2, row.age as f64)
            .map_err(|e| e.to_string())?;
    }

    // Save the workbook to a file
    workbook
        .save("filtered_data.xlsx")
        .map_err(|e| e.to_string())?;

    Ok(())
}
