use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CSS {
    pub external: Vec<String>, // URLs of external stylesheets
    pub inline: Vec<String>,   // Content of inline styles
}

pub fn extract_css(body: &str) -> CSS {
    let document = Html::parse_document(body);
    let link_selector = Selector::parse("link[rel='stylesheet']").unwrap(); // For external CSS
    let style_selector = Selector::parse("style").unwrap(); // For inline CSS
    let mut css = CSS {
        external: Vec::new(),
        inline: Vec::new(),
    };

    // Extract external CSS (from <link> tags)
    for element in document.select(&link_selector) {
        if let Some(href) = element.value().attr("href") {
            css.external.push(href.to_string());
        }
    }

    // Extract inline CSS (from <style> tags)
    for element in document.select(&style_selector) {
        let inline_css = element.text().collect::<String>();
        if !inline_css.trim().is_empty() {
            css.inline.push(inline_css);
        }
    }

    css
}
