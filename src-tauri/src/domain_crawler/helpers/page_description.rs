use scraper::{Html, Selector};

pub fn extract_page_description(document: &Html) -> Option<String> {
    let description_selector = Selector::parse("meta[name=description]").unwrap();
    document
        .select(&description_selector)
        .next()
        .and_then(|e| e.value().attr("content"))
        .map(|s| s.to_string())
}
