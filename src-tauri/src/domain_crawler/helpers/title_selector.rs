use once_cell::sync::Lazy;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TitleDetails {
    pub title: String,
    pub title_len: usize,
}

impl TitleDetails {
    pub fn new(title: &str, title_len: usize) -> Self {
        Self {
            title: title.to_string(),
            title_len,
        }
    }
}

static TITLE_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("title").unwrap());
static H1_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("h1").unwrap());
static H2_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("h2").unwrap());
static META_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("meta").unwrap());

pub fn extract_title(document: &Html) -> Option<Vec<TitleDetails>> {
    // Try to extract the <title> tag
    if let Some(title_element) = document.select(&TITLE_SELECTOR).next() {
        let title = title_element.text().collect::<String>().trim().to_string();
        let title_len = title.len();
        let mut results = Vec::new();
        results.push(TitleDetails::new(&title, title_len));
        if !title.is_empty() {
            return Some(results);
        }
    }

    // Fallback: Try to extract the first <h1> tag
    if let Some(h1_element) = document.select(&H1_SELECTOR).next() {
        let h1_text = h1_element.text().collect::<String>().trim().to_string();
        let h1_len = h1_text.len();
        let mut results = Vec::new();
        results.push(TitleDetails::new(&h1_text, h1_len));
        if !h1_text.is_empty() {
            return Some(results);
        }
    }

    // Fallback: Try to extract the first <h2> tag
    if let Some(h2_element) = document.select(&H2_SELECTOR).next() {
        let h2_text = h2_element.text().collect::<String>().trim().to_string();
        let h2_len = h2_text.len();
        let mut results = Vec::new();
        results.push(TitleDetails::new(&h2_text, h2_len));
        if !h2_text.is_empty() {
            return Some(results);
        }
    }

    // Fallback: Try to extract the <meta> tag with name="title" or property="og:title"
    for meta_element in document.select(&META_SELECTOR) {
        if let Some(name) = meta_element.value().attr("name") {
            if name.eq_ignore_ascii_case("title") || name.eq_ignore_ascii_case("og:title") {
                if let Some(content) = meta_element.value().attr("content") {
                    let meta_title = content.trim().to_string();
                    let meta_len = meta_title.len();
                    let mut results = Vec::new();
                    results.push(TitleDetails::new(&meta_title, meta_len));
                    if !meta_title.is_empty() {
                        return Some(results);
                    }
                }
            }
        }
    }

    // If no title is found, return None
    None
}

