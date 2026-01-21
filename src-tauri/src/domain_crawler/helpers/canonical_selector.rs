use once_cell::sync::Lazy;
use scraper::{Html, Selector};

pub struct Canonicals {
    pub canonicals: Vec<String>,
}

static CANONICAL_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("link[rel='canonical']").unwrap());

pub fn get_canonical(document: &Html) -> Option<Canonicals> {
    let mut canonical_links = vec![];

    // Extract all canonicals
    for element in document.select(&CANONICAL_SELECTOR) {
        // Extract the href attribute in the link tag
        if let Some(canonical_url) = element.value().attr("href") {
            canonical_links.push(canonical_url.to_string());
        }
    }

    // Return Some(Canonicals) if there are canonical links, otherwise None
    if !canonical_links.is_empty() {
        Some(Canonicals {
            canonicals: canonical_links,
        })
    } else {
        None
    }
}

