use rust_xlsxwriter::{Format, FormatAlign, FormatBorder, Workbook};
use serde_json::Value;

#[tauri::command]
pub fn generate_xlsx(data: Vec<Value>) -> Result<Vec<u8>, String> {
    println!("Received Data: {:?}", data);

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
        "Description",        // New column for description
        "Description Length", // New column for description length
        "H1",
        "H1 Length",
        "H2",
        "H2 Length",
        "Status Code",
        "Word Count",
        "Indexability",
        "Schema",
        "Canonicals",
        "Flesch Score",
        "Flesch Readability",
        "Keywords",
        "Language",
        "Meta Robots",
        "Mobile",
        "Page Size (KB)",
        "Response Time (s)",
        "Text Ratio (%)",
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

        // Extract and write the description
        let description = match obj.get("description") {
            Some(Value::String(s)) => s.clone(),
            _ => String::new(), // If description is missing or not a string, write a blank cell
        };
        worksheet
            .write((row_idx + 1) as u32, 3, &description)
            .map_err(|e| format!("Failed to write description at row {}: {}", row_idx + 1, e))?;

        // Calculate and write the description length
        let description_length = description.len() as u32;
        worksheet
            .write((row_idx + 1) as u32, 4, description_length)
            .map_err(|e| {
                format!(
                    "Failed to write description length at row {}: {}",
                    row_idx + 1,
                    e
                )
            })?;

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
            .write((row_idx + 1) as u32, 5, &h1)
            .map_err(|e| format!("Failed to write H1 at row {}: {}", row_idx + 1, e))?;

        // Calculate and write the H1 length
        let h1_length = if h1.is_empty() {
            String::new() // Blank cell if H1 is empty
        } else {
            h1.len().to_string() // Length of H1 as a string
        };
        worksheet
            .write((row_idx + 1) as u32, 6, h1_length)
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
            .write((row_idx + 1) as u32, 7, &h2)
            .map_err(|e| format!("Failed to write H2 at row {}: {}", row_idx + 1, e))?;

        // Calculate and write the H2 length
        let h2_length = if h2.is_empty() {
            String::new() // Blank cell if H2 is empty
        } else {
            h2.len().to_string() // Length of H2 as a string
        };
        worksheet
            .write((row_idx + 1) as u32, 8, h2_length)
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
            .write((row_idx + 1) as u32, 9, &status_code)
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
            .write((row_idx + 1) as u32, 10, &word_count)
            .map_err(|e| format!("Failed to write word count at row {}: {}", row_idx + 1, e))?;

        // INDEXABILITY
        let indexability = match obj.get("indexability") {
            Some(Value::Object(indexability_obj)) => {
                // Extract the indexability reason if it exists
                match indexability_obj.get("indexability_reason") {
                    Some(Value::String(reason)) => reason.clone(),
                    _ => "Unknown".to_string(), // Default value if reason is missing or not a string
                }
            }
            _ => "Unknown".to_string(), // Default value if indexability is missing or not an object
        };
        worksheet
            .write((row_idx + 1) as u32, 11, &indexability)
            .map_err(|e| format!("Failed to write indexability at row {}: {}", row_idx + 1, e))?;

        // SCHEMA
        let schema = match obj.get("schema") {
            Some(Value::Null) => "no".to_string(), // If schema is null, write "no"
            Some(_) => "yes".to_string(),          // If schema is not null, write "yes"
            None => "no".to_string(),              // If schema is missing, write "no"
        };
        worksheet
            .write((row_idx + 1) as u32, 12, &schema)
            .map_err(|e| format!("Failed to write schema at row {}: {}", row_idx + 1, e))?;

        // CANONICALS
        let canonicals = match obj.get("canonicals") {
            Some(Value::Array(arr)) if !arr.is_empty() => arr
                .iter()
                .filter_map(|v| match v {
                    Value::String(s) => Some(s.clone()),
                    _ => None,
                })
                .collect::<Vec<String>>()
                .join(", "),
            _ => String::new(), // If canonicals is missing or empty, write a blank cell
        };
        worksheet
            .write((row_idx + 1) as u32, 13, &canonicals)
            .map_err(|e| format!("Failed to write canonicals at row {}: {}", row_idx + 1, e))?;

        // FLESCH SCORE
        let flesch_score = match obj.get("flesch") {
            Some(Value::Object(flesch_obj)) => match flesch_obj.get("Ok") {
                Some(Value::Array(arr)) if arr.len() >= 1 => match &arr[0] {
                    // Borrow the value here
                    Value::Number(n) => n.to_string(),
                    _ => String::new(), // If Flesch score is not a number, write a blank cell
                },
                _ => String::new(), // If Flesch score is missing or invalid, write a blank cell
            },
            _ => String::new(), // If Flesch object is missing, write a blank cell
        };
        worksheet
            .write((row_idx + 1) as u32, 14, &flesch_score)
            .map_err(|e| format!("Failed to write Flesch score at row {}: {}", row_idx + 1, e))?;

        // FLESCH READABILITY
        let flesch_readability = match obj.get("flesch") {
            Some(Value::Object(flesch_obj)) => match flesch_obj.get("Ok") {
                Some(Value::Array(arr)) if arr.len() >= 2 => match &arr[1] {
                    Value::String(s) => s.clone(),
                    _ => String::new(), // If Flesch readability is not a string, write a blank cell
                },
                _ => String::new(), // If Flesch readability is missing or invalid, write a blank cell
            },
            _ => String::new(), // If Flesch object is missing, write a blank cell
        };
        worksheet
            .write((row_idx + 1) as u32, 15, &flesch_readability)
            .map_err(|e| {
                format!(
                    "Failed to write Flesch readability at row {}: {}",
                    row_idx + 1,
                    e
                )
            })?;

        // KEYWORDS
        let keywords = match obj.get("keywords") {
            Some(Value::Array(arr)) => arr
                .iter()
                .filter_map(|v| match v {
                    Value::Array(kw_arr) if kw_arr.len() >= 1 => match &kw_arr[0] {
                        Value::String(s) => Some(s.clone()),
                        _ => None,
                    },
                    _ => None,
                })
                .collect::<Vec<String>>()
                .join(", "),
            _ => String::new(), // If keywords is missing or invalid, write a blank cell
        };
        worksheet
            .write((row_idx + 1) as u32, 16, &keywords)
            .map_err(|e| format!("Failed to write keywords at row {}: {}", row_idx + 1, e))?;

        // LANGUAGE
        let language = match obj.get("language") {
            Some(Value::String(s)) => s.clone(),
            _ => String::new(), // If language is missing or not a string, write a blank cell
        };
        worksheet
            .write((row_idx + 1) as u32, 17, &language)
            .map_err(|e| format!("Failed to write language at row {}: {}", row_idx + 1, e))?;

        // META ROBOTS
        let meta_robots = match obj.get("meta_robots") {
            Some(Value::Object(meta_robots_obj)) => match meta_robots_obj.get("meta_robots") {
                Some(Value::Array(arr)) => arr
                    .iter()
                    .filter_map(|v| match v {
                        Value::String(s) => Some(s.clone()),
                        _ => None,
                    })
                    .collect::<Vec<String>>()
                    .join(", "),
                _ => String::new(), // If meta_robots is missing or invalid, write a blank cell
            },
            _ => String::new(), // If meta_robots object is missing, write a blank cell
        };
        worksheet
            .write((row_idx + 1) as u32, 18, &meta_robots)
            .map_err(|e| format!("Failed to write meta robots at row {}: {}", row_idx + 1, e))?;

        // MOBILE
        let mobile = match obj.get("mobile") {
            Some(Value::Bool(b)) => b.to_string(),
            _ => String::new(), // If mobile is missing or not a boolean, write a blank cell
        };
        worksheet
            .write((row_idx + 1) as u32, 19, &mobile)
            .map_err(|e| format!("Failed to write mobile at row {}: {}", row_idx + 1, e))?;

        // PAGE SIZE (KB)
        let page_size_kb = match obj.get("page_size") {
            Some(Value::Array(arr)) if !arr.is_empty() => match &arr[0] {
                Value::Object(page_size_obj) => match page_size_obj.get("kb") {
                    Some(Value::Number(n)) => n.to_string(),
                    _ => String::new(), // If page size is missing or invalid, write a blank cell
                },
                _ => String::new(), // If page size object is missing, write a blank cell
            },
            _ => String::new(), // If page size array is missing, write a blank cell
        };
        worksheet
            .write((row_idx + 1) as u32, 20, &page_size_kb)
            .map_err(|e| format!("Failed to write page size at row {}: {}", row_idx + 1, e))?;

        // RESPONSE TIME (s)
        let response_time = match obj.get("response_time") {
            Some(Value::Number(n)) => n.to_string(),
            _ => String::new(), // If response time is missing or not a number, write a blank cell
        };
        worksheet
            .write((row_idx + 1) as u32, 21, &response_time)
            .map_err(|e| {
                format!(
                    "Failed to write response time at row {}: {}",
                    row_idx + 1,
                    e
                )
            })?;

        // TEXT RATIO (%)
        let text_ratio = match obj.get("text_ratio") {
            Some(Value::Array(arr)) if !arr.is_empty() => match &arr[0] {
                Value::Object(text_ratio_obj) => match text_ratio_obj.get("text_ratio") {
                    Some(Value::Number(n)) => n.to_string(),
                    _ => String::new(), // If text ratio is missing or invalid, write a blank cell
                },
                _ => String::new(), // If text ratio object is missing, write a blank cell
            },
            _ => String::new(), // If text ratio array is missing, write a blank cell
        };
        worksheet
            .write((row_idx + 1) as u32, 22, &text_ratio)
            .map_err(|e| format!("Failed to write text ratio at row {}: {}", row_idx + 1, e))?;
    }

    // Save workbook to an in-memory buffer
    let buffer = workbook.save_to_buffer().map_err(|e| e.to_string())?;

    Ok(buffer)
}

// Create the XLXS FILE FROM THE DATA (TWO COLUMNS TABLE: CSS, JAVASCRIPT, LINKS)
pub fn generate_excel_two_cols(data: Vec<Value>) -> Result<Vec<u8>, String> {
    println!("Generating Excel with: {:?}", &data);

    // CHECK IF THE DATA IS EMPTY
    if data.is_empty() {
        return Err("No data to generate Excel".to_string());
    }

    // DEFINE THEW HEADERS FOR THE SHEET
    let headers = ["Anchor", "URL"];

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

        // Extract and write the Anchor
        let anchor = match obj
            .get("anchor")
            .ok_or("Missing 'anchor' field in JSON object")?
        {
            Value::String(s) => s.clone(),
            _ => return Err("Invalid Anchor format: expected a string".to_string()),
        };

        worksheet
            .write((row_idx + 1) as u32, 0, &anchor)
            .map_err(|e| format!("Failed to write Anchor at row {}: {}", row_idx + 1, e))?;

        // Extract and write the URL
        let link = match obj
            .get("link")
            .ok_or("Missing 'link' field in JSON object")?
        {
            Value::String(s) => s.clone(),
            _ => return Err("Invalid URL format: expected a string".to_string()),
        };
        worksheet
            .write((row_idx + 1) as u32, 1, &link)
            .map_err(|e| format!("Failed to write URL at row {}: {}", row_idx + 1, e))?;
    }

    let buffer = workbook.save_to_buffer().map_err(|e| e.to_string())?;

    Ok(buffer)
}

// EXTRACT AND PRINT THE DATA FROM THE CSS TABLE
pub fn generate_css_table(data: Vec<Value>) -> Result<Vec<u8>, String> {
    println!("This is the data: {:#?}", &data);

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
