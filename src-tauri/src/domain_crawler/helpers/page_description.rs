use once_cell::sync::Lazy;
use scraper::{Html, Selector};

static DESCRIPTION_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("meta[name='description']").unwrap());

pub fn extract_page_description(document: &Html) -> Option<String> {
    document.select(&DESCRIPTION_SELECTOR)
        .next()?
        .value()
        .attr("content")
        .map(|s| s.to_string())
}

