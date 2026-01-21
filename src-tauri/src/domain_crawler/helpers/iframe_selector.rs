use once_cell::sync::Lazy;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Iframe {
    iframe: Vec<String>,
}

static IFRAME_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("iframe").unwrap());

pub fn extract_iframe(document: &Html) -> Option<Iframe> {
    let mut iframes = Vec::new();

    // Extract iframe src attributes
    for element in document.select(&IFRAME_SELECTOR) {
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

