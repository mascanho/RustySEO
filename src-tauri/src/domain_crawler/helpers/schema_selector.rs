use once_cell::sync::Lazy;
use scraper::{Html, Selector};
use serde_json::Value;

static SCHEMA_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("script[type=\"application/ld+json\"]").unwrap());

pub fn get_schema(document: &Html) -> Option<String> {
    for script in document.select(&SCHEMA_SELECTOR) {
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

