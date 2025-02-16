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

    // Check if data is empty
    if data.is_empty() {
        return Err("No data to generate Excel".to_string());
    }

    // Define the headers for the table
    let headers = vec![
        "URL",
        "Page Title",
        "Page Title Length",
        "H1",
        "H1 Length",
        "H2",
        "H2 Length",
        "Status Code",
        "Word Count",
    ];

    // Create a new workbook and worksheet
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    // Define the header format
    let header_format = Format::new()
        .set_bold()
        .set_border(FormatBorder::Thin)
        .set_align(FormatAlign::Center);

    // Write the headers to the worksheet
    for (col_idx, header) in headers.iter().enumerate() {
        worksheet
            .write_with_format(0, col_idx as u16, *header, &header_format)
            .map_err(|e| format!("Failed to write header '{}': {}", header, e))?;
    }

    // Write data rows
    for (row_idx, array) in data.iter().enumerate() {
        let obj = match array {
            Value::Object(obj) => obj,
            _ => return Err("Invalid JSON structure: expected an array of objects".to_string()),
        };

        // Extract and write the URL
        let url = match obj.get("url").ok_or("Missing 'url' field in JSON object")? {
            Value::String(s) => s.clone(),
            _ => return Err("Invalid URL format: expected a string".to_string()),
        };
        worksheet
            .write((row_idx + 1) as u32, 0, &url)
            .map_err(|e| format!("Failed to write URL at row {}: {}", row_idx + 1, e))?;

        // Extract and write the title
        let title = match obj
            .get("title")
            .ok_or("Missing 'title' field in JSON object")?
        {
            Value::Array(arr) => match arr.get(0).ok_or("Title array is empty")? {
                Value::Object(title_obj) => match title_obj
                    .get("title")
                    .ok_or("Missing 'title' field in title object")?
                {
                    Value::String(s) => s.clone(),
                    _ => return Err("Invalid title format: expected a string".to_string()),
                },
                _ => return Err("Invalid title format: expected an object".to_string()),
            },
            _ => return Err("Invalid title format: expected an array".to_string()),
        };
        worksheet
            .write((row_idx + 1) as u32, 1, &title)
            .map_err(|e| format!("Failed to write title at row {}: {}", row_idx + 1, e))?;

        // Calculate and write the page title length
        let title_length = title.len() as u32;
        worksheet
            .write((row_idx + 1) as u32, 2, title_length)
            .map_err(|e| format!("Failed to write title length at row {}: {}", row_idx + 1, e))?;

        // Extract and write the H1
        let h1 = match obj.get("headings").and_then(|headings| headings.get("h1")) {
            Some(Value::Array(arr)) if !arr.is_empty() => {
                match arr.get(0).unwrap() {
                    Value::String(s) => s.clone(),
                    _ => String::new(), // If H1 is not a string, write a blank cell
                }
            }
            _ => String::new(), // If H1 is missing or empty, write a blank cell
        };
        worksheet
            .write((row_idx + 1) as u32, 3, &h1)
            .map_err(|e| format!("Failed to write H1 at row {}: {}", row_idx + 1, e))?;

        // Calculate and write the H1 length
        let h1_length = if h1.is_empty() {
            String::new() // Blank cell if H1 is empty
        } else {
            h1.len().to_string() // Length of H1 as a string
        };
        worksheet
            .write((row_idx + 1) as u32, 4, h1_length)
            .map_err(|e| format!("Failed to write H1 length at row {}: {}", row_idx + 1, e))?;

        // Extract and write the H2
        let h2 = match obj.get("headings").and_then(|headings| headings.get("h2")) {
            Some(Value::Array(arr)) if !arr.is_empty() => {
                match arr.get(0).unwrap() {
                    Value::String(s) => s.clone(),
                    _ => String::new(), // If H2 is not a string, write a blank cell
                }
            }
            _ => String::new(), // If H2 is missing or empty, write a blank cell
        };
        worksheet
            .write((row_idx + 1) as u32, 5, &h2)
            .map_err(|e| format!("Failed to write H2 at row {}: {}", row_idx + 1, e))?;

        // Calculate and write the H2 length
        let h2_length = if h2.is_empty() {
            String::new() // Blank cell if H2 is empty
        } else {
            h2.len().to_string() // Length of H2 as a string
        };
        worksheet
            .write((row_idx + 1) as u32, 6, h2_length)
            .map_err(|e| format!("Failed to write H2 length at row {}: {}", row_idx + 1, e))?;

        // Extract and write the status code
        let status_code = match obj
            .get("status_code")
            .ok_or("Missing 'status_code' field in JSON object")?
        {
            Value::Number(n) => n.to_string(),
            _ => return Err("Invalid status code format: expected a number".to_string()),
        };
        worksheet
            .write((row_idx + 1) as u32, 7, &status_code)
            .map_err(|e| format!("Failed to write status code at row {}: {}", row_idx + 1, e))?;

        // Extract and write the word count
        let word_count = match obj
            .get("word_count")
            .ok_or("Missing 'word_count' field in JSON object")?
        {
            Value::Number(n) => n.to_string(),
            _ => return Err("Invalid word count format: expected a number".to_string()),
        };
        worksheet
            .write((row_idx + 1) as u32, 8, &word_count)
            .map_err(|e| format!("Failed to write word count at row {}: {}", row_idx + 1, e))?;
    }

    // Save workbook to an in-memory buffer
    let buffer = workbook.save_to_buffer().map_err(|e| e.to_string())?;

    Ok(buffer)
}
