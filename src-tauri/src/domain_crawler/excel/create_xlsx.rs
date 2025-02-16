use rust_xlsxwriter::{Format, FormatAlign, FormatBorder, Workbook};
use serde_json::Value;

#[tauri::command]
pub fn generate_xlsx(data: Vec<Value>) -> Result<Vec<u8>, String> {
    println!("Received Data: {:?}", data);

    if data.is_empty() {
        return Err("Invalid JSON structure: expected a non-empty array of arrays".to_string());
    }

    // Define headers (since the data is an array of arrays, we need predefined headers)
    let headers = vec!["URL", "Description", "Size", "Type"];

    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    // Define header format
    let header_format = Format::new()
        .set_bold()
        .set_border(FormatBorder::Thin)
        .set_align(FormatAlign::Center);

    // Write headers
    for (col_idx, header) in headers.iter().enumerate() {
        worksheet
            .write_with_format(0, col_idx as u16, *header, &header_format)
            .map_err(|e| e.to_string())?;
    }

    // Write data rows
    for (row_idx, array) in data.iter().enumerate() {
        if let Value::Array(arr) = array {
            for (col_idx, value) in arr.iter().enumerate() {
                let cell_value = match value {
                    Value::String(s) => s.clone(),
                    Value::Number(n) => n.to_string(),
                    Value::Bool(b) => b.to_string(),
                    _ => "".to_string(),
                };
                worksheet
                    .write((row_idx + 1) as u32, col_idx as u16, cell_value)
                    .map_err(|e| e.to_string())?;
            }
        } else {
            return Err("Invalid JSON structure: expected an array of arrays".to_string());
        }
    }

    // Save workbook to an in-memory buffer
    let buffer = workbook.save_to_buffer().map_err(|e| e.to_string())?;

    println!("Excel file successfully created in memory!");
    Ok(buffer)
}

// Generate EXCEL FILE WITH THE DATA FROM THE MAIN TABLE

pub fn generate_excel_main_table(data: Vec<Value>) -> Result<Vec<u8>, String> {
    println!("Generating Excel with: {:?}", &data);

    if data.is_empty() {
        return Err("No data to generate Excel".to_string());
    }

    // DEFINE THE HEADERS NEEDED FOR THE TABLE
    let headers = vec!["URL"];

    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    // DEFINE THE HEADER FORMAT
    let header_format = Format::new()
        .set_bold()
        .set_border(FormatBorder::Thin)
        .set_align(FormatAlign::Center);

    // WRITE THE HEADERS
    for (col_idx, header) in headers.iter().enumerate() {
        worksheet
            .write_with_format(0, col_idx as u16, *header, &header_format)
            .map_err(|e| e.to_string())?;
    }

    // Write data rows
    for (row_idx, array) in data.iter().enumerate() {
        if let Value::Object(obj) = array {
            // Extract the "url" field from the object
            if let Some(url_value) = obj.get("url") {
                let url = match url_value {
                    Value::String(s) => s.clone(),
                    _ => return Err("Invalid URL format: expected a string".to_string()),
                };

                // Write the URL to the worksheet
                worksheet
                    .write((row_idx + 1) as u32, 0, url)
                    .map_err(|e| e.to_string())?;
            } else {
                return Err("Missing 'url' field in JSON object".to_string());
            }
        } else {
            return Err("Invalid JSON structure: expected an array of objects".to_string());
        }
    }

    // Save workbook to an in-memory buffer
    let buffer = workbook.save_to_buffer().map_err(|e| e.to_string())?;

    Ok(buffer)
}
