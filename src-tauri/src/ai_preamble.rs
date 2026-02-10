use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub enum CrawlMode {
    Shallow,
    Deep,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PageMetrics {
    pub performance: String,
    pub fcp: String,
    pub lcp: String,
    pub tti: String,
    pub cls: String,
    pub speed_index: String,
    pub server_response: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SeoInfo {
    pub title: String,
    pub description: String,
    pub canonical: String,
    pub indexability: String,
    pub h1: String,
    pub word_count: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DeepCrawlSummary {
    pub total_pages: usize,
    pub total_issues: usize,
    pub domain: String,
    pub status_codes_distribution: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RustyAiContext {
    pub mode: CrawlMode,
    pub page_metrics: Option<PageMetrics>,
    pub seo_info: Option<SeoInfo>,
    pub deep_summary: Option<DeepCrawlSummary>,
}

pub fn generate_preamble(context: &RustyAiContext) -> String {
    let base = "You are RustyAI, the advanced SEO and GEO marketing assistant integrated into RustySEO. \
                You represent the pinnacle of SEO knowledge, combining technical expertise with strategic insight.";

    match context.mode {
        CrawlMode::Shallow => {
            let metrics = context.page_metrics.as_ref();
            let seo = context.seo_info.as_ref();
            
            format!(
                "{}\n\nCONTEXT: Individual Page Analysis (Shallow Crawl)\n\
                You are currently analyzing a specific URL. Here is the data captured:\n\n\
                Performance Metrics:\n\
                - Score: {}\n\
                - FCP: {}\n\
                - LCP: {}\n\
                - TTI: {}\n\
                - CLS: {}\n\
                - Speed Index: {}\n\n\
                SEO Highlights:\n\
                - Title: {}\n\
                - Description: {}\n\
                - Canonical: {}\n\
                - Indexability: {}\n\
                - Main H1: {}\n\
                - Word Count: {}\n\n\
                Provide expert advice, identify issues, and suggest improvements for this specific page.",
                base,
                metrics.map(|m| m.performance.as_str()).unwrap_or("N/A"),
                metrics.map(|m| m.fcp.as_str()).unwrap_or("N/A"),
                metrics.map(|m| m.lcp.as_str()).unwrap_or("N/A"),
                metrics.map(|m| m.tti.as_str()).unwrap_or("N/A"),
                metrics.map(|m| m.cls.as_str()).unwrap_or("N/A"),
                metrics.map(|m| m.speed_index.as_str()).unwrap_or("N/A"),
                seo.map(|s| s.title.as_str()).unwrap_or("N/A"),
                seo.map(|s| s.description.as_str()).unwrap_or("N/A"),
                seo.map(|s| s.canonical.as_str()).unwrap_or("N/A"),
                seo.map(|s| s.indexability.as_str()).unwrap_or("N/A"),
                seo.map(|s| s.h1.as_str()).unwrap_or("N/A"),
                seo.map(|s| s.word_count.as_str()).unwrap_or("N/A"),
            )
        }
        CrawlMode::Deep => {
            let summary = context.deep_summary.as_ref();
            format!(
                "{}\n\nCONTEXT: Full Domain Audit (Deep Crawl)\n\
                You are analyzing a complete website crawl for the domain: {}\n\
                Project Overview:\n\
                - Total Pages Crawled: {}\n\
                - Total SEO Issues Identified: {}\n\
                - Status Code Distribution: {}\n\n\
                Analyze the website's health as a whole. Focus on site-wide patterns, architecture, and overall SEO strategy.",
                base,
                summary.map(|s| s.domain.as_str()).unwrap_or("Unknown"),
                summary.map(|s| s.total_pages).unwrap_or(0),
                summary.map(|s| s.total_issues).unwrap_or(0),
                summary.map(|s| s.status_codes_distribution.as_str()).unwrap_or("N/A"),
            )
        }
    }
}
