use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub enum CrawlMode {
    Shallow,
    Deep,
    LogAnalyser,
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
    pub reading_time: String,
    pub reading_level: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DeepCrawlSummary {
    pub total_pages: usize,
    pub total_issues: usize,
    pub domain: String,
    pub status_codes_distribution: String,
    pub depth_distribution: String,
    pub avg_response_time: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct TrendTotalsSummary {
    pub path_count: usize,
    pub path_hits: usize,
    pub status_count: usize,
    pub status_hits: usize,
    pub method_count: usize,
    pub method_hits: usize,
    pub user_agent_count: usize,
    pub user_agent_hits: usize,
    pub referer_count: usize,
    pub referer_hits: usize,
    pub browser_count: usize,
    pub browser_hits: usize,
    pub verified_count: usize,
    pub verified_hits: usize,
    pub ip_count: usize,
    pub ip_hits: usize,
    pub human_count: usize,
    pub human_hits: usize,
    pub top_paths: Option<Vec<(String, usize)>>,
    pub top_status_codes: Option<Vec<(String, usize)>>,
    pub top_user_agents: Option<Vec<(String, usize)>>,
    pub top_referrers: Option<Vec<(String, usize)>>,
    pub top_browsers: Option<Vec<(String, usize)>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LogAnalysisSummary {
    pub total_lines: usize,
    pub unique_ips: usize,
    pub crawler_count: usize,
    pub success_rate: String,
    pub bot_breakdown: String,
    pub top_pages: String,
    pub file_types: Option<String>,
    pub status_codes: Option<String>,
    pub content_segments: Option<String>,
    pub specialized_bots: Option<String>,
    pub trend_totals: Option<TrendTotalsSummary>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RustyAiContext {
    pub mode: CrawlMode,
    pub page_metrics: Option<PageMetrics>,
    pub seo_info: Option<SeoInfo>,
    pub deep_summary: Option<DeepCrawlSummary>,
    pub log_summary: Option<LogAnalysisSummary>,
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
                - Word Count: {}\n\
                - Reading Time: {}\n\
                - Reading Level: {}\n\n\
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
                seo.map(|s| s.reading_time.as_str()).unwrap_or("N/A"),
                seo.map(|s| s.reading_level.as_str()).unwrap_or("N/A"),
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
                - Status Code Distribution: {}\n\
                - Crawl Depth Distribution: {}\n\
                - Average Response Time: {}\n\n\
                Analyze the website's health as a whole. Focus on site-wide patterns, architecture, and overall SEO strategy.",
                base,
                summary.map(|s| s.domain.as_str()).unwrap_or("Unknown"),
                summary.map(|s| s.total_pages).unwrap_or(0),
                summary.map(|s| s.total_issues).unwrap_or(0),
                summary.map(|s| s.status_codes_distribution.as_str()).unwrap_or("N/A"),
                summary.map(|s| s.depth_distribution.as_str()).unwrap_or("N/A"),
                summary.map(|s| s.avg_response_time.as_str()).unwrap_or("N/A"),
            )
        }
        CrawlMode::LogAnalyser => {
            let summary = context.log_summary.as_ref();
            let mut insights = format!(
                "{}\n\nCONTEXT: Log File Analysis\n\
                You are analyzing server access logs to understand bot behavior and site usage.\n\
                Log Insights:\n\
                - Total Lines Processed: {}\n\
                - Unique IP Addresses: {}\n\
                - Search Engine Crawler Hits: {}\n\
                - Success Rate (2xx/3xx): {}\n\
                - Bot Breakdown: {}\n\
                - Top Pages: {}\n",
                base,
                summary.map(|s| s.total_lines).unwrap_or(0),
                summary.map(|s| s.unique_ips).unwrap_or(0),
                summary.map(|s| s.crawler_count).unwrap_or(0),
                summary.map(|s| s.success_rate.as_str()).unwrap_or("N/A"),
                summary.map(|s| s.bot_breakdown.as_str()).unwrap_or("N/A"),
                summary.map(|s| s.top_pages.as_str()).unwrap_or("N/A"),
            );

            if let Some(s) = summary {
                if let Some(ft) = &s.file_types { insights.push_str(&format!("- File Types: {}\n", ft)); }
                if let Some(sc) = &s.status_codes { insights.push_str(&format!("- Status Codes: {}\n", sc)); }
                if let Some(sb) = &s.specialized_bots { insights.push_str(&format!("- Specialized Bots: {}\n", sb)); }
                
                if let Some(tt) = &s.trend_totals {
                    insights.push_str("\nTrend Totals:\n");
                    insights.push_str(&format!("- Paths: {} (hits: {})\n", tt.path_count, tt.path_hits));
                    insights.push_str(&format!("- Status Codes: {} (hits: {})\n", tt.status_count, tt.status_hits));
                    insights.push_str(&format!("- User Agents: {} (hits: {})\n", tt.user_agent_count, tt.user_agent_hits));
                    insights.push_str(&format!("- Referrers: {} (hits: {})\n", tt.referer_count, tt.referer_hits));
                    insights.push_str(&format!("- Browsers: {} (hits: {})\n", tt.browser_count, tt.browser_hits));
                    insights.push_str(&format!("- Verified Bots: {} (hits: {})\n", tt.verified_count, tt.verified_hits));
                    insights.push_str(&format!("- IP Addresses: {} (hits: {})\n", tt.ip_count, tt.ip_hits));
                    insights.push_str(&format!("- Human Traffic: {} (hits: {})\n", tt.human_count, tt.human_hits));

                    if let Some(tp) = &tt.top_paths {
                        insights.push_str("\nTop 10 Paths by Frequency:\n");
                        for (p, h) in tp.iter().take(10) { insights.push_str(&format!("  {}: {} hits\n", p, h)); }
                    }
                    if let Some(tsc) = &tt.top_status_codes {
                        insights.push_str("\nTop Status Codes:\n");
                        for (sc, h) in tsc.iter().take(5) { insights.push_str(&format!("  {}: {} hits\n", sc, h)); }
                    }
                    if let Some(tua) = &tt.top_user_agents {
                        insights.push_str("\nTop User Agents:\n");
                        for (ua, h) in tua.iter().take(5) { insights.push_str(&format!("  {}: {} hits\n", ua, h)); }
                    }
                    if let Some(tr) = &tt.top_referrers {
                        insights.push_str("\nTop Referrers:\n");
                        for (r, h) in tr.iter().take(5) { insights.push_str(&format!("  {}: {} hits\n", r, h)); }
                    }
                }
            }

            insights.push_str("\nIdentify crawl budget issues, orphan pages, or suspicious bot activity based on these logs.");
            insights
        }
    }
}
