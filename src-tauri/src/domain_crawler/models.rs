use std::collections::HashMap;

use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use url::Url;

use crate::crawler::libs::LinkStatus;

use super::{
    helpers::{
        alt_tags::AltTags, anchor_links::InternalExternalLinks, cross_origin::SecuritySummary,
        css_selector::CSS, hreflang_selector::HreflangObject, html_size_calculator::Sizes,
        iframe_selector::Iframe, indexability::Indexability, javascript_selector::JavaScript,
        links_status_code_checker::LinkCheckResults, meta_robots_selector::MetaRobots,
        pdf_selector::PdfLinks, text_ratio::TextRatio, title_selector::TitleDetails,
    },
    page_speed::model::LighthouseResult,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RedirectHop {
    pub url: String,
    pub status_code: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Extractor {
    pub html: bool,
    pub css: bool,
    pub regex: bool,
}

// Implement Default for Extractor
impl Default for Extractor {
    fn default() -> Self {
        Self {
            html: false,
            css: false,
            regex: false,
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
    pub inoutlinks_status_codes: LinkCheckResults,
    pub indexability: Indexability,
    pub alt_tags: AltTags,
    pub schema: Option<String>,
    pub css: CSS,
    pub iframe: Option<Iframe>,
    pub word_count: usize,
    pub response_time: Option<f64>, // Response time in seconds
    pub mobile: bool,
    pub canonicals: Option<Vec<String>>,
    pub meta_robots: MetaRobots,
    pub opengraph: HashMap<String, String>,
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
    pub pdf_files: Vec<String>,
    pub https: bool,
    pub cross_origin: SecuritySummary,
    pub psi_results: Result<Vec<Value>, String>,
    pub original_url: String,                     // The URL we requested
    pub redirect_url: Option<String>,             // The redirect URL (if any)
    pub had_redirect: bool,                       // Boolean flag for easy filtering
    pub redirection_type: Option<String>,         // Type of redirect
    pub redirect_chain: Option<Vec<RedirectHop>>, // Full redirect chain
    pub redirect_count: usize,                    // Number of hops
    pub status: Option<u16>,                      // Status of the request
    pub url_depth: Option<usize>,
    pub cookies: Result<Vec<String>, String>,
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
            inoutlinks_status_codes: LinkCheckResults {
                page: String::new(),
                base_url: Url::parse("https://www.site.com").expect("failed to set default url"),
                internal: Vec::new(),
                external: Vec::new(),
            },
            indexability: Indexability::default(),
            alt_tags: AltTags::default(),
            schema: None,
            css: CSS::default(),
            iframe: None,
            word_count: 0,
            response_time: None,
            mobile: false,
            canonicals: None,
            meta_robots: MetaRobots::default(),
            opengraph: HashMap::new(),
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
            pdf_files: Vec::new(),
            https: false,
            cross_origin: SecuritySummary {
                total_unsafe_anchors: 0,
                total_insecure_iframes: 0,
                total_mixed_content: 0,
                total_missing_cors: 0,
                total_inline_scripts: 0,
            },
            psi_results: Ok(Vec::new()),
            original_url: String::new(),
            redirect_url: None,
            had_redirect: false,
            redirection_type: None,
            redirect_chain: None,
            redirect_count: 0,
            status: None,
            url_depth: Some(0),
            cookies: Ok(Vec::new()),
        }
    }
}

#[derive(Serialize, Debug, Deserialize, Clone)]
pub struct LightCrawlResult {
    pub url: String,
    pub title: Option<Vec<TitleDetails>>,
    pub description: String,
    pub headings: HashMap<String, Vec<String>>,
    pub status_code: u16,
    pub word_count: usize,
    pub response_time: Option<f64>,
    pub mobile: bool,
    pub indexability: Indexability,
    pub language: Option<String>,
    pub schema: bool,
    pub url_depth: Option<usize>,
    pub cookies_count: usize,
    pub page_size: Vec<Sizes>,
    pub content_type: String,
    pub opengraph: bool,
    pub flesch: Option<f64>,
    pub flesch_grade: Option<String>,
    pub text_ratio: Option<f64>,
    pub extractor: Extractor,
    pub images_count: usize,
    pub images_with_alt: usize,
    pub images_without_alt: usize,
    pub css_external_count: usize,
    pub css_inline_count: usize,
    pub https: bool,
    pub security: SecuritySummary,
}

impl LightCrawlResult {
    pub fn from_full(full: &DomainCrawlResults) -> Self {
        let (img_count, img_with_alt, img_without_alt) = match &full.images {
            Ok(imgs) => {
                let with_alt = imgs.iter().filter(|i| !i.1.trim().is_empty()).count();
                (imgs.len(), with_alt, imgs.len() - with_alt)
            }
            Err(_) => (0, 0, 0),
        };

        Self {
            url: full.url.clone(),
            title: full.title.clone(),
            description: full.description.clone(),
            headings: full.headings.clone(),
            status_code: full.status_code,
            word_count: full.word_count,
            response_time: full.response_time,
            mobile: full.mobile,
            indexability: full.indexability.clone(),
            language: full.language.clone(),
            schema: full.schema.is_some(),
            url_depth: full.url_depth,
            cookies_count: match &full.cookies {
                Ok(c) => c.len(),
                Err(_) => 0,
            },
            page_size: full.page_size.clone(),
            content_type: full.content_type.clone(),
            opengraph: !full.opengraph.is_empty(),
            flesch: full.flesch.as_ref().ok().map(|(s, _)| *s),
            flesch_grade: full.flesch.as_ref().ok().map(|(_, g)| g.clone()),
            text_ratio: full
                .text_ratio
                .as_ref()
                .and_then(|tr| tr.first())
                .map(|tr| tr.text_ratio),
            extractor: full.extractor.clone(),
            images_count: img_count,
            images_with_alt: img_with_alt,
            images_without_alt: img_without_alt,
            css_external_count: full.css.external.len(),
            css_inline_count: full.css.inline.len(),
            https: full.https,
            security: full.cross_origin.clone(),
        }
    }
}
