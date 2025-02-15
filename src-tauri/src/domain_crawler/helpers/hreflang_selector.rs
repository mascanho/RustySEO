use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HreflangObject {
    pub code: String,
    pub url: String,
}

pub fn select_hreflang(body: &str) -> Option<Vec<HreflangObject>> {
    let document = Html::parse_document(&body);
    let selector = Selector::parse(r#"link[rel="alternate"][hreflang]"#).unwrap();

    let mut hreflangs = Vec::new();

    for element in document.select(&selector) {
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
