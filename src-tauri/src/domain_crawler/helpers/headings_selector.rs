use once_cell::sync::Lazy;
use scraper::{Html, Selector};
use std::collections::HashMap;

static HEADINGS_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("h1, h2, h3, h4, h5, h6").unwrap());

pub fn headings_selector(document: &Html) -> HashMap<String, Vec<String>> {
    let mut headings_map: HashMap<String, Vec<String>> = HashMap::new();

    // Iterate over all headings in the document
    for heading in document.select(&HEADINGS_SELECTOR) {
        // Get the tag name of the heading (e.g., h1, h2, etc.)
        let tag_name = heading.value().name(); // This is a &str, no Option involved.

        // Get the text content of the heading
        let text = heading
            .text()
            .collect::<String>()
            .trim() // Remove leading/trailing whitespace
            .to_string();

        // Insert into the map, grouping by the tag name
        headings_map
            .entry(tag_name.to_string())
            .or_insert_with(Vec::new)
            .push(text);
    }

    headings_map
}

