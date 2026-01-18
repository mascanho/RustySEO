use once_cell::sync::Lazy;
use scraper::{Html, Selector};

static VIEWPORT_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("meta[name=\"viewport\"]").unwrap());

pub fn is_mobile(document: &Html) -> bool {
    document.select(&VIEWPORT_SELECTOR).next().is_some()
}

