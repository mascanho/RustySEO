use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use super::helpers::{
    alt_tags::AltTags, anchor_links::InternalExternalLinks, css_selector::CSS,
    hreflang_selector::HreflangObject, html_size_calculator::Sizes, iframe_selector::Iframe,
    indexability::Indexability, javascript_selector::JavaScript, meta_robots_selector::MetaRobots,
    pdf_selector::PdfLinks, text_ratio::TextRatio, title_selector::TitleDetails,
};

#[derive(Serialize, Debug, Deserialize, Clone)]
pub struct DomainCrawlResults {
    pub url: String,
    pub title: Option<Vec<TitleDetails>>,
    pub description: String,
    pub headings: HashMap<String, Vec<String>>,
    pub javascript: JavaScript,
    pub images: Result<Vec<(String, String, u64, String)>, String>,
    pub status_code: u16,
    pub anchor_links: Option<InternalExternalLinks>,
    pub indexability: Indexability,
    pub alt_tags: AltTags,
    pub schema: Option<String>,
    pub css: CSS,
    pub iframe: Option<Iframe>,
    pub pdf_link: Option<PdfLinks>,
    pub word_count: usize,
    pub response_time: Option<f64>, // Response time in seconds
    pub mobile: bool,
    pub canonicals: Option<Vec<String>>,
    pub meta_robots: MetaRobots,
    pub content_type: String,
    pub content_length: usize,
    pub text_ratio: Option<Vec<TextRatio>>,
    pub redirection: Option<String>,
    pub keywords: Vec<(String, usize)>,
    pub page_size: Vec<Sizes>,
    pub hreflangs: Option<Vec<HreflangObject>>,
    pub language: Option<String>,
}
