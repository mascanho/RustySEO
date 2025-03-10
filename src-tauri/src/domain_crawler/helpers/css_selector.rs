use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use url::Url;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CSS {
    pub external: Vec<String>, // URLs of external stylesheets
    pub inline: Vec<String>,   // Content of inline styles
}

pub fn extract_css(body: &str, base_url: Url) -> CSS {
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
            if href.starts_with("http") {
                // If the URL is already absolute, use it directly
                css.external.push(href.to_string());
            } else {
                // If the URL is relative, join it with the base URL
                let joined_url = base_url.join(href).unwrap().to_string();
                css.external.push(joined_url);
            }
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
