//! Crawler constants and configuration values

use tokio::time::Duration;

// TODO: Clean this up and implement the constants from settings crate
// Constants for crawler behavior
pub const MAX_RETRIES: usize = 5;
pub const BASE_DELAY: u64 = 500;
pub const MAX_DELAY: u64 = 8000;
pub const CONCURRENT_REQUESTS: usize = 150;
pub const CRAWL_TIMEOUT: Duration = Duration::from_secs(28800); // 8 hours
pub const BATCH_SIZE: usize = 20;
pub const DB_BATCH_SIZE: usize = 100; // Increased for better database write efficiency

// Constants to prevent infinite crawling
pub const MAX_URLS_PER_DOMAIN: usize = 50000; // Maximum URLs to crawl per domain (increased)
pub const MAX_DEPTH: usize = 50; // Maximum crawl depth (increased)
pub const MAX_PENDING_TIME: Duration = Duration::from_secs(900); // 15 minutes max pending time (increased)
pub const STALL_CHECK_INTERVAL: Duration = Duration::from_secs(30); // Check for stalls every 30s
pub const JS_CONCURRENCY: usize = 2; // Limit concurrent headless chrome instances
