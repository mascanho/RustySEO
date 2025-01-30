use scraper::{Html, Selector};
use serde_json::Value;

pub fn get_schema(html: &str) -> Option<String> {
    let document = Html::parse_document(html);
    let schema_selector = Selector::parse("script[type=\"application/ld+json\"]").unwrap();

    for script in document.select(&schema_selector) {
        if let Some(json_str) = script.text().next() {
            // Attempt to parse the JSON string
            if let Ok(json_value) = serde_json::from_str::<Value>(json_str) {
                // Return the JSON-LD as a string
                return Some(json_value.to_string());
            }
        }
    }

    // Return None if no JSON-LD is found
    None
}
