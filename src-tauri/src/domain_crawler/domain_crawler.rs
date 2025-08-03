use colored::*;
use futures::stream::{self, StreamExt};
use rand::Rng;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet, VecDeque};
use std::io::Write;
use std::sync::{Arc, RwLock};
use std::time::Instant;
use tauri::{Emitter, Manager};
use tokio::sync::{Mutex, Semaphore};
use tokio::task;
use tokio::time::{sleep, Duration};
use url::Url;

use crate::crawler::get_page_speed_insights;
use crate::domain_crawler::database::{Database, DatabaseResults};
use crate::domain_crawler::extractors::html::extract_html;
use crate::domain_crawler::helpers::https_checker::valid_https;
use crate::domain_crawler::models::Extractor;
use crate::domain_crawler::user_agents;
use crate::settings::settings::Settings;
use crate::AppState;

use super::database::{self, DatabaseError};
use super::helpers::canonical_selector::get_canonical;
use super::helpers::cross_origin::analyze_cross_origin_security;
use super::helpers::flesch_reader::get_flesch_score;
use super::helpers::hreflang_selector::select_hreflang;
use super::helpers::html_size_calculator::calculate_html_size;
use super::helpers::keyword_selector::extract_keywords;
use super::helpers::language_selector::detect_language;
use super::helpers::links_status_code_checker::get_links_status_code;
use super::helpers::meta_robots_selector::{get_meta_robots, MetaRobots};
use super::helpers::text_ratio::{get_text_ratio, TextRatio};
use super::helpers::{
    alt_tags, anchor_links, check_html_page,
    css_selector::{self, extract_css},
    domain_checker::url_check,
    headings_selector, iframe_selector, images_selector, indexability, javascript_selector,
    links_selector,
    mobile_checker::is_mobile,
    page_description,
    pdf_selector::extract_pdf_links,
    schema_selector, title_selector,
    word_count::{self, get_word_count},
};
use super::helpers::{pdf_checker, pdf_selector};
use super::models::DomainCrawlResults;
use super::page_speed::bulk::fetch_psi_bulk;
use super::page_speed::model::Crawler;

// Constants for crawler behavior
const MAX_RETRIES: usize = 5;
const BASE_DELAY: u64 = 500;
const MAX_DELAY: u64 = 8000;
const CONCURRENT_REQUESTS: usize = 150;
const CRAWL_TIMEOUT: Duration = Duration::from_secs(28800); // 8 hours
const BATCH_SIZE: usize = 20;
const DB_BATCH_SIZE: usize = 100; // Increased for better database write efficiency

// New constants to prevent infinite crawling
const MAX_URLS_PER_DOMAIN: usize = 10000; // Maximum URLs to crawl per domain
const MAX_DEPTH: usize = 10; // Maximum crawl depth
const MAX_PENDING_TIME: Duration = Duration::from_secs(300); // 5 minutes max pending time
const STALL_CHECK_INTERVAL: Duration = Duration::from_secs(30); // Check for stalls every 30s

// Progress tracking structure
#[derive(Clone, Serialize)]
struct ProgressData {
    total_urls: usize,
    crawled_urls: usize,
    percentage: f32,
    failed_urls: usize,
}

// Crawl result structure
#[derive(Clone, Serialize)]
struct CrawlResultData {
    result: DomainCrawlResults,
}

// Structure to track crawler state
pub struct CrawlerState {
    pub visited: HashSet<String>,
    pub failed_urls: HashSet<String>,
    pub pending_urls: HashMap<String, Instant>, // Track when URLs were added to pending
    pub queue: VecDeque<(Url, usize)>,          // Include depth tracking
    pub total_urls: usize,
    pub crawled_urls: usize,
    pub db: Option<Database>,
    pub last_activity: Instant,        // Track last crawling activity
    pub url_patterns: HashSet<String>, // Track URL patterns to avoid duplicates
}

impl CrawlerState {
    fn new(db: Option<Database>) -> Self {
        CrawlerState {
            visited: HashSet::new(),
            failed_urls: HashSet::new(),
            pending_urls: HashMap::new(),
            queue: VecDeque::new(),
            total_urls: 0,
            crawled_urls: 0,
            db,
            last_activity: Instant::now(),
            url_patterns: HashSet::new(),
        }
    }

    // Clean up stale pending URLs
    fn cleanup_stale_pending(&mut self) {
        let now = Instant::now();
        self.pending_urls
            .retain(|_, &mut added_time| now.duration_since(added_time) < MAX_PENDING_TIME);
    }

    // Check if we should continue crawling
    fn should_continue(&self) -> bool {
        self.total_urls < MAX_URLS_PER_DOMAIN
            && (!self.queue.is_empty() || !self.pending_urls.is_empty())
    }
}

fn to_database_results(result: &DomainCrawlResults) -> Result<DatabaseResults, serde_json::Error> {
    Ok(DatabaseResults {
        url: result.url.clone(),
        data: serde_json::to_value(result)?,
    })
}

// Fetch URL with exponential backoff
async fn fetch_with_exponential_backoff(
    client: &Client,
    url: &str,
    settings: &Settings,
) -> Result<(reqwest::Response, f64), reqwest::Error> {
    let mut attempt = 0;
    loop {
        let start = Instant::now();
        match client.get(url).send().await {
            Ok(response) => {
                let duration = start.elapsed().as_secs_f64();
                if response.status() == reqwest::StatusCode::TOO_MANY_REQUESTS {
                    if attempt >= settings.max_retries {
                        return Ok((response, duration));
                    }
                    let delay = std::cmp::min(
                        settings.max_delay,
                        settings.base_delay * 2u64.pow(attempt as u32),
                    );
                    sleep(Duration::from_millis(delay)).await;
                    attempt += 1;
                    continue;
                }
                return Ok((response, duration));
            }
            Err(e) => {
                if attempt >= settings.max_retries {
                    return Err(e);
                }
                let delay = std::cmp::min(
                    settings.max_delay,
                    settings.base_delay * 2u64.pow(attempt as u32),
                );
                sleep(Duration::from_millis(delay)).await;
                attempt += 1;
            }
        }
    }
}

// Process single URL
async fn process_url(
    url: Url,
    depth: usize,
    client: &Client,
    base_url: &Url,
    state: Arc<Mutex<CrawlerState>>,
    app_handle: &tauri::AppHandle,
    settings: &Settings,
) -> Result<DomainCrawlResults, String> {
    let response_result = tokio::time::timeout(
        Duration::from_secs(60),
        fetch_with_exponential_backoff(client, url.as_str(), settings),
    )
    .await;

    let (response, response_time) = match response_result {
        Ok(Ok((response, time))) => (response, time),
        Ok(Err(e)) => {
            let mut state = state.lock().await;
            state.failed_urls.insert(url.to_string());
            state.pending_urls.remove(url.as_str());
            return Err(format!("Failed to fetch {}: {}", url, e));
        }
        Err(_) => {
            let mut state = state.lock().await;
            state.failed_urls.insert(url.to_string());
            state.pending_urls.remove(url.as_str());
            return Err(format!("Timeout fetching {}", url));
        }
    };

    let final_url = response.url().clone();

    // check if the url is https or not
    let https = valid_https(&final_url);

    let status_code = response.status().as_u16();
    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|h| h.to_str().ok())
        .map(String::from);
    let content_length = response
        .headers()
        .get("Content-Length")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.parse::<usize>().unwrap_or(0));

    let content_len = content_length.clone();
    let redirection = response
        .headers()
        .get("Location")
        .and_then(|h| h.to_str().ok().map(String::from));

    let headers = response
        .headers()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
        .collect::<Vec<_>>();

    if response.headers().contains_key("cf-ray")
        || response.headers().contains_key("x-cdn")
        || response.headers().contains_key("x-cache")
    {
        sleep(Duration::from_secs(2)).await;
    }

    let body = match response.text().await {
        Ok(body) => body,
        Err(e) => {
            let mut state = state.lock().await;
            state.failed_urls.insert(url.to_string());
            return Err(format!("Failed to read response body: {}", e));
        }
    };

    let mut pdf_files: Vec<String> = Vec::new();
    if !check_html_page::is_html_page(&body, content_type.as_deref()).await {
        pdf_files.push(url.to_string());

        let mut state = state.lock().await;
        state.crawled_urls += 1;
        state.visited.insert(url.to_string());
        state.pending_urls.remove(url.as_str());
        state.last_activity = Instant::now();
        return Ok(DomainCrawlResults {
            url: final_url.to_string(),
            status_code,
            pdf_files,
            ..Default::default()
        });
    }

    let internal_external_links = anchor_links::extract_internal_external_links(&body, base_url);

    let check_links_status_code = get_links_status_code(
        internal_external_links,
        base_url,
        final_url.to_string(),
        //settings,
    )
    .await;

    // let check_url_with_page_speed = get_page_speed_insights_bulk(url, settings).await;

    // Cross-origin checker funtion
    let cross_origin = analyze_cross_origin_security(&body, base_url);

    // Page Speed Insights Checker
    // Check if the key exists to make the call otherwise return an empty vector
    // Attempt to fetch PSI results, but if there's an error, use an empty Vec
    // Start PSI fetch as a separate task
    // Start PSI fetch as a separate task
    // Start PSI fetch as a separate task
    let psi_future = if settings.page_speed_bulk {
        let url_clone = url.clone();
        let settings_clone = settings.clone();
        Some(tokio::spawn(async move {
            fetch_psi_bulk(url_clone, &settings_clone).await
        }))
    } else {
        None
    };

    // Do all other processing while PSI is fetching
    let psi_results = match psi_future {
        Some(fut) => fut.await.map_err(|e| e.to_string())?, // Handle task join error
        None => Ok(Vec::new()),                             // No PSI requested
    };

    let result = DomainCrawlResults {
        url: final_url.to_string(),
        title: title_selector::extract_title(&body),
        description: page_description::extract_page_description(&body)
            .unwrap_or_else(|| "".to_string()),
        headings: headings_selector::headings_selector(&body),
        javascript: javascript_selector::extract_javascript(&body, base_url),
        images: images_selector::extract_images_with_sizes_and_alts(&body, base_url).await,
        status_code,
        anchor_links: anchor_links::extract_internal_external_links(&body, base_url),
        inoutlinks_status_codes: check_links_status_code,
        indexability: indexability::extract_indexability(&body),
        alt_tags: alt_tags::get_alt_tags(&body),
        schema: schema_selector::get_schema(&body),
        css: css_selector::extract_css(&body, base_url.clone()),
        iframe: iframe_selector::extract_iframe(&body),
        word_count: get_word_count(&body),
        response_time: Some(response_time),
        mobile: is_mobile(&body),
        canonicals: get_canonical(&body).map(|c| c.canonicals),
        meta_robots: get_meta_robots(&body).unwrap_or(MetaRobots {
            meta_robots: Vec::new(),
        }),
        content_type: content_type.unwrap_or("Unknown".to_string()),
        content_length: content_length.unwrap_or(0),
        text_ratio: Some(vec![get_text_ratio(&body)
            .and_then(|mut v| v.pop())
            .unwrap_or(TextRatio {
                html_length: 0,
                text_length: 0,
                text_ratio: 0.0,
            })]),
        redirection,
        keywords: extract_keywords(&body),
        page_size: calculate_html_size(content_len),
        hreflangs: select_hreflang(&body),
        language: detect_language(&body),
        flesch: get_flesch_score(&body),
        psi_results,
        extractor: Extractor {
            html: extract_html(&body).await,
            css: false,
            regex: false,
        },
        headers,
        pdf_files,
        https,
        cross_origin,
    };

    {
        let mut state = state.lock().await;
        state.crawled_urls += 1;
        state.visited.insert(url.to_string());
        state.pending_urls.remove(url.as_str());
        state.last_activity = Instant::now();

        // Only process links if we haven't reached limits and depth allows
        if depth < MAX_DEPTH && state.total_urls < MAX_URLS_PER_DOMAIN {
            let links = links_selector::extract_links(&body, base_url);
            for link in links {
                let link_str = link.as_str();

                // Enhanced URL filtering
                if should_skip_url(link_str) {
                    continue;
                }

                // Normalize URL to avoid duplicates
                let normalized_url = normalize_url(link_str);
                let url_pattern = extract_url_pattern(&normalized_url);

                // Skip if we've seen this pattern before
                if state.url_patterns.contains(&url_pattern) {
                    continue;
                }

                if !state.visited.contains(link_str)
                    && !state.queue.iter().any(|(q_url, _)| q_url == &link)
                    && !state.pending_urls.contains_key(link_str)
                    && state.total_urls < MAX_URLS_PER_DOMAIN
                {
                    state.queue.push_back((link.clone(), depth + 1));
                    state.total_urls += 1;
                    state
                        .pending_urls
                        .insert(link_str.to_string(), Instant::now());
                    state.url_patterns.insert(url_pattern);
                }
            }
        }

        let progress = ProgressData {
            total_urls: state.total_urls,
            crawled_urls: state.crawled_urls,
            percentage: (state.crawled_urls as f32 / state.total_urls as f32) * 100.0,
            failed_urls: state.failed_urls.len(),
        };

        if let Err(err) = app_handle.emit("progress_update", progress) {
            eprintln!("Failed to emit progress update: {}", err);
        }

        let result_data = CrawlResultData {
            result: result.clone(),
        };
        if let Err(err) = app_handle.emit("crawl_result", result_data) {
            eprintln!("Failed to emit crawl result: {}", err);
        }

        let percentage = if state.total_urls > 0 {
            let completed = state.crawled_urls + state.failed_urls.len();
            (completed as f32 / state.total_urls as f32) * 100.0
        } else {
            0.0
        };
        print!(
            "\r{}: {:.2}% {}",
            "Progress".green().bold(),
            percentage,
            "complete".green().bold()
        );
        std::io::stdout().flush().unwrap();

        // Periodic status logging
        if state.crawled_urls % 50 == 0 {
            println!(
                "Status - Crawled: {}, Pending: {}, Queue: {}, Failed: {}",
                state.crawled_urls,
                state.pending_urls.len(),
                state.queue.len(),
                state.failed_urls.len()
            );
        }
    }
    Ok(result)
}

fn should_skip_url(url: &str) -> bool {
    // Skip fragments
    if url.contains('#') {
        return true;
    }

    // Skip common problematic patterns
    let skip_patterns = [
        "login",
        "logout",
        "register",
        "signup",
        "signin",
        "admin",
        "dashboard",
        "profile",
        "account",
        "cart",
        "checkout",
        "payment",
        "order",
        "search?",
        "filter?",
        "sort=",
        "page=",
        "calendar",
        "date=",
        "month=",
        "year=",
        "print",
        "pdf",
        "download",
        "javascript:",
        "mailto:",
        "tel:",
        "wp-admin",
        "wp-login",
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".svg",
        ".ico",
        ".css",
        ".js",
        ".xml",
        ".txt",
        ".zip",
        ".pdf",
    ];

    let url_lower = url.to_lowercase();
    for pattern in &skip_patterns {
        if url_lower.contains(pattern) {
            return true;
        }
    }

    // Skip URLs with too many query parameters (likely dynamic)
    if url.matches('&').count() > 3 {
        return true;
    }

    // Skip very long URLs (likely dynamic)
    if url.len() > 200 {
        return true;
    }

    false
}

// Normalize URLs to reduce duplicates
fn normalize_url(url: &str) -> String {
    let mut normalized = url.to_lowercase();

    // Remove trailing slash
    if normalized.ends_with('/') && normalized.len() > 1 {
        normalized.pop();
    }

    // Remove common tracking parameters
    let tracking_params = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "fbclid",
        "gclid",
    ];
    for param in &tracking_params {
        if let Some(pos) = normalized.find(&format!("{}=", param)) {
            let before = &normalized[..pos];
            if let Some(after_pos) = normalized[pos..].find('&') {
                let after = &normalized[pos + after_pos..];
                normalized = format!(
                    "{}{}",
                    before.trim_end_matches('?').trim_end_matches('&'),
                    after
                );
            } else {
                normalized = before
                    .trim_end_matches('?')
                    .trim_end_matches('&')
                    .to_string();
            }
        }
    }

    normalized
}

// Extract URL pattern to identify similar URLs
fn extract_url_pattern(url: &str) -> String {
    let mut pattern = url.to_string();

    // Replace numbers with placeholder using simple string replacement
    let mut chars: Vec<char> = pattern.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        if chars[i].is_ascii_digit() {
            chars[i] = 'N';
            // Skip consecutive digits
            while i + 1 < chars.len() && chars[i + 1].is_ascii_digit() {
                chars.remove(i + 1);
            }
        }
        i += 1;
    }
    pattern = chars.into_iter().collect::<String>();

    // Remove query parameters
    if let Some(pos) = pattern.find('?') {
        pattern = pattern[..pos].to_string();
    }

    pattern
}

pub async fn crawl_domain(
    domain: &str,
    app_handle: tauri::AppHandle,
    db: Result<Database, DatabaseError>,
    settings_state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let settings = Arc::new(settings_state.settings.read().await.clone());

    let client = Client::builder()
        .user_agent(
            &settings.user_agents[rand::thread_rng().gen_range(0..settings.user_agents.len())],
        )
        .timeout(Duration::from_secs(settings.client_timeout))
        .connect_timeout(Duration::from_secs(settings.client_connect_timeout))
        .redirect(reqwest::redirect::Policy::limited(settings.redirect_policy))
        .build()
        .map_err(|e| e.to_string())?;

    let url_checked = url_check(domain);
    let base_url = Url::parse(&url_checked).map_err(|_| "Invalid URL")?;

    let (db_tx, mut db_rx) = tokio::sync::mpsc::channel(DB_BATCH_SIZE);

    let db_handle = if let Ok(database) = db {
        let db_pool = database.get_pool();
        let handle = tokio::spawn(async move {
            let mut batch_results = Vec::with_capacity(DB_BATCH_SIZE);
            while let Some(result) = db_rx.recv().await {
                batch_results.push(result);
                if batch_results.len() >= DB_BATCH_SIZE {
                    if let Err(e) = database::insert_bulk_crawl_data(
                        db_pool.clone(),
                        batch_results.drain(..).collect(),
                    )
                    .await
                    {
                        eprintln!("Failed to batch insert results: {}", e);
                    }
                }
            }
            if !batch_results.is_empty() {
                if let Err(e) = database::insert_bulk_crawl_data(db_pool, batch_results).await {
                    eprintln!("Failed to insert remaining results: {}", e);
                }
            }
        });
        Some(handle)
    } else {
        eprintln!("Database connection failed");
        None
    };

    let state = Arc::new(Mutex::new(CrawlerState::new(None))); // DB is handled separately
    {
        let mut state_guard = state.lock().await;
        state_guard.queue.push_back((base_url.clone(), 0)); // Start at depth 0
        state_guard.total_urls = 1;
        state_guard
            .pending_urls
            .insert(base_url.to_string(), Instant::now());
    }

    let semaphore = Arc::new(Semaphore::new(settings.concurrent_requests));
    let crawl_start_time = Instant::now();
    let mut last_stall_check = Instant::now();
    let mut last_crawled_count = 0;

    loop {
        let current_batch: Vec<(Url, usize)> = {
            let mut state_guard = state.lock().await;

            // Clean up stale pending URLs
            state_guard.cleanup_stale_pending();

            // Check if we should continue
            if !state_guard.should_continue() {
                break;
            }

            // Check for stalling
            if last_stall_check.elapsed() > STALL_CHECK_INTERVAL {
                if state_guard.crawled_urls == last_crawled_count
                    && state_guard.last_activity.elapsed() > MAX_PENDING_TIME
                {
                    println!("Crawler appears to be stalled, terminating...");
                    break;
                }
                last_crawled_count = state_guard.crawled_urls;
                last_stall_check = Instant::now();
            }

            if state_guard.queue.is_empty() {
                // Wait a bit for pending operations to complete
                drop(state_guard);
                sleep(Duration::from_secs(2)).await;
                continue;
            }

            let batch_size = std::cmp::min(settings.batch_size, state_guard.queue.len());
            state_guard.queue.drain(..batch_size).collect()
        };

        if current_batch.is_empty() {
            // Check if there are truly no more URLs to process
            let state_guard = state.lock().await;
            if state_guard.pending_urls.is_empty() {
                break;
            }
            drop(state_guard);
            sleep(Duration::from_secs(1)).await;
            continue;
        }

        let mut handles = Vec::with_capacity(current_batch.len());
        for (url, depth) in current_batch {
            let client_clone = client.clone();
            let base_url_clone = base_url.clone();
            let state_clone = state.clone();
            let app_handle_clone = app_handle.clone();
            let semaphore_clone = semaphore.clone();
            let settings_clone = settings.clone();
            let db_tx_clone = db_tx.clone();

            let handle = tokio::spawn(async move {
                let _permit = semaphore_clone.acquire().await.unwrap();
                let jitter = rand::thread_rng().gen_range(500..2000);
                sleep(Duration::from_millis(jitter)).await;

                let result = process_url(
                    url.clone(),
                    depth,
                    &client_clone,
                    &base_url_clone,
                    state_clone.clone(),
                    &app_handle_clone,
                    &settings_clone,
                )
                .await;

                if let Ok(crawl_result) = &result {
                    if let Ok(db_result) = to_database_results(crawl_result) {
                        if let Err(e) = db_tx_clone.send(db_result).await {
                            eprintln!("Failed to send result to DB thread: {}", e);
                        }
                    }
                }
                (url, result)
            });
            handles.push(handle);
        }

        for handle in handles {
            if let Ok((url, result)) = handle.await {
                match result {
                    Err(_) => {
                        let mut state_guard = state.lock().await;
                        state_guard.pending_urls.remove(url.as_str());
                        // Don't re-queue failed URLs to prevent infinite loops
                    }
                    Ok(_) => {
                        // Success case is already handled in process_url
                    }
                }
            }
        }

        if crawl_start_time.elapsed() > Duration::from_secs(settings.crawl_timeout) {
            println!("Crawl timeout reached, terminating...");
            app_handle.emit("crawl_interrupted", ()).unwrap_or_default();
            break;
        }
    }

    // Final cleanup and status report
    {
        let state_guard = state.lock().await;
        println!("\nCrawl completed - Final stats:");
        println!("  Total URLs discovered: {}", state_guard.total_urls);
        println!("  URLs successfully crawled: {}", state_guard.crawled_urls);
        println!("  URLs failed: {}", state_guard.failed_urls.len());
        println!("  URLs still pending: {}", state_guard.pending_urls.len());
    }

    drop(db_tx);
    if let Some(handle) = db_handle {
        handle.await.unwrap_or_default();
    }

    app_handle.emit("crawl_complete", ()).unwrap_or_default();
    println!("Crawl completed.");

    if let Err(e) = database::create_diff_tables() {
        eprintln!("Failed to create diff tables: {}", e);
    }

    if let Err(e) = database::clone_batched_crawl_into_persistent_db().await {
        eprintln!("Failed to clone batched crawl into persistent db: {}", e);
    }

    Ok(())
}
