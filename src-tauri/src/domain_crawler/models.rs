use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use super::helpers::{
    alt_tags::AltTags, anchor_links::InternalExternalLinks, indexability::Indexability,
    javascript_selector::JavaScript, title_selector::TitleDetails,
};

#[derive(Serialize, Debug, Deserialize, Clone)]
pub struct DomainCrawlResults {
    pub url: String,
    pub title: Option<Vec<TitleDetails>>,
    pub description: String,
    pub headings: HashMap<String, Vec<String>>,
    pub javascript: JavaScript,
    pub images: Vec<String>,
    pub status_code: u16,
    pub anchor_links: InternalExternalLinks,
    pub indexability: Indexability,
    pub alt_tags: AltTags,
}
