use once_cell::sync::Lazy;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize, Debug, Default)]
pub struct MetaRobots {
    pub meta_robots: Vec<String>,
}

static META_ROBOTS_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("meta[name='robots']").unwrap());

/// Extracts meta robots content from an HTML document.
///
/// # Arguments
/// * `document` - The parsed HTML document.
///
/// # Returns
/// * `Option<MetaRobots>` - Returns `Some(MetaRobots)` if meta robots tags are found,
///   otherwise returns `None`.
pub fn get_meta_robots(document: &Html) -> Option<MetaRobots> {
    // Use iterator methods to collect meta robots content
    let meta_robots: Vec<String> = document
        .select(&META_ROBOTS_SELECTOR)
        .filter_map(|element| element.value().attr("content").map(String::from))
        .collect();

    // Return None if no meta robots tags are found
    if meta_robots.is_empty() {
        None
    } else {
        Some(MetaRobots { meta_robots })
    }
}

