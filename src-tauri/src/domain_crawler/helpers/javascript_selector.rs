use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use url::Url;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct JavaScript {
    pub external: Vec<String>, // URLs of external scripts
    pub inline: Vec<String>,   // Content of inline scripts
}

pub fn extract_javascript(body: &str, base_url: &Url) -> JavaScript {
    let document = Html::parse_document(body);
    let script_selector = Selector::parse("script").unwrap();
    let mut javascript = JavaScript {
        external: Vec::new(),
        inline: Vec::new(),
    };

    for element in document.select(&script_selector) {
        if let Some(src) = element.value().attr("src") {
            // External script: add the URL
            //concatenate the base URL with the relative URL
            let src = base_url.join(&src).unwrap().to_string();
            javascript.external.push(src.to_string());
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
