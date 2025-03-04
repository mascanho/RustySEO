use std::collections::HashMap;

use reqwest::StatusCode;
use serde::{Deserialize, Serialize};

use super::helpers::{
    alt_tags::AltTags, anchor_links::InternalExternalLinks, css_selector::CSS,
    hreflang_selector::HreflangObject, html_size_calculator::Sizes, iframe_selector::Iframe,
    indexability::Indexability, javascript_selector::JavaScript, meta_robots_selector::MetaRobots,
    pdf_selector::PdfLinks, text_ratio::TextRatio, title_selector::TitleDetails,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Extractor {
    pub html: String,
    pub css: String,
    pub regex: String,
}

// Implement Default for Extractor
impl Default for Extractor {
    fn default() -> Self {
        Self {
            html: String::new(),
            css: String::from("Not Configured"),
            regex: String::from("Not Configured"),
        }
    }
}

#[derive(Serialize, Debug, Deserialize, Clone)]
pub struct DomainCrawlResults {
    pub url: String,
    pub title: Option<Vec<TitleDetails>>,
    pub description: String,
    pub headings: HashMap<String, Vec<String>>,
    pub javascript: JavaScript,
    pub images: Result<Vec<(String, String, u64, String, u16, bool)>, String>,
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
    pub flesch: Result<(f64, String), String>,
    pub extractor: Extractor,
    pub headers: Vec<(String, String)>,
}

// Implement Default for DomainCrawlResults
impl Default for DomainCrawlResults {
    fn default() -> Self {
        Self {
            url: String::new(),
            title: None,
            description: String::new(),
            headings: HashMap::new(),
            javascript: JavaScript::default(),
            images: Ok(Vec::new()),
            status_code: 0, // Default to 0 for failed URLs
            anchor_links: None,
            indexability: Indexability::default(),
            alt_tags: AltTags::default(),
            schema: None,
            css: CSS::default(),
            iframe: None,
            pdf_link: None,
            word_count: 0,
            response_time: None,
            mobile: false,
            canonicals: None,
            meta_robots: MetaRobots::default(),
            content_type: String::new(),
            content_length: 0,
            text_ratio: None,
            redirection: None,
            keywords: Vec::new(),
            page_size: Vec::new(),
            hreflangs: None,
            language: None,
            flesch: Ok((0.0, String::new())),
            extractor: Extractor::default(),
            headers: Vec::new(),
        }
    }
}
