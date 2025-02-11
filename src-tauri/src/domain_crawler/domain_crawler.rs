use colored::*;
use futures::stream::{self, StreamExt};
use hyper::body::HttpBody;
use rand::Rng;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::{HashSet, VecDeque};
use std::io::Write;
use std::sync::Arc;
use std::time::Instant;
use tauri::{Emitter, Manager};
use tokio::sync::{Mutex, Semaphore};
use tokio::time::{sleep, Duration};
use url::Url;

use super::helpers::canonical_selector::get_canonical;
use super::helpers::html_size_calculator::calculate_html_size;
use super::helpers::keyword_selector::extract_keywords;
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

use super::models::DomainCrawlResults;

// Constants for crawler behavior
const MAX_RETRIES: usize = 5;
const BASE_DELAY: u64 = 2;
const MAX_DELAY: u64 = 5;
const CONCURRENT_REQUESTS: usize = 70; // Reduced from 100
const CRAWL_TIMEOUT: Duration = Duration::from_secs(7200); // 2 hour
const STALL_DETECTION_THRESHOLD: Duration = Duration::from_secs(300); // 5 minutes
const PROGRESS_CHECK_INTERVAL: Duration = Duration::from_secs(30);
const BATCH_SIZE: usize = 5;

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
    pub to_visit: HashSet<String>,
    pub failed_urls: HashSet<String>,
    pub results: Vec<DomainCrawlResults>,
    pub queue: VecDeque<Url>,
    pub total_urls: usize,
    pub crawled_urls: usize,
}

impl CrawlerState {
    fn new() -> Self {
        CrawlerState {
            visited: HashSet::new(),
            to_visit: HashSet::new(),
            failed_urls: HashSet::new(),
            results: Vec::new(),
            queue: VecDeque::new(),
            total_urls: 1,
            crawled_urls: 0,
        }
    }
}

// Fetch URL with exponential backoff
async fn fetch_with_exponential_backoff(
    client: &Client,
    url: &str,
) -> Result<(reqwest::Response, f64), reqwest::Error> {
    let mut attempt = 0;
    loop {
        let start = std::time::Instant::now();
        match client.get(url).send().await {
            Ok(response) => {
                let duration = start.elapsed().as_secs_f64();
                if response.status() == reqwest::StatusCode::TOO_MANY_REQUESTS {
                    if attempt >= MAX_RETRIES {
                        return Ok((response, duration));
                    }
                    let delay = std::cmp::min(MAX_DELAY, BASE_DELAY * 2u64.pow(attempt as u32));
                    sleep(Duration::from_millis(delay)).await;
                    attempt += 1;
                    continue;
                }
                return Ok((response, duration));
            }
            Err(e) => {
                if attempt >= MAX_RETRIES {
                    return Err(e);
                }
                let delay = std::cmp::min(MAX_DELAY, BASE_DELAY * 2u64.pow(attempt as u32));
                sleep(Duration::from_millis(delay)).await;
                attempt += 1;
            }
        }
    }
}

// Process single URL
async fn process_url(
    url: Url,
    client: &Client,
    base_url: &Url,
    state: Arc<Mutex<CrawlerState>>,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    let response_result = tokio::time::timeout(
        Duration::from_secs(30),
        fetch_with_exponential_backoff(client, url.as_str()),
    )
    .await;

    let (response, response_time) = match response_result {
        Ok(Ok((response, time))) => (response, time),
        Ok(Err(e)) => {
            let mut state = state.lock().await;
            state.failed_urls.insert(url.to_string());
            return Err(format!("Failed to fetch {}: {}", url, e));
        }
        Err(_) => {
            let mut state = state.lock().await;
            state.failed_urls.insert(url.to_string());
            return Err(format!("Timeout fetching {}", url));
        }
    };

    let final_url = response.url().clone();
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

    // Handle CDN rate limiting
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

    if !check_html_page::is_html_page(&body, content_type.as_deref()).await {
        return Ok(());
    }

    // Create result object
    let result = DomainCrawlResults {
        url: final_url.to_string(),
        title: title_selector::extract_title(&body),
        description: page_description::extract_page_description(&body)
            .unwrap_or_else(|| "No Description".to_string()),
        headings: headings_selector::headings_selector(&body),
        javascript: javascript_selector::extract_javascript(&body, &base_url),
        images: images_selector::extract_images(&body),
        status_code,
        anchor_links: anchor_links::extract_internal_external_links(&body, base_url),
        indexability: indexability::extract_indexability(&body),
        alt_tags: alt_tags::get_alt_tags(&body),
        schema: schema_selector::get_schema(&body),
        css: css_selector::extract_css(&body),
        iframe: iframe_selector::extract_iframe(&body),
        pdf_link: extract_pdf_links(&body, base_url),
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
    };

    // Update state and emit results
    {
        let mut state = state.lock().await;
        state.results.push(result.clone());
        state.crawled_urls += 1;

        // Process new links
        let links = links_selector::extract_links(&body, base_url);
        for link in links {
            let link_str = link.as_str();
            if should_skip_url(link_str) {
                continue;
            }

            if !state.visited.contains(link_str) && !state.to_visit.contains(link_str) {
                state.to_visit.insert(link_str.to_string());
                state.queue.push_back(link);
                state.total_urls += 1;
            }
        }

        // Emit progress
        let progress = ProgressData {
            total_urls: state.total_urls,
            crawled_urls: state.crawled_urls,
            percentage: (state.crawled_urls as f32 / state.total_urls as f32) * 100.0,
            failed_urls: state.failed_urls.len(),
        };

        if let Err(err) = app_handle.emit("progress_update", progress) {
            eprintln!("Failed to emit progress update: {}", err);
        }

        // Emit result
        let result_data = CrawlResultData { result };
        if let Err(err) = app_handle.emit("crawl_result", result_data) {
            eprintln!("Failed to emit crawl result: {}", err);
        }

        // Print progress inline with color
        let percentage = (state.crawled_urls as f32 / state.total_urls as f32) * 100.0;
        print!(
            "\r{}: {:.2}% {}",
            "Progress".green().bold(),
            percentage,
            "complete".green().bold()
        );
        std::io::stdout().flush().unwrap();
    }

    Ok(())
}

fn should_skip_url(url: &str) -> bool {
    url.ends_with(".pdf")
        || url.ends_with(".jpg")
        || url.ends_with(".png")
        || (url.contains("?") && url.contains("page="))
        || url.contains("#")
}

// Main crawling function
pub async fn crawl_domain(
    domain: &str,
    app_handle: tauri::AppHandle,
) -> Result<Vec<DomainCrawlResults>, String> {
    // Initialize client
    let client = Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        .timeout(Duration::from_secs(30))
        .connect_timeout(Duration::from_secs(10))
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| e.to_string())?;

    // Initialize base URL
    let url_checked = url_check(domain);
    let base_url = Url::parse(&url_checked).map_err(|_| "Invalid URL")?;

    // Initialize state
    let state = Arc::new(Mutex::new(CrawlerState::new()));
    {
        let mut state = state.lock().await;
        state.to_visit.insert(base_url.to_string());
        state.queue.push_back(base_url.clone());
    }

    let semaphore = Arc::new(Semaphore::new(CONCURRENT_REQUESTS));
    let crawl_start_time = Instant::now();
    let last_progress = Arc::new(Mutex::new((0, Instant::now())));

    // Start progress monitor
    let progress_monitor = {
        let state = state.clone();
        let last_progress = last_progress.clone();

        tokio::spawn(async move {
            loop {
                sleep(PROGRESS_CHECK_INTERVAL).await;

                let current_crawled = state.lock().await.crawled_urls;
                let mut last_progress_guard = last_progress.lock().await;

                if current_crawled == last_progress_guard.0 {
                    if last_progress_guard.1.elapsed() > STALL_DETECTION_THRESHOLD {
                        eprintln!("Crawler appears to be stalled. Initiating completion...");
                        break;
                    }
                } else {
                    *last_progress_guard = (current_crawled, Instant::now());
                }

                if crawl_start_time.elapsed() > CRAWL_TIMEOUT {
                    eprintln!("Crawl timeout reached. Initiating completion...");
                    break;
                }
            }
        })
    };

    // Main crawling loop
    while !state.lock().await.queue.is_empty() {
        // Get batch of URLs
        let current_batch: Vec<Url> = {
            let mut state = state.lock().await;
            let batch_size = std::cmp::min(BATCH_SIZE, state.queue.len());
            state.queue.drain(..batch_size).collect()
        };

        let mut stream = stream::iter(current_batch)
            .map(|url| {
                let client = client.clone();
                let base_url = base_url.clone();
                let state = state.clone();
                let app_handle = app_handle.clone();
                let semaphore = semaphore.clone();

                async move {
                    let _permit = semaphore.acquire().await.unwrap();

                    // Add jitter to requests
                    let jitter = rand::thread_rng().gen_range(0..200);
                    sleep(Duration::from_millis(jitter)).await;

                    if let Err(e) = process_url(url, &client, &base_url, state, &app_handle).await {
                        eprintln!("Error processing URL: {}", e);
                    }

                    Ok::<(), String>(())
                }
            })
            .buffer_unordered(CONCURRENT_REQUESTS);

        while let Some(result) = stream.next().await {
            if let Err(e) = result {
                eprintln!("Stream processing error: {}", e);
            }
        }

        // Check if monitor detected stall or timeout
        if progress_monitor.is_finished() {
            println!("\nCrawler monitor triggered completion");
            break;
        }
    }

    // Final statistics
    let state = state.lock().await;
    println!("\nCrawl completed:");
    println!("Total URLs found: {}", state.total_urls);
    println!("URLs crawled: {}", state.crawled_urls);
    println!("Failed URLs: {}", state.failed_urls.len());
    println!("Total time: {:?}", crawl_start_time.elapsed());

    // Emit completion event
    if let Err(err) = app_handle.emit("crawl_complete", ()) {
        eprintln!("Failed to emit crawl completion event: {}", err);
    }

    Ok(state.results.clone())
}
