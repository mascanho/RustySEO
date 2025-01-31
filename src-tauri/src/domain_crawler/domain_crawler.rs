use futures::stream::{self, StreamExt};
use hyper::body::HttpBody;
use rand::Rng;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::{HashSet, VecDeque};
use std::sync::Arc;
use tauri::{Emitter, Event, Manager};
use tokio::sync::{Mutex, Semaphore};
use tokio::time::{sleep, Duration};
use url::Url;

// Import custom modules for specific functionality
use super::helpers::{
    alt_tags, anchor_links, check_html_page, headings_selector, images_selector, indexability,
    javascript_selector, links_selector, page_description, schema_selector, title_selector,
};

// Import custom types and structs
use super::models::DomainCrawlResults;

use crate::domain_crawler::helpers::css_selector::{self, extract_css};
use crate::domain_crawler::helpers::domain_checker::url_check;
use crate::domain_crawler::helpers::pdf_selector::extract_pdf_links;
use crate::domain_crawler::helpers::word_count::get_word_count;
use crate::domain_crawler::helpers::{iframe_selector, word_count};

// Progress tracking structure for frontend updates
#[derive(Clone, Serialize)]
struct ProgressData {
    total_urls: usize,
    crawled_urls: usize,
    percentage: f32,
}

// Structure for sending crawl results to frontend
#[derive(Clone, Serialize)]
struct CrawlResultData {
    result: DomainCrawlResults,
}

// Constants for request handling
const MAX_RETRIES: usize = 5;
const BASE_DELAY: u64 = 5;
const MAX_DELAY: u64 = 10;
const CONCURRENT_REQUESTS: usize = 50;

/// Fetches a URL with exponential backoff retry logic
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
                // Handle rate limiting with exponential backoff
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
                // Exponential backoff for errors
                let delay = std::cmp::min(MAX_DELAY, BASE_DELAY * 2u64.pow(attempt as u32));
                sleep(Duration::from_millis(delay)).await;
                attempt += 1;
            }
        }
    }
}

/// Main crawling function that processes a domain
pub async fn crawl_domain(
    domain: &str,
    app_handle: tauri::AppHandle,
) -> Result<Vec<DomainCrawlResults>, String> {
    // Initialize HTTP client with custom configuration
    let client = Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        .timeout(Duration::from_secs(30))
        .connect_timeout(Duration::from_secs(10))
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| e.to_string())?;

    // Validate and parse the input URL
    let url_checked = url_check(domain);
    let base_url = Url::parse(&url_checked).map_err(|_| "Invalid URL")?;

    // Initialize shared state with thread-safe containers
    let visited = Arc::new(Mutex::new(HashSet::new()));
    let to_visit = Arc::new(Mutex::new(HashSet::new()));
    let results = Arc::new(Mutex::new(Vec::new()));
    let queue = Arc::new(Mutex::new(VecDeque::new()));
    let total_urls = Arc::new(Mutex::new(1));
    let crawled_urls = Arc::new(Mutex::new(0));
    let semaphore = Arc::new(Semaphore::new(CONCURRENT_REQUESTS));
    let last_request_time = Arc::new(Mutex::new(std::time::Instant::now()));

    // Initialize crawl with base URL
    {
        let mut to_visit_guard = to_visit.lock().await;
        to_visit_guard.insert(base_url.to_string());
        queue.lock().await.push_back(base_url.clone());
    }

    // Main crawling loop
    while !queue.lock().await.is_empty() {
        // Process URLs in batches
        let current_batch: Vec<Url> = {
            let mut queue_guard = queue.lock().await;
            let batch_size = std::cmp::min(5, queue_guard.len());
            queue_guard.drain(..batch_size).collect()
        };

        // Create concurrent streams for processing URLs
        let mut stream = stream::iter(current_batch)
            .map(|url| {
                // Clone necessary references for async closure
                let client = client.clone();
                let base_url = base_url.clone();
                let visited = visited.clone();
                let to_visit = to_visit.clone();
                let results = results.clone();
                let queue = queue.clone();
                let total_urls = total_urls.clone();
                let crawled_urls = crawled_urls.clone();
                let app_handle = app_handle.clone();
                let semaphore = semaphore.clone();
                let last_request_time = last_request_time.clone();

                async move {
                    // Limit concurrent requests
                    let _permit = semaphore.acquire().await.unwrap();

                    // Implement rate limiting with jitter
                    {
                        let mut last_time = last_request_time.lock().await;
                        let now = std::time::Instant::now();
                        let elapsed = now.duration_since(*last_time);

                        if elapsed < Duration::from_millis(BASE_DELAY) {
                            sleep(Duration::from_millis(BASE_DELAY) - elapsed).await;
                        }

                        let jitter = rand::thread_rng().gen_range(0..200);
                        sleep(Duration::from_millis(jitter)).await;

                        *last_time = std::time::Instant::now();
                    }

                    // Skip already visited URLs
                    {
                        let visited_guard = visited.lock().await;
                        if visited_guard.contains(url.as_str()) {
                            return Ok::<(), String>(());
                        }
                    }

                    // Mark URL as visited
                    {
                        let mut visited_guard = visited.lock().await;
                        visited_guard.insert(url.to_string());
                    }

                    // Fetch page with response time tracking
                    let (response, response_time) =
                        match fetch_with_exponential_backoff(&client, url.as_str()).await {
                            Ok((response, time)) => (response, time),
                            Err(e) => {
                                eprintln!("Failed to fetch {} after retries: {}", url, e);
                                return Ok(());
                            }
                        };

                    // Extract response details
                    let final_url = response.url().clone();
                    let status_code = response.status().as_u16();
                    let content_type = response
                        .headers()
                        .get("content-type")
                        .and_then(|header| header.to_str().ok())
                        .map(|s| s.to_string());

                    // Handle CDN responses with additional delay
                    if response.headers().contains_key("cf-ray")
                        || response.headers().contains_key("x-cdn")
                        || response.headers().contains_key("x-cache")
                    {
                        sleep(Duration::from_millis(2000)).await;
                    }

                    // Get response body
                    let body = match response.text().await {
                        Ok(body) => body,
                        Err(e) => {
                            eprintln!("Failed to read response body from {}: {}", url, e);
                            return Ok(());
                        }
                    };

                    // Skip non-HTML pages
                    let is_html =
                        check_html_page::is_html_page(&body, content_type.as_deref()).await;
                    if !is_html {
                        return Ok(());
                    }

                    // Create result object with all extracted information
                    let result = DomainCrawlResults {
                        url: final_url.to_string(),
                        title: title_selector::extract_title(&body),
                        description: page_description::extract_page_description(&body)
                            .unwrap_or_else(|| "No Description".to_string()),
                        headings: headings_selector::headings_selector(&body),
                        javascript: javascript_selector::extract_javascript(&body),
                        images: images_selector::extract_images(&body),
                        status_code,
                        anchor_links: anchor_links::extract_internal_external_links(&body),
                        indexability: indexability::extract_indexability(&body),
                        alt_tags: alt_tags::get_alt_tags(&body),
                        schema: schema_selector::get_schema(&body),
                        css: css_selector::extract_css(&body),
                        iframe: iframe_selector::extract_iframe(&body),
                        pdf_link: extract_pdf_links(&body, &base_url),
                        word_count: get_word_count(&body),
                        response_time: Some(response_time),
                    };

                    // Emit result to frontend
                    let result_data = CrawlResultData {
                        result: result.clone(),
                    };
                    if let Err(err) = app_handle.emit("crawl_result", result_data) {
                        eprintln!("Failed to emit crawl result: {}", err);
                    }

                    // Store result
                    {
                        let mut results_guard = results.lock().await;
                        results_guard.push(result);
                    }

                    // Update crawl progress
                    {
                        let mut crawled_urls_guard = crawled_urls.lock().await;
                        *crawled_urls_guard += 1;
                    }

                    // Process discovered links
                    let links = links_selector::extract_links(&body, &base_url);
                    {
                        let mut to_visit_guard = to_visit.lock().await;
                        let visited_guard = visited.lock().await;
                        let mut queue_guard = queue.lock().await;
                        let mut total_urls_guard = total_urls.lock().await;

                        // Filter and add new links to queue
                        for link in links {
                            let link_str = link.as_str();
                            if link_str.ends_with(".pdf")
                                || link_str.ends_with(".jpg")
                                || link_str.ends_with(".png")
                                || link_str.contains("?") && link_str.contains("page=")
                                || link_str.contains("#")
                            {
                                continue;
                            }

                            if !visited_guard.contains(link_str)
                                && !to_visit_guard.contains(link_str)
                            {
                                to_visit_guard.insert(link_str.to_string());
                                queue_guard.push_back(link);
                                *total_urls_guard += 1;
                            }
                        }
                    }

                    // Update and emit progress
                    {
                        let total_urls_guard = total_urls.lock().await;
                        let crawled_urls_guard = crawled_urls.lock().await;
                        let progress =
                            (*crawled_urls_guard as f32 / *total_urls_guard as f32) * 100.0;

                        let progress_data = ProgressData {
                            total_urls: *total_urls_guard,
                            crawled_urls: *crawled_urls_guard,
                            percentage: progress,
                        };

                        println!(
                            "\x1b[34mProgress: {:.2}%\x1b[0m (\x1b[32m{} / {}\x1b[0m)",
                            progress, crawled_urls_guard, total_urls_guard
                        );
                        if let Err(err) = app_handle.emit("progress_update", progress_data) {
                            eprintln!("Failed to emit progress update: {}", err);
                        }
                    }

                    Ok(())
                }
            })
            .buffer_unordered(CONCURRENT_REQUESTS);

        // Process stream results
        while let Some(result) = stream.next().await {
            if let Err(e) = result {
                eprintln!("Error crawling page: {}", e);
            }
        }
    }

    // Emit completion event and return results
    let results_guard = results.lock().await;
    if let Err(err) = app_handle.emit("crawl_complete", ()) {
        eprintln!("Failed to emit crawl completion event: {}", err);
    }

    Ok(results_guard.clone())
}
