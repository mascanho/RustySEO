use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use sysinfo::{ProcessExt, System, SystemExt};
use tokio::fs;
use tokio::io::AsyncWriteExt;
use toml;
use uuid::Uuid;

use crate::domain_crawler::helpers::keyword_selector::default_stop_words;
use crate::domain_crawler::{self, user_agents};
use crate::loganalyser::log_state::set_taxonomies;
use crate::settings::utils::user_bots::generate_default_user_bots;
use crate::version::local_version;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    // --- System ---
    /// Current version of the application
    pub version: String,
    /// Unique ID for this instance
    pub rustyid: Uuid,

    // --- General Crawler Settings ---
    /// List of user agents to rotate
    pub user_agents: Vec<String>,
    /// Number of concurrent requests for domain crawling
    pub concurrent_requests: usize,
    /// Number of URLs to process between sleeps/checks
    pub batch_size: usize,
    /// Maximum depth to crawl
    pub max_depth: usize,
    /// Maximum URLs to crawl per domain
    pub max_urls_per_domain: usize,

    // --- Timing & Throttling (Adaptive) ---
    /// Enable adaptive crawling speed based on server response
    pub adaptive_crawling: bool,
    /// Base delay between requests (ms)
    pub base_delay: u64,
    /// Maximum delay between requests (ms)
    pub max_delay: u64,
    /// Minimum delay allowed in adaptive mode (ms)
    pub min_crawl_delay: u64,
    /// Total timeout for a crawl job (seconds)
    pub crawl_timeout: u64,
    /// Interval to check for stalled crawlers (seconds)
    pub stall_check_interval: u64,
    /// Maximum time a URL can be pending before considered stalled (seconds)
    pub max_pending_time: u64,

    // --- Request / Network ---
    /// Timeout for individual HTTP requests (seconds)
    pub client_timeout: u64,
    /// Timeout for connection establishment (seconds)
    pub client_connect_timeout: u64,
    /// Number of redirects to follow
    pub redirect_policy: usize,
    /// Maximum retries for failed requests
    pub max_retries: u32,

    // --- JavaScript & Rendering ---
    /// Whether to expect HTML content
    pub html: bool,
    /// Enable Headless Chrome rendering
    pub javascript_rendering: bool,
    /// Concurrency for Headless Chrome
    pub javascript_concurrency: usize,

    // --- Link Processor (Internal/External Check) ---
    /// Max concurrent checks for link status
    pub links_max_concurrent_requests: usize,
    /// Initial capacity for link checking tasks
    pub links_initial_task_capacity: usize,
    /// Max retries for link checks
    pub links_max_retries: usize,
    /// Delay between link check retries (ms)
    pub links_retry_delay: u64,
    /// Timeout for link check requests (seconds)
    pub links_request_timeout: u64,
    /// Jitter factor for randomized delays (0.0 - 1.0)
    pub links_jitter_factor: f32,
    /// Idle timeout for connection pool (seconds)
    pub links_pool_idle_timeout: u64,
    /// Max idle connections per host
    pub links_max_idle_per_host: usize,

    // --- Extraction & Content ---
    /// Enable N-gram extraction
    pub extract_ngrams: bool,
    /// Set of stop words for keyword extraction
    pub stop_words: HashSet<String>,
    /// Classification taxonomies
    pub taxonomies: Vec<String>,

    // --- Database & Batching ---
    /// Batch size for database inserts
    pub db_batch_size: usize,
    /// Chunk size for domain crawler results
    pub db_chunk_size_domain_crawler: usize,

    // --- Logs & File System ---
    pub log_batchsize: usize,
    pub log_chunk_size: usize,
    pub log_sleep_stream_duration: u64,
    pub log_capacity: usize,
    pub log_project_chunk_size: usize,
    pub log_file_upload_size: usize,
    pub log_bots: Vec<(String, String)>,

    // --- Integrations ---
    /// Enable PageSpeed Insights bulk fetching
    pub page_speed_bulk: bool,
    /// API Key for PageSpeed Insights
    pub page_speed_bulk_api_key: Option<Option<String>>,
    /// Row limit for GSC data
    pub gsc_row_limit: i32,
}

impl Settings {
    pub fn new() -> Self {
        Self {
            // --- System ---
            version: local_version(),
            rustyid: Uuid::new_v4(),

            // --- General Crawler Settings ---
            user_agents: user_agents::agents(),
            concurrent_requests: 10, // Reduced from 50
            batch_size: 40,
            max_depth: 50,
            max_urls_per_domain: 10000000,

            // --- Timing & Throttling ---
            adaptive_crawling: true,
            base_delay: 1000,        // Increased from 500
            max_delay: 5000,         // Reduced from 8000 (tighter range)
            min_crawl_delay: 200,
            crawl_timeout: 28800,
            stall_check_interval: 30, // SECONDS
            max_pending_time: 900,    // SECONDS

            // --- Request / Network ---
            client_timeout: 60,
            client_connect_timeout: 15,
            redirect_policy: 5,
            max_retries: 5,

            // --- JavaScript & Rendering ---
            html: false,
            javascript_rendering: false,
            javascript_concurrency: 3,

            // --- Link Processor ---
            links_max_concurrent_requests: 25, // Reduced from 250
            links_initial_task_capacity: 100,
            links_max_retries: 3,
            links_retry_delay: 500, // Reduced to allow faster adaptive crawling
            links_request_timeout: 15,
            links_jitter_factor: 0.5, // Increased from 0.3
            links_pool_idle_timeout: 60,
            links_max_idle_per_host: 10,

            // --- Extraction & Content ---
            extract_ngrams: false,
            stop_words: default_stop_words(),
            taxonomies: set_taxonomies(),

            // --- Database & Batching ---
            db_batch_size: 200,
            db_chunk_size_domain_crawler: 500,

            // --- Logs & File System ---
            log_batchsize: 2,
            log_chunk_size: 500000,
            log_sleep_stream_duration: 1,
            log_capacity: 1,
            log_project_chunk_size: 1,
            log_file_upload_size: 75, // THE DEFAULT VALUE TO FILE UPLOADING
            log_bots: generate_default_user_bots(),

            // --- Integrations ---
            page_speed_bulk: false,
            page_speed_bulk_api_key: None,
            gsc_row_limit: 25000,
        }
    }

    pub fn generate_commented_config(&self) -> String {
        let mut s = String::new();

        s.push_str("# --- System ---\n");
        s.push_str("/// Current version of the application\n");
        s.push_str(&format!("version = {:?}\n", self.version));
        s.push_str("/// Unique ID for this instance\n");
        s.push_str(&format!("rustyid = {:?}\n", self.rustyid));

        s.push_str("\n# --- General Crawler Settings ---\n");
        s.push_str("/// List of user agents to rotate\n");
        let ua = serde_json::to_string(&self.user_agents).unwrap_or_else(|_| "[]".to_string());
        s.push_str(&format!("user_agents = {}\n", ua));

        s.push_str("/// Number of concurrent requests for domain crawling\n");
        s.push_str(&format!("concurrent_requests = {}\n", self.concurrent_requests));

        s.push_str("/// Number of URLs to process between sleeps/checks\n");
        s.push_str(&format!("batch_size = {}\n", self.batch_size));

        s.push_str("/// Maximum depth to crawl\n");
        s.push_str(&format!("max_depth = {}\n", self.max_depth));

        s.push_str("/// Maximum URLs to crawl per domain\n");
        s.push_str(&format!("max_urls_per_domain = {}\n", self.max_urls_per_domain));

        s.push_str("\n# --- Timing & Throttling (Adaptive) ---\n");
        s.push_str("/// Enable adaptive crawling speed based on server response\n");
        s.push_str(&format!("adaptive_crawling = {}\n", self.adaptive_crawling));

        s.push_str("/// Base delay between requests (ms)\n");
        s.push_str(&format!("base_delay = {}\n", self.base_delay));

        s.push_str("/// Maximum delay between requests (ms)\n");
        s.push_str(&format!("max_delay = {}\n", self.max_delay));

        s.push_str("/// Minimum delay allowed in adaptive mode (ms)\n");
        s.push_str(&format!("min_crawl_delay = {}\n", self.min_crawl_delay));

        s.push_str("/// Total timeout for a crawl job (seconds)\n");
        s.push_str(&format!("crawl_timeout = {}\n", self.crawl_timeout));

        s.push_str("/// Interval to check for stalled crawlers (seconds)\n");
        s.push_str(&format!("stall_check_interval = {}\n", self.stall_check_interval));

        s.push_str("/// Maximum time a URL can be pending before considered stalled (seconds)\n");
        s.push_str(&format!("max_pending_time = {}\n", self.max_pending_time));

        s.push_str("\n# --- Request / Network ---\n");
        s.push_str("/// Timeout for individual HTTP requests (seconds)\n");
        s.push_str(&format!("client_timeout = {}\n", self.client_timeout));

        s.push_str("/// Timeout for connection establishment (seconds)\n");
        s.push_str(&format!("client_connect_timeout = {}\n", self.client_connect_timeout));

        s.push_str("/// Number of redirects to follow\n");
        s.push_str(&format!("redirect_policy = {}\n", self.redirect_policy));

        s.push_str("/// Maximum retries for failed requests\n");
        s.push_str(&format!("max_retries = {}\n", self.max_retries));

        s.push_str("\n# --- JavaScript & Rendering ---\n");
        s.push_str("/// Whether to expect HTML content\n");
        s.push_str(&format!("html = {}\n", self.html));

        s.push_str("/// Enable Headless Chrome rendering\n");
        s.push_str(&format!("javascript_rendering = {}\n", self.javascript_rendering));

        s.push_str("/// Concurrency for Headless Chrome\n");
        s.push_str(&format!("javascript_concurrency = {}\n", self.javascript_concurrency));

        s.push_str("\n# --- Link Processor (Internal/External Check) ---\n");
        s.push_str("/// Max concurrent checks for link status\n");
        s.push_str(&format!(
            "links_max_concurrent_requests = {}\n",
            self.links_max_concurrent_requests
        ));

        s.push_str("/// Initial capacity for link checking tasks\n");
        s.push_str(&format!(
            "links_initial_task_capacity = {}\n",
            self.links_initial_task_capacity
        ));

        s.push_str("/// Max retries for link checks\n");
        s.push_str(&format!("links_max_retries = {}\n", self.links_max_retries));

        s.push_str("/// Delay between link check retries (ms)\n");
        s.push_str(&format!("links_retry_delay = {}\n", self.links_retry_delay));

        s.push_str("/// Timeout for link check requests (seconds)\n");
        s.push_str(&format!("links_request_timeout = {}\n", self.links_request_timeout));

        s.push_str("/// Jitter factor for randomized delays (0.0 - 1.0)\n");
        s.push_str(&format!("links_jitter_factor = {}\n", self.links_jitter_factor));

        s.push_str("/// Idle timeout for connection pool (seconds)\n");
        s.push_str(&format!("links_pool_idle_timeout = {}\n", self.links_pool_idle_timeout));

        s.push_str("/// Max idle connections per host\n");
        s.push_str(&format!("links_max_idle_per_host = {}\n", self.links_max_idle_per_host));

        s.push_str("\n# --- Extraction & Content ---\n");
        s.push_str("/// Enable N-gram extraction\n");
        s.push_str(&format!("extract_ngrams = {}\n", self.extract_ngrams));

        s.push_str("/// Set of stop words for keyword extraction\n");
        let stop_words =
            serde_json::to_string(&self.stop_words).unwrap_or_else(|_| "[]".to_string());
        s.push_str(&format!("stop_words = {}\n", stop_words));

        s.push_str("/// Classification taxonomies\n");
        let taxonomies =
            serde_json::to_string(&self.taxonomies).unwrap_or_else(|_| "[]".to_string());
        s.push_str(&format!("taxonomies = {}\n", taxonomies));

        s.push_str("\n# --- Database & Batching ---\n");
        s.push_str("/// Batch size for database inserts\n");
        s.push_str(&format!("db_batch_size = {}\n", self.db_batch_size));

        s.push_str("/// Chunk size for domain crawler results\n");
        s.push_str(&format!(
            "db_chunk_size_domain_crawler = {}\n",
            self.db_chunk_size_domain_crawler
        ));

        s.push_str("\n# --- Logs & File System ---\n");
        s.push_str("# log_batchsize\n");
        s.push_str(&format!("log_batchsize = {}\n", self.log_batchsize));
        s.push_str("# log_chunk_size\n");
        s.push_str(&format!("log_chunk_size = {}\n", self.log_chunk_size));
        s.push_str("# log_sleep_stream_duration\n");
        s.push_str(&format!(
            "log_sleep_stream_duration = {}\n",
            self.log_sleep_stream_duration
        ));
        s.push_str("# log_capacity\n");
        s.push_str(&format!("log_capacity = {}\n", self.log_capacity));
        s.push_str("# log_project_chunk_size\n");
        s.push_str(&format!(
            "log_project_chunk_size = {}\n",
            self.log_project_chunk_size
        ));
        s.push_str("# log_file_upload_size\n");
        s.push_str(&format!("log_file_upload_size = {}\n", self.log_file_upload_size));

        s.push_str("# Log Bots\n");
        let log_bots = serde_json::to_string(&self.log_bots).unwrap_or_else(|_| "[]".to_string());
        s.push_str(&format!("log_bots = {}\n", log_bots));

        s.push_str("\n# --- Integrations ---\n");
        s.push_str("/// Enable PageSpeed Insights bulk fetching\n");
        s.push_str(&format!("page_speed_bulk = {}\n", self.page_speed_bulk));

        if let Some(Some(key)) = &self.page_speed_bulk_api_key {
            s.push_str("/// API Key for PageSpeed Insights\n");
            s.push_str(&format!("page_speed_bulk_api_key = {:?}\n", key));
        }

        s.push_str("/// Row limit for GSC data\n");
        s.push_str(&format!("gsc_row_limit = {}\n", self.gsc_row_limit));

        s
    }

    pub fn config_path() -> Result<PathBuf, String> {
        ProjectDirs::from("", "", "rustyseo")
            .ok_or("Failed to determine config directory".to_string())
            .map(|dirs| dirs.config_dir().join("configs.toml"))
    }

    // Delete the file
    pub fn delete_file() -> Result<(), String> {
        let config_path = Self::config_path()?;
        std::fs::remove_file(config_path).map_err(|e| e.to_string())
    }
}

impl Default for Settings {
    fn default() -> Self {
        Self::new()
    }
}

/// Loads settings from file (returns error if file doesn't exist)
pub async fn load_settings() -> Result<Settings, String> {
    let config_path = Settings::config_path()?;
    let contents = fs::read_to_string(&config_path)
        .await
        .map_err(|e| format!("Failed to read config: {}", e))?;
    toml::from_str(&contents).map_err(|e| format!("Failed to parse config: {}", e))
}

/// Creates a new config file if it doesn't exist
pub async fn create_config_file() -> Result<Settings, String> {
    let config_path = Settings::config_path()?;
    println!("Config path: {:?}", config_path);

    if let Some(parent) = config_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .await
                .map_err(|e| format!("Failed to create config dir: {}", e))?;
        }
    }

    let settings = Settings::new();

    if !config_path.exists() {
        let toml_str = settings.generate_commented_config();
        
        fs::write(&config_path, toml_str)
            .await
            .map_err(|e| format!("Failed to write config: {}", e))?;
        println!("✅ Config file created at {:?}", config_path);
    } else {
        println!("⚠️ Config file already exists at {:?}", config_path);
    }

    Ok(settings)
}

/// Initializes settings (loads or creates if missing)
pub async fn init_settings() -> Result<Settings, String> {
    println!("Attempting to load settings...");
    match load_settings().await {
        Ok(settings) => {
            println!("Settings loaded successfully.");
            Ok(settings)
        }
        Err(e) => {
            println!("Failed to load settings: {}. Creating config file...", e);
            create_config_file().await
        }
    }
}

pub fn print_settings(settings: &Settings) {
    // Use the settings
    println!("Version: {}", settings.version);
    println!("Crawl Timeout: {:?}", settings.crawl_timeout);
    println!("Client Timeout: {:?}", settings.client_timeout);
    println!(
        "Client Connect Timeout: {:?}",
        settings.client_connect_timeout
    );
    println!("Redirect Policy: {:?}", settings.redirect_policy);
    println!("Max Retries: {}", settings.max_retries);
    println!("Base Delay: {}", settings.base_delay);
    println!("Max Delay: {}", settings.max_delay);
    println!("Concurrent Requests: {}", settings.concurrent_requests);
    println!("Batch Size: {}", settings.batch_size);
    println!("DB Batch Size: {}", settings.db_batch_size);
    println!(
        "Links Concurrent Requests: {}",
        settings.links_max_concurrent_requests
    );
    println!("User Agents: {:?}", settings.user_agents);
    println!("HTML: {}", settings.html);
    println!(
        "Links Initial Task Capacity: {}",
        settings.links_initial_task_capacity
    );
    println!("Links Max Retries: {}", settings.links_max_retries);
    println!("Links Retry Delay: {}", settings.links_retry_delay);
    println!("Links Request Timeout: {}", settings.links_request_timeout);
    println!("Taxonomies: {:?}", settings.taxonomies);
    println!("Rusty ID: {}", settings.rustyid);
    println!("Page Speed Bulkd: {}", settings.page_speed_bulk);
    if let Some(key) = &settings.page_speed_bulk_api_key {
        println!("Page Speed Bulk API Key: {:#?}", key);
    } else {
        println!("Page Speed Bulk API Key: None");
    }

    println!("Log Batchsize: {}", settings.log_batchsize);
    println!("Log Chunksize: {}", settings.log_chunk_size);
    println!(
        "Log Sleep Stream Duration: {}",
        settings.log_sleep_stream_duration
    );

    println!("Log Capacity: {}", settings.log_capacity);
    println!(
        "Log Chunk Size Project: {}",
        settings.log_project_chunk_size
    );

    println!("Log File Upload Size: {}", settings.log_file_upload_size);

    println!("Ngrams: {}", settings.extract_ngrams);

    println!("Log Bots: {:#?}", settings.log_bots);

    println!("GSC Row Limit: {}", settings.gsc_row_limit);
    println!("Adaptive Crawling: {}", settings.adaptive_crawling);
    println!("Min Crawl Delay: {}", settings.min_crawl_delay);

    println!("")
}

pub async fn override_settings(updates: &str) -> Result<Settings, String> {
    // Load current settings or create new ones
    let mut settings = init_settings().await?;

    // Parse updates into a HashMap
    let updates: HashMap<String, toml::Value> =
        toml::from_str(updates).map_err(|e| format!("Failed to parse updates: {}", e))?;

    // Apply updates (only fields that were provided)
    if let Some(val) = updates
        .get("page_speed_bulk_api_key")
        .and_then(|v| v.as_str())
    {
        settings.page_speed_bulk_api_key = Some(Some(val.to_string()));
    }

    if let Some(val) = updates.get("crawl_timeout").and_then(|v| v.as_integer()) {
        settings.crawl_timeout = val as u64;
    }

    if let Some(val) = updates.get("client_timeout").and_then(|v| v.as_integer()) {
        settings.client_timeout = val as u64;
    }

    if let Some(val) = updates
        .get("client_connect_timeout")
        .and_then(|v| v.as_integer())
    {
        settings.client_connect_timeout = val as u64;
    }

    if let Some(val) = updates.get("redirect_policy").and_then(|v| v.as_integer()) {
        settings.redirect_policy = val as usize;
    }

    if let Some(val) = updates.get("max_retries").and_then(|v| v.as_integer()) {
        settings.max_retries = val as u32;
    }

    if let Some(val) = updates.get("base_delay").and_then(|v| v.as_integer()) {
        settings.base_delay = val as u64;
    }

    if let Some(val) = updates.get("max_delay").and_then(|v| v.as_integer()) {
        settings.max_delay = val as u64;
    }

    if let Some(val) = updates
        .get("concurrent_requests")
        .and_then(|v| v.as_integer())
    {
        settings.concurrent_requests = val as usize;
    }

    if let Some(val) = updates.get("batch_size").and_then(|v| v.as_integer()) {
        settings.batch_size = val as usize;
    }

    if let Some(val) = updates.get("db_batch_size").and_then(|v| v.as_integer()) {
        settings.db_batch_size = val as usize;
    }

    if let Some(val) = updates.get("user_agents").and_then(|v| v.as_array()) {
        settings.user_agents = val
            .iter()
            .filter_map(|v| v.as_str())
            .map(|s| s.to_string())
            .collect();
    }

    if let Some(val) = updates.get("html").and_then(|v| v.as_bool()) {
        settings.html = val;
    }

    if let Some(val) = updates
        .get("links_max_concurrent_requests")
        .and_then(|v| v.as_integer())
    {
        settings.links_max_concurrent_requests = val as usize;
    }

    if let Some(val) = updates
        .get("links_initial_task_capacity")
        .and_then(|v| v.as_integer())
    {
        settings.links_initial_task_capacity = val as usize;
    }

    if let Some(val) = updates
        .get("links_max_retries")
        .and_then(|v| v.as_integer())
    {
        settings.links_max_retries = val as usize;
    }

    if let Some(val) = updates
        .get("links_retry_delay")
        .and_then(|v| v.as_integer())
    {
        settings.links_retry_delay = val as u64;
    }

    if let Some(val) = updates
        .get("links_request_timeout")
        .and_then(|v| v.as_integer())
    {
        settings.links_request_timeout = val as u64;
    }

    if let Some(val) = updates.get("page_speed_bulk").and_then(|v| v.as_bool()) {
        settings.page_speed_bulk = val;
    }

    if let Some(val) = updates.get("taxonomies").and_then(|v| v.as_array()) {
        settings.taxonomies = val
            .iter()
            .filter_map(|v| v.as_str())
            .map(|s| s.to_string())
            .collect();
    }

    // Add the new settings
    if let Some(val) = updates.get("log_batchsize").and_then(|v| v.as_integer()) {
        settings.log_batchsize = val as usize;
    }

    if let Some(val) = updates.get("log_chunk_size").and_then(|v| v.as_integer()) {
        settings.log_chunk_size = val as usize;
    }

    if let Some(val) = updates
        .get("log_sleep_stream_duration")
        .and_then(|v| v.as_integer())
    {
        settings.log_sleep_stream_duration = val as u64;
    }

    if let Some(val) = updates.get("log_capacity").and_then(|v| v.as_integer()) {
        settings.log_capacity = val as usize;
    }

    if let Some(val) = updates
        .get("log_chunk_size_project")
        .and_then(|v| v.as_integer())
    {
        settings.log_project_chunk_size = val as usize;
    }

    if let Some(val) = updates
        .get("log_file_upload_size")
        .and_then(|v| v.as_integer())
    {
        settings.log_file_upload_size = val as usize;
    }

    if let Some(val) = updates.get("extract_ngrams").and_then(|v| v.as_bool()) {
        settings.extract_ngrams = val;
    }

    if let Some(val) = updates.get("gsc_row_limit").and_then(|v| v.as_integer()) {
        settings.gsc_row_limit = val as i32;
    }

    if let Some(val) = updates
        .get("javascript_rendering")
        .and_then(|v| v.as_bool())
    {
        settings.javascript_rendering = val;
    }

    if let Some(val) = updates
        .get("javascript_concurrency")
        .and_then(|v| v.as_integer())
    {
        settings.javascript_concurrency = val as usize;
    }

    if let Some(val) = updates
        .get("stall_check_interval")
        .and_then(|v| v.as_integer())
    {
        settings.stall_check_interval = val as u64;
    }

    if let Some(val) = updates
        .get("max_concurrent_requests")
        .and_then(|v| v.as_integer())
    {
        settings.max_pending_time = val as u64;
    }

    if let Some(val) = updates.get("max_depth").and_then(|v| v.as_integer()) {
        settings.max_depth = val as usize;
    }

    if let Some(val) = updates
        .get("max_urls_per_domain")
        .and_then(|v| v.as_integer())
    {
        settings.max_urls_per_domain = val as usize;
    }

    if let Some(val) = updates
        .get("links_jitter_factor")
        .and_then(|v| v.as_float())
    {
        settings.links_jitter_factor = val as f32;
    }

    if let Some(val) = updates
        .get("links_pool_idle_timeout")
        .and_then(|v| v.as_integer())
    {
        settings.links_pool_idle_timeout = val as u64;
    }

    if let Some(val) = updates
        .get("links_pool_idle_timeout")
        .and_then(|v| v.as_integer())
    {
        settings.links_max_idle_per_host = val as usize;
    }

    if let Some(val) = updates
        .get("db_chunk_size_domain_crawler")
        .and_then(|v| v.as_integer())
    {
        settings.db_chunk_size_domain_crawler = val as usize;
    }

    if let Some(val) = updates.get("adaptive_crawling").and_then(|v| v.as_bool()) {
        settings.adaptive_crawling = val;
    }

    if let Some(val) = updates.get("min_crawl_delay").and_then(|v| v.as_integer()) {
        settings.min_crawl_delay = val as u64;
    }

    // Explicit file writing with flush
    let config_path = Settings::config_path()?;
    let toml_str = toml::to_string_pretty(&settings) // prettier formatting
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    let mut file = fs::File::create(&config_path)
        .await
        .map_err(|e| format!("Failed to create config file: {}", e))?;

    AsyncWriteExt::write_all(&mut file, toml_str.as_bytes())
        .await
        .map_err(|e| format!("Failed to write config: {}", e))?;

    file.flush()
        .await // Ensure data is written to disk
        .map_err(|e| format!("Failed to flush config: {}", e))?;

    Ok(settings)
}

#[tauri::command]
pub async fn get_project_chunk_size_command() -> Result<usize, String> {
    let settings = load_settings().await?;
    Ok(settings.log_project_chunk_size)
}

#[tauri::command]
pub async fn get_log_file_upload_size_command() -> Result<usize, String> {
    let settings = load_settings().await?;
    Ok(settings.log_file_upload_size)
}

#[tauri::command]
pub fn get_system() -> Result<Value, String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    Ok(json!({
        "totalMemory": sys.total_memory(),
        "usedMemory": sys.used_memory(),
        "totalSwap": sys.total_swap(),
        "usedSwap": sys.used_swap(),

        // System Information
        "systemName": sys.name(),
        "kernelVersion" : sys.kernel_version(),
        "osVersion": sys.os_version(),
        "hostName": sys.host_name(),
        "cpus": sys.cpus().len(),

    }))
}

// REMOVE ALL THE FOLDERS IN THE CONFIG PATH
#[tauri::command]
pub async fn delete_config_folders_command() -> Result<(), String> {
    let config_path = directories::ProjectDirs::from("", "", "rustyseo")
        .ok_or("Failed to determine config directory".to_string())?
        .config_dir()
        .to_path_buf();
    if config_path.exists() {
        fs::remove_dir_all(&config_path)
            .await
            .map_err(|e| format!("Failed to delete config directory: {}", e))?;
        println!("✅ Config directory deleted at {:?}", config_path);
    } else {
        println!("⚠️ Config directory does not exist at {:?}", config_path);
    }
    Ok(())
}

// OPEN THE CONFIG FOLDER IN THE FILE EXPLORER
#[tauri::command]
pub fn open_config_folder_command() -> Result<(), String> {
    let config_path = directories::ProjectDirs::from("", "", "rustyseo")
        .ok_or("Failed to determine config directory".to_string())?
        .config_dir()
        .to_path_buf();

    if config_path.exists() {
        if cfg!(target_os = "windows") {
            std::process::Command::new("explorer")
                .arg(config_path)
                .spawn()
                .map_err(|e| format!("Failed to open config folder: {}", e))?;
        } else if cfg!(target_os = "macos") {
            std::process::Command::new("open")
                .arg(config_path)
                .spawn()
                .map_err(|e| format!("Failed to open config folder: {}", e))?;
        } else if cfg!(target_os = "linux") {
            std::process::Command::new("xdg-open")
                .arg(config_path)
                .spawn()
                .map_err(|e| format!("Failed to open config folder: {}", e))?;
        }
        Ok(())
    } else {
        Err("Config folder does not exist".to_string())
    }
}

// COMMAND TO GET ANY SETTINGS INTO THE FRONT END TO BE USED
#[tauri::command]
pub async fn get_settings_command() -> Result<Settings, String> {
    let settings = load_settings().await?;
    Ok(settings)
}

#[tauri::command]
pub async fn toggle_javascript_rendering(
    value: bool,
    app_handle: tauri::AppHandle,
    settings_state: tauri::State<'_, crate::AppState>,
) -> Result<(), String> {
    let state = format!("javascript_rendering = {}", value);

    let updated_settings = override_settings(&state).await?;

    let mut settings_lock = settings_state.settings.write().await;
    *settings_lock = updated_settings;

    println!("Javascript Rendering set to: {}", value);

    use tauri::Emitter;
    app_handle
        .emit("javascript-rendering-toggled", value)
        .map_err(|e| format!("Failed to emit event: {}", e))?;

    Ok(())
}
