use scraper::Html;
use std::collections::HashMap;

pub fn extract_open_graph(
    page: scraper::Html,
) -> Option<std::collections::HashMap<String, String>> {
    let mut open_graph = std::collections::HashMap::new();

    // Extract OpenGraph meta tags
    for meta in page.find("meta") {
        if let Some(property) = meta.attr("property") {
            if let Some(content) = meta.attr("content") {
                open_graph.insert(property.to_string(), content.to_string());
            }
        }
    }

    Some(open_graph: std::collections::HashMap<String, String>)
}
