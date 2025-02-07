use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetaRobots {
    pub meta_robots: Vec<String>, // Make meta_robots public
}

pub fn get_meta_robots(body: &str) -> Option<MetaRobots> {
    let document = Html::parse_document(body);
    let meta_robots_selector = Selector::parse("meta[name='robots']").unwrap();

    let mut meta_robots = Vec::new(); // Initialize as mutable

    for element in document.select(&meta_robots_selector) {
        if let Some(meta_robot) = element.value().attr("content") {
            meta_robots.push(meta_robot.to_string());
        }
    }

    if !meta_robots.is_empty() {
        Some(MetaRobots {
            meta_robots, // Simplified: no need to repeat the field name
        })
    } else {
        None // Return None ONLY if the vector is empty
    }
}
