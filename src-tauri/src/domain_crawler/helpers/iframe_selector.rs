use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Iframe {
    iframe: Vec<String>,
}

pub fn extract_iframe(body: &str) -> Option<Iframe> {
    // Use parse_document if the input is a full HTML document
    let document = Html::parse_document(body);

    // Handle selector parsing errors gracefully
    let iframe_selector = match Selector::parse("iframe") {
        Ok(selector) => selector,
        Err(_) => return None, // Return None if the selector is invalid
    };

    let mut iframes = Vec::new();

    // Extract iframe src attributes
    for element in document.select(&iframe_selector) {
        if let Some(src) = element.value().attr("src") {
            iframes.push(src.to_string());
        }
    }

    // Return Some(Iframe) if iframes were found, otherwise None
    if iframes.is_empty() {
        None
    } else {
        Some(Iframe { iframe: iframes })
    }
}
