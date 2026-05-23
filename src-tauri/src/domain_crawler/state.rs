//! Crawler state management types and structures

use dashmap::DashMap;
use serde::Serialize;
use std::collections::{HashMap, HashSet, VecDeque};
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::Mutex;
use url::Url;

use super::constants::MAX_PENDING_TIME;
use super::database::{Database, DatabaseResults};
use super::helpers::links_status_code_checker::SharedLinkChecker;
use super::models::DomainCrawlResults;
use super::helpers::normalize_url::normalize_url;

/// Maximum number of failed URLs to retain. Once this cap is hit the oldest
/// failures are silently discarded to prevent the set from consuming memory
/// proportional to the number of errors on a large crawl.
const MAX_FAILED_URLS: usize = 10_000;

/// Maximum number of URL patterns to track. Patterns are used to detect
/// infinite URL traps; beyond this cap new patterns are simply not tracked.
const MAX_URL_PATTERNS: usize = 20_000;

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
    pub discovered_urls: usize,
    pub robots_blocked: Option<Vec<String>>,
}

/// Crawl result structure for emitting events (batched)
#[derive(Clone, Serialize)]
pub struct CrawlResultData {
    pub results: Vec<super::models::LightCrawlResult>,
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
    pub url_patterns: HashMap<String, usize>, // Track URL patterns to avoid duplicates
    pub active_tasks: usize,           // Track number of currently processing tasks
    pub link_checker: Option<Arc<SharedLinkChecker>>,
    pub last_progress_emit: Instant,   // Track time of last progress emission
    pub last_result_emit: Instant,     // Track time of last crawl_result batch emission
    pub pending_results: Vec<super::models::LightCrawlResult>, // Buffer for batching crawl_result events
    /// Global URL → HTTP status code registry shared between the crawler and link checker.
    /// Populated by the crawler after fetching each page; read by the link checker to skip
    /// redundant HTTP requests for URLs whose status is already known.
    /// Uses DashMap (lock-free concurrent hashmap) to avoid blocking the async executor
    /// under high concurrency (many simultaneous inserts from 50+ tasks).
    pub url_status_registry: Arc<DashMap<String, u16>>,
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
            url_patterns: HashMap::new(),
            active_tasks: 0,
            link_checker: None,
            last_progress_emit: Instant::now(),
            last_result_emit: Instant::now(),
            pending_results: Vec::with_capacity(64),
            url_status_registry: Arc::new(DashMap::with_capacity(4096)),
        }
    }

    pub fn with_link_checker(mut self, link_checker: Arc<SharedLinkChecker>) -> Self {
        self.link_checker = Some(link_checker);
        self
    }

    pub fn with_url_status_registry(mut self, registry: Arc<DashMap<String, u16>>) -> Self {
        self.url_status_registry = registry;
        self
    }

    /// Clean up stale pending URLs and periodically compact collections to return
    /// memory to the OS. Called from the main crawler loop on every iteration.
    pub fn cleanup_stale_pending(&mut self) {
        let now = Instant::now();
        self.pending_urls
            .retain(|_, &mut added_time| now.duration_since(added_time) < MAX_PENDING_TIME);

        // Compact the VecDeque periodically once a significant number of items have
        // been drained from its front. VecDeque maintains a ring buffer that never
        // automatically shrinks, so without this call its allocated capacity grows
        // monotonically as the queue fills and drains across a long crawl.
        if self.queue.capacity() > self.queue.len().saturating_mul(4).max(256) {
            self.queue.shrink_to_fit();
        }

        // Periodically shrink the visited set's allocation after it plateaus.
        // HashSet doubles its capacity on resize but never shrinks; at 40K URLs the
        // backing array can be 2–4× larger than needed.
        // Only run this expensive operation every 5000 URLs to amortise the cost.
        if self.crawled_urls > 0 && self.crawled_urls % 5_000 == 0 {
            self.visited.shrink_to_fit();
            self.pending_urls.shrink_to_fit();
            self.url_patterns.shrink_to_fit();
        }

        // Evict oldest failed_urls entries if the set is over the cap.
        // FailedUrl doesn't have an ordering, so we collect into a Vec, truncate,
        // and rebuild the set. This path is uncommon (only on error-heavy crawls).
        if self.failed_urls.len() > MAX_FAILED_URLS {
            let mut v: Vec<FailedUrl> = self.failed_urls.drain().collect();
            // Keep the most-recently-recorded failures (largest timestamp).
            v.sort_unstable_by(|a, b| b.timestamp.partial_cmp(&a.timestamp)
                .unwrap_or(std::cmp::Ordering::Equal));
            v.truncate(MAX_FAILED_URLS / 2);
            self.failed_urls = v.into_iter().collect();
        }
    }

    /// Check if we should continue crawling
    pub fn should_continue(&self) -> bool {
        !self.queue.is_empty() || !self.pending_urls.is_empty() || self.active_tasks > 0
    }

    /// Check if crawl is truly complete (no pending work)
    pub fn is_truly_complete(&self) -> bool {
        self.queue.is_empty() && self.pending_urls.is_empty() && self.active_tasks == 0
    }

    /// Add multiple discovered URLs to the queue if they are new
    pub fn add_discovered_urls(&mut self, urls: HashSet<String>, base_url: &Url, _max_depth: usize, max_urls: usize) {
        for url_str in urls {
            // Normalize before any checks or queueing
            let normalized_url = normalize_url(&url_str);

            if let Ok(url) = Url::parse(&normalized_url) {
                // Basic validation: same domain check
                if url.domain() != base_url.domain() {
                    continue;
                }

                if !self.visited.contains(&normalized_url) 
                    && !self.pending_urls.contains_key(&normalized_url)
                    && self.total_urls < max_urls 
                {
                    self.queue.push_back((url.clone(), 0)); // Sitemaps seed at depth 0
                    self.total_urls += 1;
                    self.pending_urls.insert(normalized_url.clone(), Instant::now());
                }
            }
        }
    }

    /// Enter a new task and return a guard that decrements active_tasks on drop
    pub fn enter_task(state: Arc<Mutex<Self>>) -> ActiveTaskGuard {
        ActiveTaskGuard { state }
    }
}

/// RAII guard to ensure active_tasks is always decremented
pub struct ActiveTaskGuard {
    state: Arc<Mutex<CrawlerState>>,
}

impl Drop for ActiveTaskGuard {
    fn drop(&mut self) {
        let state = self.state.clone();
        tokio::spawn(async move {
            let mut state_guard = state.lock().await;
            state_guard.active_tasks = state_guard.active_tasks.saturating_sub(1);
        });
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
