use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize, Debug, Default)]
pub struct MetaRobots {
    pub meta_robots: Vec<String>,
}

/// Extracts meta robots content from an HTML document.
///
/// # Arguments
/// * `body` - The HTML content as a string.
///
/// # Returns
/// * `Option<MetaRobots>` - Returns `Some(MetaRobots)` if meta robots tags are found,
///   otherwise returns `None`.
pub fn get_meta_robots(body: &str) -> Option<MetaRobots> {
    let document = Html::parse_document(body);
    let meta_robots_selector = Selector::parse("meta[name='robots']").unwrap();

    // Use iterator methods to collect meta robots content
    let meta_robots: Vec<String> = document
        .select(&meta_robots_selector)
        .filter_map(|element| element.value().attr("content").map(String::from))
        .collect();

    // Return None if no meta robots tags are found
    if meta_robots.is_empty() {
        None
    } else {
        Some(MetaRobots { meta_robots })
    }
}
