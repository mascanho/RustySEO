use once_cell::sync::Lazy;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use url::Url;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct JavaScript {
    pub external: Vec<String>, // URLs of external scripts
    pub inline: Vec<String>,   // Content of inline scripts
}

static SCRIPT_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("script").unwrap());

pub fn extract_javascript(document: &Html, base_url: &Url) -> JavaScript {
    let mut javascript = JavaScript {
        external: Vec::new(),
        inline: Vec::new(),
    };

    for element in document.select(&SCRIPT_SELECTOR) {
        if let Some(src) = element.value().attr("src") {
            // External script: add the URL
            //concatenate the base URL with the relative URL
            if let Ok(full_src) = base_url.join(src) {
                javascript.external.push(full_src.to_string());
            }
        } else {
            // Inline script: add the text content
            let inline_js = element.text().collect::<String>();
            if !inline_js.trim().is_empty() {
                javascript.inline.push(inline_js);
            }
        }
    }

    javascript
}

