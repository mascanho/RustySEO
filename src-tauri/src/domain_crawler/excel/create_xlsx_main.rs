use rust_xlsxwriter::{workbook, worksheet, Format, FormatAlign, FormatBorder, Workbook};
use serde_json::Value;

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
            Value::Object(obj) => obj,
            _ => continue,
        };

        // Helper to extract nested values safely
        let get_val = |path: &[&str]| -> Option<&Value> {
            let mut curr = array;
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

    workbook.save_to_buffer().map_err(|e| e.to_string())
}
