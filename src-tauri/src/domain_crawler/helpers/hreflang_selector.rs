use once_cell::sync::Lazy;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HreflangObject {
    pub code: String,
    pub url: String,
}

static HREFLANG_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse(r#"link[rel="alternate"][hreflang]"#).unwrap());

pub fn select_hreflang(document: &Html) -> Option<Vec<HreflangObject>> {
    let mut hreflangs = Vec::new();

    for element in document.select(&HREFLANG_SELECTOR) {
        if let Some(hreflang) = element.value().attr("hreflang") {
            if let Some(href) = element.value().attr("href") {
                hreflangs.push(HreflangObject {
                    code: hreflang.to_string(),
                    url: href.to_string(),
                });
            }
        }
    }

    if hreflangs.is_empty() {
        None
    } else {
        Some(hreflangs)
    }
}

