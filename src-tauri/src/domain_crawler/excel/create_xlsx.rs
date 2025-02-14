use rust_xlsxwriter::{Format, FormatAlign, FormatBorder, Workbook, XlsxError};
use std::path::Path;

pub fn generate_xlsx(data: Vec<String>) -> Result<(), String> {
    // Create a new workbook
    let mut workbook = Workbook::new();

    println!("This is the data: {:?}", &data);

    // Add a worksheet
    let worksheet = workbook.add_worksheet();

    // Define a format for headers
    let header_format = Format::new()
        .set_bold()
        .set_border(FormatBorder::Thin)
        .set_align(FormatAlign::Center);

    // Generate dummy data
    let dummy_data = vec![
        vec!["Name", "Age", "City"],
        vec!["Alice", "30", "New York"],
        vec!["Bob", "25", "Los Angeles"],
        vec!["Charlie", "35", "Chicago"],
    ];

    // Write headers with formatting
    for (col_idx, header) in dummy_data[0].iter().enumerate() {
        worksheet
            .write_with_format(0, col_idx as u16, *header, &header_format)
            .map_err(|e| e.to_string())?;
    }

    // Write data rows
    for (row_idx, row) in dummy_data.iter().skip(1).enumerate() {
        for (col_idx, cell_value) in row.iter().enumerate() {
            worksheet
                .write((row_idx + 1) as u32, col_idx as u16, *cell_value)
                .map_err(|e| e.to_string())?;
        }
    }

    // Save the workbook to a file
    workbook
        .save("marco_rust.xlsx")
        .map_err(|e| e.to_string())?;

    Ok(())
}
