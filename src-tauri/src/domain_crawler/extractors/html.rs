use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

pub fn extract_html(body: &str) -> String {
    let has_html = true; // Replace this with your actual condition

    // Early exit if `has_html` is false
    if !has_html {
        return String::new(); // Return an empty string
    }

    // Parse the HTML document
    let document = Html::parse_document(body);

    // Create a selector for the <body> tag
    let selector = Selector::parse("body").unwrap();

    // Extract text from the <body> tag if it exists
    if let Some(body) = document.select(&selector).next() {
        let extracted_text: String = body.text().collect();

        // Check if the extracted text contains "marco"
        let extraction = "Marco".to_string();
        if extracted_text.contains(&extraction) {
            return "Extraction Exists".to_string();
        }
    }

    // Return an empty string if "marco" is not found
    String::new()
}
