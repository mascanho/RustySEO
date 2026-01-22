use colored::*;
use futures::stream::{self, StreamExt};
use html5ever::interface::NodeOrText::AppendNode;
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
use scraper::Html;


use crate::crawler::get_page_speed_insights;
use crate::domain_crawler::database::{Database, DatabaseResults};
use crate::domain_crawler::extractors::html::{perform_extraction, update_cache};

use crate::domain_crawler::helpers::extract_url_pattern::extract_url_pattern;
use crate::domain_crawler::helpers::fetch_with_exponential::fetch_with_exponential_backoff;
use crate::domain_crawler::helpers::headless_fetch;
use crate::domain_crawler::helpers::https_checker::valid_https;
use crate::domain_crawler::helpers::normalize_url::{self, normalize_url};
use crate::domain_crawler::helpers::robots::get_domain_robots;
use crate::domain_crawler::helpers::skip_url::should_skip_url;
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
    mobile_checker,
    ngrams,
 page_description,
    pdf_selector::extract_pdf_links,
    schema_selector, title_selector,
    word_count::{self, get_word_count},
};
use super::helpers::{pdf_checker, pdf_selector};
use super::models::DomainCrawlResults;
use super::page_speed::bulk::fetch_psi_bulk;
use super::page_speed::model::Crawler;

// TODO: Clean this up and implement the constants from settings crate
// Constants for crawler behavior
const MAX_RETRIES: usize = 5;
const BASE_DELAY: u64 = 500;
const MAX_DELAY: u64 = 8000;
const CONCURRENT_REQUESTS: usize = 150;
const CRAWL_TIMEOUT: Duration = Duration::from_secs(28800); // 8 hours
const BATCH_SIZE: usize = 20;
const DB_BATCH_SIZE: usize = 100; // Increased for better database write efficiency

// New constants to prevent infinite crawling
const MAX_URLS_PER_DOMAIN: usize = 50000; // Maximum URLs to crawl per domain (increased)
const MAX_DEPTH: usize = 50; // Maximum crawl depth (increased)
const MAX_PENDING_TIME: Duration = Duration::from_secs(900); // 15 minutes max pending time (increased)
const STALL_CHECK_INTERVAL: Duration = Duration::from_secs(30); // Check for stalls every 30s
const JS_CONCURRENCY: usize = 2; // Limit concurrent headless chrome instances

// Track failed URLs and retries
#[derive(Clone, Hash, Eq, PartialEq)]
struct FailedUrl {
    url: String,
    error: String,
    retries: usize,
    depth: usize,
    timestamp: Instant,
}

// Progress tracking structure
#[derive(Clone, Serialize)]
struct ProgressData {
    total_urls: usize,
    crawled_urls: usize,
    percentage: f32,
    failed_urls_count: usize,
    failed_urls: Vec<String>,
    discovered_urls: usize,
}

// Crawl result structure
#[derive(Clone, Serialize)]
struct CrawlResultData {
    result: DomainCrawlResults,
}

// Structure to track crawler state
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
}

impl CrawlerState {
    fn new(db: Option<Database>) -> Self {
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
            && (!self.queue.is_empty() || !self.pending_urls.is_empty() || self.active_tasks > 0)
    }

    fn is_truly_complete(&self) -> bool {
        self.queue.is_empty() && self.pending_urls.is_empty() && self.active_tasks == 0
    }
}

fn to_database_results(result: &DomainCrawlResults) -> Result<DatabaseResults, serde_json::Error> {
    Ok(DatabaseResults {
        url: result.url.clone(),
        data: serde_json::to_value(result)?,
    })
}

// Helper function to detect redirects and get useful information
fn detect_redirect_info(
    requested_url: &Url,
    response_url: &Url,
    response_status: u16,
    response_headers: &reqwest::header::HeaderMap,
) -> (bool, Option<String>, Option<String>) {
    let had_redirect = requested_url != response_url;

    // Check if it's an explicit redirect (3xx status)
    let is_explicit_redirect = (300..399).contains(&response_status);

    // Extract Location header if present (for explicit redirects)
    let location_header = if is_explicit_redirect {
        response_headers
            .get("Location")
            .and_then(|h| h.to_str().ok())
            .map(|s| s.to_string())
    } else {
        None
    };

    // Determine the redirect URL to store
    let redirect_url = if had_redirect {
        // If we have a Location header, use that (it might be different from final URL)
        if let Some(location) = location_header {
            Some(location)
        } else {
            // Otherwise, use the final URL
            Some(response_url.to_string())
        }
    } else {
        None
    };

    // Also track the redirection type if it was explicit
    let redirection_type = if is_explicit_redirect {
        Some(format!("{} Redirect", response_status))
    } else if had_redirect {
        Some("Implicit Redirect".to_string())
    } else {
        None
    };

    (had_redirect, redirect_url, redirection_type)
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
    js_semaphore: Arc<Semaphore>,
) -> Result<DomainCrawlResults, String> {
    let mut current_url = url.clone();
    let mut redirect_chain = Vec::new();
    let mut redirect_count = 0;
    let mut had_redirect = false;
    let mut redirection_type = None;
    let mut final_response = None;
    let mut total_time = 0.0;

    while redirect_count < 10 {
        let response_result = tokio::time::timeout(
            Duration::from_secs(30),
            fetch_with_exponential_backoff(client, current_url.as_str(), settings),
        )
        .await;

        match response_result {
            Ok(Ok((response, time))) => {
                total_time += time;
                let status = response.status();
                let status_code = status.as_u16();

                redirect_chain.push(crate::domain_crawler::models::RedirectHop {
                    url: current_url.to_string(),
                    status_code,
                });

                if status.is_redirection() {
                    had_redirect = true;
                    if redirection_type.is_none() {
                        redirection_type = Some(format!("{} Redirect", status_code));
                    }

                    if let Some(location) = response.headers().get("location") {
                        if let Ok(location_str) = location.to_str() {
                            match current_url.join(location_str) {
                                Ok(next_url) => {
                                    // Check for infinite loops
                                    if redirect_chain.iter().any(|hop| hop.url == next_url.to_string()) {
                                        final_response = Some(response);
                                        break;
                                    }
                                    current_url = next_url;
                                    redirect_count += 1;
                                    continue;
                                }
                                Err(_) => {
                                    final_response = Some(response);
                                    break;
                                }
                            }
                        }
                    }
                }
                final_response = Some(response);
                break;
            }
            Ok(Err(e)) => {
                let mut state = state.lock().await;
                state.failed_urls.insert(FailedUrl {
                    url: url.to_string(),
                    error: e.to_string(),
                    retries: 0,
                    depth,
                    timestamp: Instant::now(),
                });
                state.pending_urls.remove(url.as_str());
                return Err(format!("Failed to fetch {}: {}", url, e));
            }
            Err(_) => {
                let mut state = state.lock().await;
                state.failed_urls.insert(FailedUrl {
                    url: url.to_string(),
                    error: "Timeout fetching".to_string(),
                    retries: 0,
                    depth,
                    timestamp: Instant::now(),
                });
                state.pending_urls.remove(url.as_str());
                return Err(format!("Timeout fetching {}", url));
            }
        }
    }

    let response = final_response.ok_or_else(|| "Failed to get response".to_string())?;
    let response_time = total_time;

    let final_url = response.url().clone();
    let status_code = response.status().as_u16();

    let redirect_url = if had_redirect {
        Some(final_url.to_string())
    } else {
        None
    };

    // Log redirects occasionally for debugging (sampled to avoid performance hit)
    if had_redirect && rand::random_range(0..50) == 0 {
        // ~2% sampling rate
        println!(
            "Redirect: {} -> {} (status: {}, hops: {})",
            url, final_url, status_code, redirect_count
        );
    }

    // check if the url is https or not
    let https = valid_https(&final_url);

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

    let mut body = match response.text().await {
        Ok(body) => body,
        Err(e) => {
            let mut state = state.lock().await;
            state.failed_urls.insert(FailedUrl {
                url: url.to_string(),
                error: e.to_string(),
                retries: 0,
                depth,
                timestamp: Instant::now(),
            });
            return Err(format!("Failed to read response body: {}", e));
        }
    };

    // If Javascript Rendering is enabled and content is HTML, re-fetch via Headless Chrome
    if settings.javascript_rendering && check_html_page::is_html_page(&body, content_type.as_deref()).await {
        let js_url = final_url.to_string();
        let js_semaphore_clone = js_semaphore.clone();
        
        // Use a separate task for blocking IO of headless chrome, protected by semaphore
        let js_fetch_future = async move {
            // Acquire permit asynchronously
            let _permit = js_semaphore_clone.acquire().await.map_err(|e| e.to_string())?;
            
            // Run blocking Chrome operation
            task::spawn_blocking(move || {
                headless_fetch::fetch_js_body(&js_url)
            }).await.map_err(|e| e.to_string())?
        };

        match js_fetch_future.await {
            Ok(js_body) => {
                 body = js_body;
            },
            Err(e) => {
                 println!("Failed to render JS for {}: {}. Falling back to static content.", final_url, e);
            }
        }
    }

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
            original_url: url.to_string(), // Store original URL
            redirect_url,                  // Store redirect URL if any
            had_redirect,                  // Boolean flag for easy filtering
            redirection_type,              // Type of redirect
            redirect_chain: Some(redirect_chain.clone()), // Full redirect chain
            redirect_count,                // Number of hops
            ..Default::default()
        });
    }

    // Update the custom HTML extractor cache before parsing
    let _ = update_cache().await;

    // Perform all synchronous extractions in a scoped block to ensure `document` (non-Send) 
    // is dropped before any `.await` points.
    let (
        title,
        description,
        headings,
        javascript_data,
        image_urls_for_fetch,
        internal_external_links,
        indexability_data,
        alt_tags_data,
        schema_data,
        css_data,
        iframe_data,
        word_count_val,
        mobile_val,
        canonicals_val,
        meta_robots_val,
        text_ratio_val,
        keywords_val,
        hreflangs_val,
        language_val,
        flesch_val,
        html_extractor_val,
        cross_origin_data,
        links_for_crawler,
        _ngrams_data,
    ) = {
        let document = Html::parse_document(&body);
        
        (
            title_selector::extract_title(&document),
            page_description::extract_page_description(&document).unwrap_or_default(),
            headings_selector::headings_selector(&document),
            if settings.javascript_rendering {
                javascript_selector::extract_javascript(&document, &final_url)
            } else {
                javascript_selector::JavaScript::default()
            },
            images_selector::extract_image_urls_and_alts(&document, &final_url),
            anchor_links::extract_internal_external_links(&document, &final_url, base_url),
            indexability::extract_indexability(&document),
            alt_tags::get_alt_tags(&document),
            schema_selector::get_schema(&document),
            css_selector::extract_css(&document, &final_url),
            iframe_selector::extract_iframe(&document),
            get_word_count(&document),
            mobile_checker::is_mobile(&document),
            get_canonical(&document).map(|c| c.canonicals),
            get_meta_robots(&document).unwrap_or(MetaRobots { meta_robots: Vec::new() }),
            get_text_ratio(&document),
            extract_keywords(&document, &settings.stop_words),
            select_hreflang(&document),
            detect_language(&document),
            get_flesch_score(&document),
            perform_extraction(&document),
            analyze_cross_origin_security(&document, &final_url),
            links_selector::extract_links(&document, &final_url, base_url),
            if settings.extract_ngrams {
                ngrams::check_ngrams(&body, 2, url.as_str()).unwrap_or_default()
            } else {
                Vec::new()
            },
        )
    }; // `document` is dropped here

    // Now perform asynchronous checks
    let check_links_status_code = get_links_status_code(
        internal_external_links.clone(),
        base_url,
        final_url.to_string(),
    ).await;

    let images_details = images_selector::fetch_image_details(image_urls_for_fetch).await;

    // Start PSI fetch as a separate task
    let psi_future = if settings.page_speed_bulk {
        let url_clone = final_url.clone();
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
        original_url: url.to_string(),
        redirect_url,
        had_redirect,
        redirection_type,
        redirect_chain: Some(redirect_chain),
        redirect_count,
        title,
        description,
        headings,
        javascript: javascript_data,
        images: images_details,
        status_code,
        anchor_links: internal_external_links,
        inoutlinks_status_codes: check_links_status_code,
        indexability: indexability_data,
        alt_tags: alt_tags_data,
        schema: schema_data,
        css: css_data,
        iframe: iframe_data,
        word_count: word_count_val,
        response_time: Some(response_time),
        mobile: mobile_val,
        canonicals: canonicals_val,
        meta_robots: meta_robots_val,
        content_type: content_type.unwrap_or_else(|| "Unknown".to_string()),
        content_length: content_length.unwrap_or(0),
        text_ratio: Some(vec![text_ratio_val
            .and_then(|mut v| v.pop())
            .unwrap_or(TextRatio {
                html_length: 0,
                text_length: 0,
                text_ratio: 0.0,
            })]),
        redirection: None,
        keywords: keywords_val,
        page_size: calculate_html_size(content_len),
        hreflangs: hreflangs_val,
        language: language_val,
        flesch: flesch_val,
        psi_results,
        extractor: Extractor {
            html: html_extractor_val,
            css: false,
            regex: false,
        },
        headers,
        pdf_files,
        https,
        cross_origin: cross_origin_data,
        status: Some(status_code),
    };


    {
        let mut state = state.lock().await;
        state.crawled_urls += 1;
        state.visited.insert(url.to_string());
        state.pending_urls.remove(url.as_str());
        state.last_activity = Instant::now();
        state.active_tasks = state.active_tasks.saturating_sub(1);

        // Only process links if we haven't reached limits and depth allows
        if depth < MAX_DEPTH && state.total_urls < MAX_URLS_PER_DOMAIN {
            let links = links_for_crawler;
            let links_found = links.len();
            if links_found > 0 && state.crawled_urls % 100 == 0 {
                println!("Found {} links on {} at depth {}", links_found, url, depth);
            }
            for link in links {
                let link_str = link.as_str();

                // Enhanced URL filtering
                if should_skip_url(link_str) {
                    continue;
                }

                // Normalize URL to avoid duplicates
                let normalized_url = normalize_url(link_str);
                let url_pattern = extract_url_pattern(&normalized_url);

                // More sophisticated pattern checking to reduce over-deduplication
                let pattern_count = state
                    .url_patterns
                    .iter()
                    .filter(|p| *p == &url_pattern)
                    .count();

                let should_skip_pattern = if state.url_patterns.len() > 5000 {
                    // Only skip if we've seen this exact pattern many times
                    pattern_count > 10
                } else if state.url_patterns.len() > 1000 {
                    // Be more selective about pattern matching
                    pattern_count > 5
                } else {
                    // Allow all patterns until we have a reasonable collection
                    pattern_count > 20
                };

                if should_skip_pattern {
                    if state.crawled_urls % 200 == 0 {
                        println!(
                            "Skipping URL due to pattern: {} (pattern: {})",
                            link_str, url_pattern
                        );
                    }
                    continue;
                }

                if !state.visited.contains(link_str)
                    && !state.queue.iter().any(|(q_url, _)| q_url == &link)
                    && !state.pending_urls.contains_key(link_str)
                    && state.total_urls < MAX_URLS_PER_DOMAIN
                {
                    // Only increment total_urls when we actually add a new URL
                    let queue_length_before = state.queue.len();
                    state.queue.push_back((link.clone(), depth + 1));

                    // Only increment if we successfully added to queue
                    if state.queue.len() > queue_length_before {
                        state.total_urls += 1;
                        state
                            .pending_urls
                            .insert(link_str.to_string(), Instant::now());
                        state.url_patterns.insert(url_pattern);
                    }
                }
            }
        }

        // Calculate progress - use a stable approach for dynamic crawling
        let completed_urls = state.crawled_urls + state.failed_urls.len();
        let total_discovered = state.total_urls;
        let active_pending = state.pending_urls.len() + state.active_tasks;

        // For progress calculation, consider both completed and in-progress work
        let progress_denominator = total_discovered + active_pending;
        let percentage = if progress_denominator > 0 {
            let base_progress = (completed_urls as f32 / progress_denominator as f32) * 100.0;
            // Cap at 95% during active crawling, only show 100% when truly complete
            if active_pending > 0 {
                base_progress.min(95.0)
            } else {
                base_progress.min(100.0)
            }
        } else {
            0.0
        };

        // Ensure we never send invalid data that could cause NaN in frontend
        let safe_total_discovered = std::cmp::max(total_discovered, 1);
        let safe_completed_urls = completed_urls;

        let progress = ProgressData {
            total_urls: safe_total_discovered,
            crawled_urls: safe_completed_urls,
            failed_urls: state.failed_urls.iter().map(|f| f.url.clone()).collect(),
            percentage,
            failed_urls_count: state.failed_urls.len(),
            discovered_urls: safe_total_discovered,
        };

        // Debug logging for troubleshooting NaN issues
        if total_discovered == 0 || percentage.is_nan() {
            println!(
                "WARNING: Potential invalid progress data - total_discovered: {}, completed_urls: {}, percentage: {}",
                total_discovered, completed_urls, percentage
            );
        }

        // Log progress every 50 URLs for better tracking
        if state.crawled_urls % 50 == 0 || (active_pending == 0 && completed_urls > 0) {
            println!(
                "Progress: {}/{} URLs completed ({:.1}%), {} succeeded, {} failed, {} pending, {} active",
                completed_urls,
                total_discovered,
                percentage,
                state.crawled_urls,
                state.failed_urls.len(),
                state.pending_urls.len(),
                state.active_tasks
            );
        }

        // Only emit progress update if we have valid data
        if safe_total_discovered > 0 && !percentage.is_nan() {
            if let Err(err) = app_handle.emit("progress_update", progress) {
                eprintln!("Failed to emit progress update: {}", err);
            }
        } else {
            println!(
                "Skipping invalid progress update: total_discovered={}, percentage={}",
                safe_total_discovered, percentage
            );
        }

        let result_data = CrawlResultData {
            result: result.clone(),
        };
        if let Err(err) = app_handle.emit("crawl_result", result_data) {
            eprintln!("Failed to emit crawl result: {}", err);
        }

        print!(
            "\r{}: {:.2}% {}",
            "Progress".green().bold(),
            percentage,
            "complete".green().bold()
        );
        std::io::stdout().flush().unwrap();

        // Enhanced periodic status logging
        if state.crawled_urls % 50 == 0 {
            println!(
                "Status - Crawled: {}, Pending: {}, Queue: {}, Failed: {}, Patterns: {}",
                state.crawled_urls,
                state.pending_urls.len(),
                state.queue.len(),
                state.failed_urls.len(),
                state.url_patterns.len()
            );
        }
    }
    Ok(result)
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
            &settings.user_agents[rand::random_range(0..settings.user_agents.len())],
        )
        .timeout(Duration::from_secs(settings.client_timeout))
        .connect_timeout(Duration::from_secs(settings.client_connect_timeout))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|e| e.to_string())?;

    let url_checked = url_check(domain);
    let base_url = Url::parse(&url_checked).map_err(|_| "Invalid URL")?;
    let domain = base_url.clone();

    let app_handle_clone = app_handle.clone();

    // Spawn a task that checks for the robots files
    tokio::spawn(async move {
        let robots_str = get_domain_robots(&domain)
            .await
            .unwrap_or_else(|| vec!["No robots.txt found".to_string()]);

        if let Err(err) = app_handle_clone.emit("robots", (&domain, robots_str)) {
            eprintln!("Failed to emit robots data: {}", err);
        } else {
            println!("Robots emitted for {}", &domain);
        }
    });

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
    let js_semaphore = Arc::new(Semaphore::new(JS_CONCURRENCY));
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

            // Check for stalling (made less aggressive)
            if last_stall_check.elapsed() > STALL_CHECK_INTERVAL {
                // Only consider it stalled if no progress AND no pending URLs AND empty queue AND no active tasks
                if state_guard.crawled_urls == last_crawled_count
                    && state_guard.last_activity.elapsed() > MAX_PENDING_TIME
                    && state_guard.is_truly_complete()
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
            if state_guard.is_truly_complete() {
                println!("All URLs processed, crawl complete");
                break;
            }
            drop(state_guard);
            sleep(Duration::from_secs(1)).await;
            continue;
        }

        // Increment active tasks counter before spawning
        {
            let mut state_guard = state.lock().await;
            state_guard.active_tasks += current_batch.len();
        }

        let mut handles = Vec::with_capacity(current_batch.len());
        for (url, depth) in current_batch {
            let client_clone = client.clone();
            let base_url_clone = base_url.clone();
            let state_clone = state.clone();
            let app_handle_clone = app_handle.clone();
            let semaphore_clone = semaphore.clone();
            let settings_clone = settings.clone();
            let js_semaphore_clone = js_semaphore.clone();
            let db_tx_clone = db_tx.clone();

            let handle = tokio::spawn(async move {
                let _permit = semaphore_clone.acquire().await.unwrap();
                let jitter = rand::random_range(500..2000);
                sleep(Duration::from_millis(jitter)).await;

                let result = process_url(
                    url.clone(),
                    depth,
                    &client_clone,
                    &base_url_clone,
                    state_clone.clone(),
                    &app_handle_clone,
                    &settings_clone,
                    js_semaphore_clone,
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
                        state_guard.failed_urls.insert(FailedUrl {
                            url: url.to_string(),
                            error: "Processing failed".to_string(),
                            retries: 0,
                            depth: 0,
                            timestamp: Instant::now(),
                        });
                        state_guard.active_tasks = state_guard.active_tasks.saturating_sub(1);
                        // Don't re-queue failed URLs to prevent infinite loops
                    }
                    Ok(_) => {
                        // Success case is already handled in process_url
                        let mut state_guard = state.lock().await;
                        state_guard.active_tasks = state_guard.active_tasks.saturating_sub(1);
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
        println!("  Active tasks remaining: {}", state_guard.active_tasks);
        println!("  Unique URL patterns: {}", state_guard.url_patterns.len());
        println!("  Max depth reached: {}", MAX_DEPTH);
        println!("  Max URLs limit: {}", MAX_URLS_PER_DOMAIN);

        // Calculate final completion percentage
        let completed = state_guard.crawled_urls + state_guard.failed_urls.len();
        let final_percentage = if state_guard.total_urls > 0 {
            (completed as f32 / state_guard.total_urls as f32) * 100.0
        } else {
            0.0
        };
        println!("  Final completion: {:.2}%", final_percentage);
    }

    drop(db_tx);
    if let Some(handle) = db_handle {
        handle.await.unwrap_or_default();
    }

    // Emit final 100% progress update before completion
    {
        let state_guard = state.lock().await;
        let completed = state_guard.crawled_urls + state_guard.failed_urls.len();
        let safe_completed = std::cmp::max(completed, 1);
        let final_progress = ProgressData {
            total_urls: safe_completed, // Set total to actual completed count for consistency
            crawled_urls: safe_completed,
            failed_urls: state_guard
                .failed_urls
                .iter()
                .map(|f| f.url.clone())
                .collect(),
            percentage: 100.0, // Always 100% when truly complete
            failed_urls_count: state_guard.failed_urls.len(),
            discovered_urls: std::cmp::max(state_guard.total_urls, 1),
        };

        println!(
            "Final crawl stats: {} total processed ({} succeeded, {} failed)",
            completed,
            state_guard.crawled_urls,
            state_guard.failed_urls.len()
        );

        if let Err(err) = app_handle.emit("progress_update", final_progress) {
            eprintln!("Failed to emit final progress update: {}", err);
        }
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
