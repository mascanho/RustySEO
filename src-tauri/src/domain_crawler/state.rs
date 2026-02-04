//! Crawler state management types and structures

use serde::Serialize;
use std::collections::{HashMap, HashSet, VecDeque};
use std::sync::Arc;
use std::time::Instant;
use url::Url;

use super::constants::{MAX_PENDING_TIME, MAX_URLS_PER_DOMAIN};
use super::database::{Database, DatabaseResults};
use super::helpers::links_status_code_checker::SharedLinkChecker;
use super::models::DomainCrawlResults;

/// Track failed URLs and retries
#[derive(Clone, Hash, Eq, PartialEq)]
pub struct FailedUrl {
    pub url: String,
    pub error: String,
    pub retries: usize,
    pub depth: usize,
    pub timestamp: Instant,
}

/// Progress tracking structure
#[derive(Clone, Serialize)]
pub struct ProgressData {
    pub total_urls: usize,
    pub crawled_urls: usize,
    pub percentage: f32,
    pub failed_urls_count: usize,
    pub failed_urls: Vec<String>,
    pub discovered_urls: usize,
    pub robots_blocked: Option<Vec<String>>,
}

/// Crawl result structure for emitting events
#[derive(Clone, Serialize)]
pub struct CrawlResultData {
    pub result: DomainCrawlResults,
}

/// Structure to track crawler state
pub struct CrawlerState {
    pub visited: HashSet<String>,
    pub failed_urls: HashSet<FailedUrl>,
    pub pending_urls: HashMap<String, Instant>, // Track when URLs were added to pending
    pub queue: VecDeque<(Url, usize)>,          // Include depth tracking
    pub total_urls: usize,
    pub crawled_urls: usize,
    pub db: Option<Database>,
    pub last_activity: Instant,        // Track last crawling activity
    pub url_patterns: HashSet<String>, // Track URL patterns to avoid duplicates
    pub active_tasks: usize,           // Track number of currently processing tasks
    pub link_checker: Option<Arc<SharedLinkChecker>>,
}

impl CrawlerState {
    pub fn new(db: Option<Database>) -> Self {
        Self {
            visited: HashSet::new(),
            failed_urls: HashSet::new(),
            pending_urls: HashMap::new(),
            queue: VecDeque::new(),
            total_urls: 0,
            crawled_urls: 0,
            db,
            last_activity: Instant::now(),
            url_patterns: HashSet::new(),
            active_tasks: 0,
            link_checker: None,
        }
    }

    pub fn with_link_checker(mut self, link_checker: Arc<SharedLinkChecker>) -> Self {
        self.link_checker = Some(link_checker);
        self
    }

    /// Clean up stale pending URLs
    pub fn cleanup_stale_pending(&mut self) {
        let now = Instant::now();
        self.pending_urls
            .retain(|_, &mut added_time| now.duration_since(added_time) < MAX_PENDING_TIME);
    }

    /// Check if we should continue crawling
    pub fn should_continue(&self) -> bool {
        self.total_urls < MAX_URLS_PER_DOMAIN
            && (!self.queue.is_empty() || !self.pending_urls.is_empty() || self.active_tasks > 0)
    }

    /// Check if crawl is truly complete (no pending work)
    pub fn is_truly_complete(&self) -> bool {
        self.queue.is_empty() && self.pending_urls.is_empty() && self.active_tasks == 0
    }
}

/// Convert DomainCrawlResults to DatabaseResults
pub fn to_database_results(
    result: &DomainCrawlResults,
) -> Result<DatabaseResults, serde_json::Error> {
    Ok(DatabaseResults {
        url: result.url.clone(),
        data: serde_json::to_value(result)?,
    })
}
