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

pub fn extract_title(html: &str) -> Option<Vec<TitleDetails>> {
    let document = Html::parse_document(html);

    // Try to extract the <title> tag
    let title_selector = Selector::parse("title").unwrap();
    if let Some(title_element) = document.select(&title_selector).next() {
        let title = title_element.text().collect::<String>().trim().to_string();
        let title_len = title.len();
        let mut results = Vec::new();
        results.push(TitleDetails::new(&title, title_len));
        if !title.is_empty() {
            return Some(results);
        }
    }

    // Fallback: Try to extract the first <h1> tag
    let h1_selector = Selector::parse("h1").unwrap();
    if let Some(h1_element) = document.select(&h1_selector).next() {
        let h1_text = h1_element.text().collect::<String>().trim().to_string();
        let h1_len = h1_text.len();
        let mut results = Vec::new();
        results.push(TitleDetails::new(&h1_text, h1_len));
        if !h1_text.is_empty() {
            return Some(results);
        }
    }

    // Fallback: Try to extract the first <h2> tag
    let h2_selector = Selector::parse("h2").unwrap();
    if let Some(h2_element) = document.select(&h2_selector).next() {
        let h2_text = h2_element.text().collect::<String>().trim().to_string();
        let h2_len = h2_text.len();
        let mut results = Vec::new();
        results.push(TitleDetails::new(&h2_text, h2_len));
        if !h2_text.is_empty() {
            return Some(results);
        }
    }

    // Fallback: Try to extract the <meta> tag with name="title" or property="og:title"
    let meta_selector = Selector::parse("meta").unwrap();
    for meta_element in document.select(&meta_selector) {
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
