use scraper::{Html, Selector};
use std::collections::HashMap;

pub fn parse_opengraph(html: &str) -> HashMap<String, String> {
    let document = Html::parse_document(html);
    let mut opengraph = HashMap::new();

    // Select all meta tags that have a property attribute (standard for OpenGraph)
    if let Ok(selector) = Selector::parse("meta[property]") {
        for element in document.select(&selector) {
            if let Some(property) = element.value().attr("property") {
                if let Some(content) = element.value().attr("content") {
                    opengraph.insert(property.to_string(), content.to_string());
                }
            }
        }
    }

    opengraph
}
