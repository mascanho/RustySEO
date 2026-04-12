use rust_xlsxwriter::{workbook, worksheet, Format, FormatAlign, FormatBorder, Workbook};
use serde_json::Value;

#[tauri::command]
pub fn generate_xlsx(data: Vec<Value>) -> Result<Vec<u8>, String> {
    // println!("Received Data: {:?}", data);

    if data.is_empty() {
        return Err("Invalid JSON structure: expected a non-empty array of arrays".to_string());
    }

    // Define headers (since the data is an array of arrays, we need predefined headers)
    let headers = vec!["URL", "Alt Text", "Size", "Type", "Status Code"];

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
    if data.is_empty() {
        return Err("No data to generate Excel".to_string());
    }

    let headers = vec![
        "ID", "URL", "Page Title", "Title Size", "Description", "Desc. Size",
        "H1", "H1 Size", "H2", "H2 Size", "Status Code", "Word Count",
        "Text Ratio", "Flesch Score", "Flesch Grade", "Mobile", "Meta Robots",
        "Content Type", "Indexability", "Language", "Schema", "Depth", "Opengraph", "Cookies", "Size"
    ];

    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    let header_format = Format::new()
        .set_bold()
        .set_border(FormatBorder::Thin)
        .set_align(FormatAlign::Center);

    for (col_idx, header) in headers.iter().enumerate() {
        worksheet.write_with_format(0, col_idx as u16, *header, &header_format)
            .map_err(|e| format!("Failed to write header '{}': {}", header, e))?;
    }

    for (row_idx, array) in data.iter().enumerate() {
        let obj = match array {
            Value::Object(_) => array,
            _ => continue,
        };

        // Helper to extract nested values safely
        let get_val = |path: &[&str]| -> Option<&Value> {
            let mut curr = obj;
            for key in path {
                match curr {
                    Value::Object(o) => curr = o.get(*key)?,
                    Value::Array(a) => {
                        if let Ok(idx) = key.parse::<usize>() {
                            curr = a.get(idx)?
                        } else {
                            return None;
                        }
                    }
                    _ => return None,
                }
            }
            Some(curr)
        };

        let id = (row_idx + 1).to_string();
        let url = get_val(&["url"]).and_then(|v| v.as_str()).unwrap_or("").to_string();
        let title = get_val(&["title", "0", "title"]).and_then(|v| v.as_str()).unwrap_or("").to_string();
        let title_len = get_val(&["title", "0", "title_len"]).and_then(|v| v.as_str()).map(|s| s.to_string()).or_else(|| Some(title.len().to_string())).unwrap_or_default();
        let description = get_val(&["description"]).and_then(|v| v.as_str()).unwrap_or("").to_string();
        let desc_len = if description.is_empty() { String::new() } else { description.len().to_string() };
        let h1 = get_val(&["headings", "h1", "0"]).and_then(|v| v.as_str()).unwrap_or("").to_string();
        let h1_len = if h1.is_empty() { String::new() } else { h1.len().to_string() };
        let h2 = get_val(&["headings", "h2", "0"]).and_then(|v| v.as_str()).unwrap_or("").to_string();
        let h2_len = if h2.is_empty() { String::new() } else { h2.len().to_string() };
        
        let status_code = get_val(&["status_code"])
            .and_then(|v| v.as_i64().map(|n| n.to_string()).or(v.as_str().map(|s| s.to_string())))
            .unwrap_or_default();
            
        let word_count = get_val(&["word_count"])
            .and_then(|v| v.as_i64().map(|n| n.to_string()).or(v.as_str().map(|s| s.to_string())))
            .unwrap_or_default();
            
        let text_ratio = get_val(&["text_ratio", "0", "text_ratio"])
            .and_then(|v| v.as_f64())
            .or_else(|| get_val(&["text_ratio"]).and_then(|v| v.as_f64()))
            .map(|v| format!("{:.1}", v))
            .unwrap_or_default();
            
        let flesch = get_val(&["flesch", "Ok", "0"])
            .and_then(|v| v.as_f64())
            .or_else(|| get_val(&["flesch"]).and_then(|v| v.as_f64()))
            .map(|v| format!("{:.1}", v))
            .unwrap_or_default();
            
        let flesch_grade = get_val(&["flesch", "Ok", "1"])
            .and_then(|v| v.as_str())
            .or_else(|| get_val(&["flesch_grade"]).and_then(|v| v.as_str()))
            .unwrap_or("")
            .to_string();
            
        let mobile = match get_val(&["mobile"]) {
            Some(Value::Bool(b)) => if *b { "Yes" } else { "No" },
            _ => "No"
        }.to_string();
        
        let meta_robots = get_val(&["meta_robots", "meta_robots", "0"])
            .and_then(|v| v.as_str())
            .or_else(|| get_val(&["meta_robots"]).and_then(|v| v.as_str()))
            .unwrap_or("")
            .to_string();
            
        let content_type = get_val(&["content_type"]).and_then(|v| v.as_str()).unwrap_or("").to_string();
        
        let indexability = get_val(&["indexability", "indexability"])
            .and_then(|v| v.as_f64())
            .or_else(|| get_val(&["indexability"]).and_then(|v| v.as_f64()))
            .map(|v| if v >= 0.5 { "Indexable" } else { "Not Indexable" })
            .unwrap_or("Not Indexable")
            .to_string();
            
        let language = get_val(&["language"]).and_then(|v| v.as_str()).unwrap_or("").to_string();
        
        let schema = match get_val(&["schema"]) {
            Some(Value::Bool(b)) => if *b { "Yes" } else { "No" },
            Some(Value::String(s)) => if s.to_lowercase() == "yes" { "Yes" } else { "No" },
            Some(Value::Null) | None => "No",
            _ => "Yes"
        }.to_string();
        
        let url_depth = get_val(&["url_depth"])
            .and_then(|v| v.as_u64().map(|n| n.to_string()))
            .unwrap_or_default();
            
        let opengraph = match get_val(&["opengraph"]) {
            Some(Value::Bool(b)) => if *b { "Yes" } else { "No" },
            Some(Value::Object(o)) => if !o.is_empty() { "Yes" } else { "No" },
            _ => "No"
        }.to_string();
        
        let cookies = get_val(&["cookies_count"])
            .and_then(|v| v.as_u64().map(|n| n.to_string()))
            .or_else(|| {
                get_val(&["cookies", "Ok"]).and_then(|v| v.as_array()).map(|a| a.len().to_string())
            })
            .or_else(|| {
                get_val(&["cookies"]).and_then(|v| v.as_array()).map(|a| a.len().to_string())
            })
            .unwrap_or("0".to_string());
            
        let page_size = get_val(&["page_size", "0", "kb"])
            .or_else(|| get_val(&["page_size"]))
            .and_then(|v| v.as_f64().map(|n| n.to_string()).or(v.as_str().map(|s| s.to_string())))
            .map(|v| format!("{} KB", v))
            .unwrap_or_default();

        let row_data = vec![
            id, url, title, title_len, description, desc_len, h1, h1_len, h2, h2_len,
            status_code, word_count, text_ratio, flesch, flesch_grade, mobile, meta_robots,
            content_type, indexability, language, schema, url_depth, opengraph, cookies, page_size
        ];

        for (col_idx, val) in row_data.into_iter().enumerate() {
            worksheet.write((row_idx + 1) as u32, col_idx as u16, val)
                .map_err(|e| e.to_string())?;
        }
    }

    // Save workbook to an in-memory buffer
    let buffer = workbook.save_to_buffer().map_err(|e| e.to_string())?;

    Ok(buffer)
}

// Create the XLXS FILE FROM THE DATA (TWO COLUMNS TABLE: CSS, JAVASCRIPT, LINKS)
pub fn generate_excel_two_cols(data: Vec<Value>) -> Result<Vec<u8>, String> {
    // println!("Generating Excel with: {:?}", &data);

    // CHECK IF THE DATA IS EMPTY
    if data.is_empty() {
        return Err("No data to generate Excel".to_string());
    }

    // DEFINE THEW HEADERS FOR THE SHEET
    let headers = ["URL"];

    // CREATE A NEW WORKBOOK AND SHEET
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    // DEFINE THE HEADER FORMAT
    let header_format = Format::new()
        .set_bold()
        .set_border(FormatBorder::Thin)
        .set_align(FormatAlign::Center);

    // WRITE THE HEADERS TO THE SHEET
    for (col_idx, header) in headers.iter().enumerate() {
        worksheet
            .write_with_format(0, col_idx as u16, *header, &header_format)
            .map_err(|e| format!("Failed to write header '{}': {}", header, e))?;
    }

    // WRITE THE DATA ROWS
    for (row_idx, array) in data.iter().enumerate() {
        let obj = match array {
            Value::Object(obj) => obj,
            _ => return Err("Invalid JSON structure: expected an array of objects".to_string()),
        };

        // Extract and write the URL
        let url = match obj
            .get("url")
            .ok_or("Missing 'link' field in JSON object")?
        {
            Value::String(s) => s.clone(),
            _ => return Err("Invalid URL format: expected a string".to_string()),
        };
        worksheet
            .write((row_idx + 1) as u32, 0, &url)
            .map_err(|e| format!("Failed to write URL at row {}: {}", row_idx + 1, e))?;
    }

    let buffer = workbook.save_to_buffer().map_err(|e| e.to_string())?;

    Ok(buffer)
}

// EXTRACT AND PRINT THE DATA FROM THE CSS TABLE
pub fn generate_css_table(data: Vec<Value>) -> Result<Vec<u8>, String> {
    // println!("This is the data: {:#?}", &data);

    // CHECK IF THE DATA IS EMPTY
    if data.is_empty() {
        return Err("No data to generate Excel".to_string());
    }

    // DEFINE THEW HEADERS FOR THE SHEET
    let headers = ["URL"];

    // CREATE A NEW WORKBOOK AND SHEET
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    // DEFINE THE HEADER FORMAT
    let header_format = Format::new()
        .set_bold()
        .set_border(FormatBorder::Thin)
        .set_align(FormatAlign::Center);

    // WRITE THE HEADERS TO THE SHEET
    for (col_idx, header) in headers.iter().enumerate() {
        worksheet
            .write_with_format(0, col_idx as u16, *header, &header_format)
            .map_err(|e| format!("Failed to write header '{}': {}", header, e))?;
    }

    // WRITE THE DATA ROWS
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
    }

    let buffer = workbook.save_to_buffer().map_err(|e| e.to_string())?;

    Ok(buffer)
}

// EXTRACT AND PRINT THE DATA FROM THE CSS TABLE
pub fn generate_links_excel(data: Vec<Value>) -> Result<Vec<u8>, String> {
    // println!("Generating Excel with: {:?}", &data);

    // CHECK IF THE DATA IS EMPTY
    if data.is_empty() {
        return Err("No data to generate Excel".to_string());
    }

    // DEFINE THEW HEADERS FOR THE SHEET
    let headers = ["URL"];

    // CREATE A NEW WORKBOOK AND SHEET
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    // DEFINE THE HEADER FORMAT
    let header_format = Format::new()
        .set_bold()
        .set_border(FormatBorder::Thin)
        .set_align(FormatAlign::Center);

    // WRITE THE HEADERS TO THE SHEET
    for (col_idx, header) in headers.iter().enumerate() {
        worksheet
            .write_with_format(0, col_idx as u16, *header, &header_format)
            .map_err(|e| format!("Failed to write header '{}': {}", header, e))?;
    }

    // WRITE THE DATA ROWS
    for (row_idx, array) in data.iter().enumerate() {
        let obj = match array {
            Value::Object(obj) => obj,
            _ => return Err("Invalid JSON structure: expected an array of objects".to_string()),
        };

        // Extract and write the anchor
        let anchor = match obj
            .get("anchor")
            .ok_or("Missing 'anchor' field in JSON object")?
        {
            Value::String(s) => s.clone(),
            _ => return Err("Invalid anchor format: expected a string".to_string()),
        };
        worksheet
            .write((row_idx + 1) as u32, 0, &anchor)
            .map_err(|e| format!("Failed to write URL at row {}: {}", row_idx + 1, e))?;

        // Extract and write the URL
        let link = match obj
            .get("link")
            .ok_or("Missing 'link' field in JSON object")?
        {
            Value::String(s) => s.clone(),
            _ => return Err("Invalid link format: expected a string".to_string()),
        };
        worksheet
            .write((row_idx + 1) as u32, 0, &link)
            .map_err(|e| format!("Failed to write link at row {}: {}", row_idx + 1, e))?;
    }

    let buffer = workbook.save_to_buffer().map_err(|e| e.to_string())?;

    Ok(buffer)
}

// EXTRACT AND PRINT THE DATA FROM THE KEYWORDS TABLE
pub fn generate_keywords_excel(data: Vec<Value>) -> Result<Vec<u8>, String> {
    // println!("Generating Excel with: {:?}", &data);

    // CHECK IF THE DATA IS EMPTY
    if data.is_empty() {
        return Err("No data to generate Excel".to_string());
    }

    // CREATE A NEW WORKBOOK AND SHEET
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    // DEFINE THE HEADER FORMAT
    let header_format = Format::new()
        .set_bold()
        .set_border(FormatBorder::Thin)
        .set_align(FormatAlign::Center);

    // WRITE THE HEADERS TO THE SHEET
    let headers = [
        "URL",
        "Keyword 1",
        "Frequency 1",
        "Keyword 2",
        "Frequency 2",
        "Keyword 3",
        "Frequency 3",
        "Keyword 4",
        "Frequency 4",
        "Keyword 5",
        "Frequency 5",
        "Keyword 6",
        "Frequency 6",
        "Keyword 7",
        "Frequency 7",
        "Keyword 8",
        "Frequency 8",
        "Keyword 9",
        "Frequency 9",
        "Keyword 10",
        "Frequency 10",
    ];
    for (col_idx, header) in headers.iter().enumerate() {
        worksheet
            .write_with_format(0, col_idx as u16, *header, &header_format)
            .map_err(|e| format!("Failed to write header '{}': {}", header, e))?;
    }

    // WRITE THE DATA ROWS
    let mut row_idx = 1; // Start from row 1 (after headers)
    for array in data.iter() {
        let obj = match array {
            Value::Object(obj) => obj,
            _ => return Err("Invalid JSON structure: expected an array of objects".to_string()),
        };

        // Extract the URL
        let url = match obj.get("url").ok_or("Missing 'url' field in JSON object")? {
            Value::String(s) => s.clone(),
            _ => return Err("Invalid URL format: expected a string".to_string()),
        };

        // Extract the keywords array
        let keywords = match obj
            .get("keywords")
            .ok_or("Missing 'keywords' field in JSON object")?
        {
            Value::Array(arr) => arr,
            _ => return Err("Invalid keywords format: expected an array".to_string()),
        };

        // Write the URL in the first column
        worksheet
            .write(row_idx as u32, 0, &url)
            .map_err(|e| format!("Failed to write URL at row {}: {}", row_idx, e))?;

        // Write the top 10 keywords and their frequencies in subsequent columns
        let mut col_idx = 1; // Start from column 1 (after URL)
        for (i, keyword_pair) in keywords.iter().take(10).enumerate() {
            let keyword_array = match keyword_pair {
                Value::Array(arr) => arr,
                _ => return Err("Invalid keyword pair format: expected an array".to_string()),
            };

            if keyword_array.len() != 2 {
                return Err("Invalid keyword pair: expected [keyword, frequency]".to_string());
            }

            let keyword = match &keyword_array[0] {
                Value::String(s) => s.clone(),
                _ => return Err("Invalid keyword format: expected a string".to_string()),
            };

            let frequency = match &keyword_array[1] {
                Value::Number(n) => n.as_u64().ok_or("Invalid frequency: expected a number")?,
                _ => return Err("Invalid frequency format: expected a number".to_string()),
            };

            // Write the keyword and frequency in the appropriate columns
            worksheet
                .write(row_idx as u32, col_idx as u16, &keyword)
                .map_err(|e| format!("Failed to write keyword at row {}: {}", row_idx, e))?;
            worksheet
                .write(row_idx as u32, (col_idx + 1) as u16, frequency as f64)
                .map_err(|e| format!("Failed to write frequency at row {}: {}", row_idx, e))?;

            col_idx += 2; // Move to the next keyword-frequency pair columns
        }

        row_idx += 1; // Move to the next row
    }

    // Save the workbook to a buffer
    let buffer = workbook.save_to_buffer().map_err(|e| e.to_string())?;

    Ok(buffer)
}

// GENERATE EXCEL FROM THE LINKS TABLE WITH ALL THE column
// This table has [Anchor Text] | [HREF] | [Status Code] | [Page]

pub fn generate_links_table_excel(data: Vec<Value>) -> Result<Vec<u8>, String> {
    // println!("Received Data, {:?}", &data);

    if data.is_empty() {
        eprintln!("No data received");
        return Err("No data received".to_string());
    }

    let headers = vec![
        "Anchor Text",
        "Rel",
        "HREF",
        "Title",
        "Target",
        "Status Code",
        "Page",
    ];
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

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
    for (row_idx, value) in data.iter().enumerate() {
        if let Value::Object(map) = value {
            let anchor = map
                .get("anchor")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let rel = map
                .get("rel")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let link = map
                .get("link")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let title = map
                .get("title")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let target = map
                .get("target")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let status = map
                .get("status")
                .map(|v| match v {
                    Value::Number(n) => n.to_string(),
                    Value::Null => "null".to_string(),
                    _ => v.to_string(),
                })
                .unwrap_or("".to_string());
            let page = map
                .get("page")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let values = vec![anchor, rel, link, title, target, status, page];
            for (col_idx, cell) in values.iter().enumerate() {
                worksheet
                    .write((row_idx + 1) as u32, col_idx as u16, cell)
                    .map_err(|e| e.to_string())?;
            }
        } else {
            return Err("Invalid JSON structure: expected an array of objects".to_string());
        }
    }

    let buffer = workbook.save_to_buffer().map_err(|e| e.to_string())?;

    // println!("Excel file successfully created in memory!");
    Ok(buffer)
}
