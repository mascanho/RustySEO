use once_cell::sync::Lazy;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use url::Url;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CSS {
    pub external: Vec<String>, // URLs of external stylesheets
    pub inline: Vec<String>,   // Content of inline styles
}

static LINK_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("link[rel='stylesheet']").unwrap());
static STYLE_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("style").unwrap());

pub fn extract_css(document: &Html, base_url: &Url) -> CSS {
    let mut css = CSS {
        external: Vec::new(),
        inline: Vec::new(),
    };

    // Extract external CSS (from <link> tags)
    for element in document.select(&LINK_SELECTOR) {
        if let Some(href) = element.value().attr("href") {
            if let Ok(full_url) = base_url.join(href) {
                css.external.push(full_url.to_string());
            }
        }
    }

    // Extract inline CSS (from <style> tags)
    for element in document.select(&STYLE_SELECTOR) {
        let inline_css = element.text().collect::<String>();
        if !inline_css.trim().is_empty() {
            css.inline.push(inline_css);
        }
    }

    css
}

