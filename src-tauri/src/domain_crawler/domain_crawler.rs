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

use crate::domain_crawler::helpers::css_selector::{self, extract_css};
use crate::domain_crawler::helpers::domain_checker::url_check;
use crate::domain_crawler::helpers::pdf_selector::extract_pdf_links;
use crate::domain_crawler::helpers::word_count::get_word_count;
use crate::domain_crawler::helpers::{iframe_selector, word_count};

// Import your custom modules
use super::helpers::{
    alt_tags, anchor_links, check_html_page, headings_selector, images_selector, indexability,
    javascript_selector, links_selector, page_description, schema_selector, title_selector,
};
use super::models::DomainCrawlResults;

#[derive(Clone, Serialize)]
struct ProgressData {
    total_urls: usize,
    crawled_urls: usize,
    percentage: f32,
}

#[derive(Clone, Serialize)]
struct CrawlResultData {
    result: DomainCrawlResults,
}

const MAX_RETRIES: usize = 5;
const BASE_DELAY: u64 = 5; // Base delay in milliseconds
const MAX_DELAY: u64 = 10; // Maximum delay in milliseconds
const CONCURRENT_REQUESTS: usize = 50;

pub async fn crawl_domain(
    domain: &str,
    app_handle: tauri::AppHandle,
) -> Result<Vec<DomainCrawlResults>, String> {
    let client = Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        .timeout(Duration::from_secs(30))
        .connect_timeout(Duration::from_secs(10))
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| e.to_string())?;

    // let mut base_url = Url::parse(domain).map_err(|_| "Invalid domain")?;

    let url_checked = url_check(domain);

    let base_url = Url::parse(&url_checked).map_err(|_| "Invalid URL")?;

    let visited = Arc::new(Mutex::new(HashSet::new()));
    let to_visit = Arc::new(Mutex::new(HashSet::new()));
    let results = Arc::new(Mutex::new(Vec::new()));
    let queue = Arc::new(Mutex::new(VecDeque::new()));
    let total_urls = Arc::new(Mutex::new(1));
    let crawled_urls = Arc::new(Mutex::new(0));
    let semaphore = Arc::new(Semaphore::new(CONCURRENT_REQUESTS));
    let last_request_time = Arc::new(Mutex::new(std::time::Instant::now()));

    // Initialize with base URL
    {
        let mut to_visit_guard = to_visit.lock().await;
        to_visit_guard.insert(base_url.to_string());
        queue.lock().await.push_back(base_url.clone());
    }

    while !queue.lock().await.is_empty() {
        let current_batch: Vec<Url> = {
            let mut queue_guard = queue.lock().await;
            let batch_size = std::cmp::min(5, queue_guard.len());
            queue_guard.drain(..batch_size).collect()
        };

        println!("Processing batch of {} URLs", current_batch.len());

        let mut stream = stream::iter(current_batch)
            .map(|url| {
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
                    let _permit = semaphore.acquire().await.unwrap();

                    // Implement rate limiting
                    {
                        let mut last_time = last_request_time.lock().await;
                        let now = std::time::Instant::now();
                        let elapsed = now.duration_since(*last_time);

                        if elapsed < Duration::from_millis(BASE_DELAY) {
                            sleep(Duration::from_millis(BASE_DELAY) - elapsed).await;
                        }

                        // Add some random jitter to prevent synchronization
                        let jitter = rand::thread_rng().gen_range(0..200);
                        sleep(Duration::from_millis(jitter)).await;

                        *last_time = std::time::Instant::now();
                    }

                    // Skip if already visited
                    {
                        let visited_guard = visited.lock().await;
                        if visited_guard.contains(url.as_str()) {
                            println!("Skipping already visited URL: {}", url);
                            return Ok::<(), String>(());
                        }
                    }

                    println!("Fetching URL: {}", url);

                    // Mark as visited
                    {
                        let mut visited_guard = visited.lock().await;
                        visited_guard.insert(url.to_string());
                    }

                    let response = match fetch_with_exponential_backoff(&client, url.as_str()).await
                    {
                        Ok(response) => response,
                        Err(e) => {
                            eprintln!("Failed to fetch {} after retries: {}", url, e);
                            return Ok(());
                        }
                    };

                    let final_url = response.url().clone();
                    if final_url != url {
                        println!("Redirected from {} to {}", url, final_url);
                    }

                    let status_code = response.status().as_u16();
                    let content_type = response
                        .headers()
                        .get("content-type")
                        .and_then(|header| header.to_str().ok())
                        .map(|s| s.to_string());

                    // Handle CDN responses
                    if response.headers().contains_key("cf-ray")
                        || response.headers().contains_key("x-cdn")
                        || response.headers().contains_key("x-cache")
                    {
                        sleep(Duration::from_millis(2000)).await;
                    }

                    let body = match response.text().await {
                        Ok(body) => body,
                        Err(e) => {
                            eprintln!("Failed to read response body from {}: {}", url, e);
                            return Ok(());
                        }
                    };

                    let is_html =
                        check_html_page::is_html_page(&body, content_type.as_deref()).await;

                    if !is_html {
                        println!("Skipping non-HTML page: {}", url);
                        return Ok(());
                    }

                    // Process page content
                    let title = title_selector::extract_title(&body).unwrap_or_else(|| vec![]);
                    let description = page_description::extract_page_description(&body)
                        .unwrap_or_else(|| "No Description".to_string());
                    let headings = headings_selector::headings_selector(&body);
                    let javascript = javascript_selector::extract_javascript(&body);
                    let images = images_selector::extract_images(&body);
                    let anchor_links = anchor_links::extract_internal_external_links(&body);
                    let indexability = indexability::extract_indexability(&body);
                    let alt_tags = alt_tags::get_alt_tags(&body);
                    let schema = schema_selector::get_schema(&body);
                    let css = css_selector::extract_css(&body);
                    let iframe = iframe_selector::extract_iframe(&body);
                    let pdf_link = extract_pdf_links(&body, &base_url);
                    let word_count = get_word_count(&body);

                    // Create the result object
                    let result = DomainCrawlResults {
                        url: final_url.to_string(),
                        title: Some(title),
                        description,
                        headings,
                        javascript,
                        images,
                        status_code,
                        anchor_links,
                        indexability,
                        alt_tags,
                        schema,
                        css,
                        iframe,
                        pdf_link,
                        word_count,
                    };

                    // Emit the result to the front end
                    let result_data = CrawlResultData {
                        result: result.clone(),
                    };
                    if let Err(err) = app_handle.emit("crawl_result", result_data) {
                        eprintln!("Failed to emit crawl result: {}", err);
                    }

                    // Store results
                    {
                        let mut results_guard = results.lock().await;
                        results_guard.push(result);
                    }

                    // Update crawled counter
                    {
                        let mut crawled_urls_guard = crawled_urls.lock().await;
                        *crawled_urls_guard += 1;
                    }

                    // Process new links
                    let links = links_selector::extract_links(&body, &base_url);
                    {
                        let mut to_visit_guard = to_visit.lock().await;
                        let visited_guard = visited.lock().await;
                        let mut queue_guard = queue.lock().await;
                        let mut total_urls_guard = total_urls.lock().await;

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
                                println!("Adding new URL to queue: {}", link_str);
                                to_visit_guard.insert(link_str.to_string());
                                queue_guard.push_back(link);
                                *total_urls_guard += 1;
                            }
                        }
                    }

                    // Update progress
                    {
                        let total_urls_guard = total_urls.lock().await;
                        let crawled_urls_guard = crawled_urls.lock().await;
                        let progress =
                            (*crawled_urls_guard as f32 / *total_urls_guard as f32) * 100.0;

                        println!(
                            "\x1b[34mProgress: {:.2}%\x1b[0m (\x1b[32m{} / {}\x1b[0m)",
                            progress, crawled_urls_guard, total_urls_guard
                        );

                        let progress_data = ProgressData {
                            total_urls: *total_urls_guard,
                            crawled_urls: *crawled_urls_guard,
                            percentage: progress,
                        };
                        if let Err(err) = app_handle.emit("progress_update", progress_data) {
                            eprintln!("Failed to emit progress update: {}", err);
                        }
                    }

                    Ok(())
                }
            })
            .buffer_unordered(CONCURRENT_REQUESTS);

        while let Some(result) = stream.next().await {
            if let Err(e) = result {
                eprintln!("Error crawling page: {}", e);
            }
        }
    }

    // Final verification
    {
        let visited_guard = visited.lock().await;
        let to_visit_guard = to_visit.lock().await;
        println!(
            "Final count - Visited: {}, To Visit: {}",
            visited_guard.len(),
            to_visit_guard.len()
        );
        assert_eq!(
            visited_guard.len(),
            to_visit_guard.len(),
            "Mismatch between visited and total URLs"
        );
    }

    let results_guard = results.lock().await;
    println!("\x1b[32m{} Pages Crawled\x1b[0m", results_guard.len());

    // Emit final completion event
    if let Err(err) = app_handle.emit("crawl_complete", ()) {
        eprintln!("Failed to emit crawl completion event: {}", err);
    }

    Ok(results_guard.clone())
}

async fn fetch_with_exponential_backoff(
    client: &Client,
    url: &str,
) -> Result<reqwest::Response, reqwest::Error> {
    let mut attempt = 0;
    loop {
        match client.get(url).send().await {
            Ok(response) => {
                if response.status() == reqwest::StatusCode::TOO_MANY_REQUESTS {
                    if attempt >= MAX_RETRIES {
                        return Ok(response);
                    }
                    let delay = std::cmp::min(MAX_DELAY, BASE_DELAY * 2u64.pow(attempt as u32));
                    sleep(Duration::from_millis(delay)).await;
                    attempt += 1;
                    continue;
                }
                return Ok(response);
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
