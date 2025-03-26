use colored::*;
use futures::stream::{self, StreamExt};
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

use crate::domain_crawler::extractors::html::extract_html;
use crate::domain_crawler::helpers::sitemap::get_sitemap;
use crate::domain_crawler::models::Extractor;
use crate::settings::settings;

use super::helpers::canonical_selector::get_canonical;
use super::helpers::flesch_reader::get_flesch_score;
use super::helpers::hreflang_selector::select_hreflang;
use super::helpers::html_size_calculator::calculate_html_size;
use super::helpers::keyword_selector::extract_keywords;
use super::helpers::language_selector::detect_language;
use super::helpers::meta_robots_selector::{get_meta_robots, MetaRobots};
use super::helpers::robots::get_domain_robots;
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

// Constants for crawler behavior
const MAX_RETRIES: usize = 5;
const BASE_DELAY: u64 = 500;
const MAX_DELAY: u64 = 8000;
const CONCURRENT_REQUESTS: usize = 120;
const CRAWL_TIMEOUT: Duration = Duration::from_secs(28800); // 4 hours
const BATCH_SIZE: usize = 20;

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
    pub pending_urls: HashSet<String>,
    pub results: Vec<DomainCrawlResults>,
    pub queue: VecDeque<Url>,
    pub total_urls: usize,
    pub crawled_urls: usize,
}

impl CrawlerState {
    fn new() -> Self {
        CrawlerState {
            visited: HashSet::new(),
            failed_urls: HashSet::new(),
            pending_urls: HashSet::new(),
            results: Vec::new(),
            queue: VecDeque::new(),
            total_urls: 0,
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
        let start = Instant::now();
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
) -> Result<DomainCrawlResults, String> {
    // println!("Processing URL: {}", url);
    let response_result = tokio::time::timeout(
        Duration::from_secs(60),
        fetch_with_exponential_backoff(client, url.as_str()),
    )
    .await;

    let (response, response_time) = match response_result {
        Ok(Ok((response, time))) => (response, time),
        Ok(Err(e)) => {
            let mut state = state.lock().await;
            state.failed_urls.insert(url.to_string());
            println!("Failed to fetch URL: {}", url);
            return Err(format!("Failed to fetch {}: {}", url, e));
        }
        Err(_) => {
            let mut state = state.lock().await;
            state.failed_urls.insert(url.to_string());
            println!("Timeout fetching URL: {}", url);
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

    // GET ALL THE HEADERS RESPONSE
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
            println!("Failed to read body for URL: {}", url);
            return Err(format!("Failed to read response body: {}", e));
        }
    };

    // Skip non-HTML content but still mark it as processed and store URLS with PDFs
    let mut pdf_files: Vec<&String> = Vec::new();

    if !check_html_page::is_html_page(&body, content_type.as_deref()).await {
        pdf_files.push(&url.to_string()); // Push the urls that are not .HTML;

        let mut state = state.lock().await;
        state.crawled_urls += 1;
        state.visited.insert(url.to_string());
        state.pending_urls.remove(url.as_str());
        return Ok(DomainCrawlResults {
            url: final_url.to_string(),
            status_code,
            ..Default::default()
        });
    }

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
        extractor: Extractor {
            html: extract_html(&body).await,
            css: false,
            regex: false,
        },
        headers,
        pdf_files: pdf_files.iter().map(|s| s.to_string()).collect(),
    };

    {
        let mut state = state.lock().await;
        state.results.push(result.clone());
        state.crawled_urls += 1;
        state.visited.insert(url.to_string());
        state.pending_urls.remove(url.as_str());
        // println!("Crawled URL: {}", url);

        let links = links_selector::extract_links(&body, base_url);
        for link in links {
            let link_str = link.as_str();
            if should_skip_url(link_str) {
                continue;
            }

            if !state.visited.contains(link_str)
                && !state.queue.contains(&link)
                && !state.pending_urls.contains(link_str)
            {
                state.queue.push_back(link.clone());
                state.total_urls += 1;
                state.pending_urls.insert(link_str.to_string());
                // println!("Added to queue: {}", link);
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

        let percentage = (state.crawled_urls as f32 / state.total_urls as f32) * 100.0;
        print!(
            "\r{}: {:.2}% {}",
            "Progress".green().bold(),
            percentage,
            "complete".green().bold()
        );
        std::io::stdout().flush().unwrap();
    }

    Ok(result)
}

fn should_skip_url(url: &str) -> bool {
    // Only skip URLs with fragments or login pages
    url.contains('#') || url.contains("login")
}

// Main crawling function
pub async fn crawl_domain(
    domain: &str,
    app_handle: tauri::AppHandle,
) -> Result<Vec<DomainCrawlResults>, String> {
    let user_agents = vec![
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15",
    ];

    let client = Client::builder()
        .user_agent(user_agents[rand::thread_rng().gen_range(0..user_agents.len())])
        .timeout(Duration::from_secs(60))
        .connect_timeout(Duration::from_secs(15))
        .redirect(reqwest::redirect::Policy::limited(5))
        .build()
        .map_err(|e| e.to_string())?;

    let url_checked = url_check(domain);
    let base_url = Url::parse(&url_checked).map_err(|_| "Invalid URL")?;

    let state = Arc::new(Mutex::new(CrawlerState::new()));
    {
        let mut state = state.lock().await;
        state.queue.push_back(base_url.clone());
        state.total_urls = 1;
        state.pending_urls.insert(base_url.to_string());
        println!("Starting crawl with: {}", base_url);
    }

    let semaphore = Arc::new(Semaphore::new(CONCURRENT_REQUESTS));
    let crawl_start_time = Instant::now();

    loop {
        let current_batch: Vec<Url> = {
            let mut state = state.lock().await;
            if state.queue.is_empty() {
                if state.crawled_urls + state.failed_urls.len() >= state.total_urls {
                    println!("\nAll crawlable URLs processed.");
                    break;
                } else {
                    println!(
                        "\nWARNING: Queue empty but only {}/{} URLs accounted for (crawled: {}, failed: {})",
                        state.crawled_urls + state.failed_urls.len(),
                        state.total_urls,
                        state.crawled_urls,
                        state.failed_urls.len()
                    );
                    break;
                }
            }
            let batch_size = std::cmp::min(BATCH_SIZE, state.queue.len());
            let batch: Vec<Url> = state.queue.drain(..batch_size).collect();
            // println!("Processing batch of {} URLs", batch.len());
            batch
        };

        let mut handles = Vec::with_capacity(current_batch.len());
        for url in current_batch.clone() {
            // Clone to keep URLs for re-queueing if needed
            let client = client.clone();
            let base_url = base_url.clone();
            let state = state.clone();
            let app_handle = app_handle.clone();
            let semaphore = semaphore.clone();

            let handle = tokio::spawn(async move {
                let _permit = semaphore.acquire().await.unwrap();
                let jitter = rand::thread_rng().gen_range(500..2000);
                sleep(Duration::from_millis(jitter)).await;

                let mut retries = 0;
                let result: Result<DomainCrawlResults, String> = loop {
                    // Explicit type annotation
                    match process_url(url.clone(), &client, &base_url, state.clone(), &app_handle)
                        .await
                    {
                        Ok(result) => break Ok(result),
                        Err(e) => {
                            if retries >= MAX_RETRIES {
                                let mut state = state.lock().await;
                                state.failed_urls.insert(url.to_string());
                                // println!("Marked as failed after retries: {}", url);
                                break Ok(DomainCrawlResults {
                                    url: url.to_string(),
                                    status_code: 0, // Indicates failure
                                    ..Default::default()
                                });
                            }
                            eprintln!("Error processing URL (retry {}): {}", retries + 1, e);
                            retries += 1;
                            sleep(Duration::from_secs(1)).await;
                        }
                    }
                };
                (url, result) // Return URL with result for tracking
            });

            handles.push(handle);
        }

        for handle in handles {
            match handle.await {
                Ok((url, Ok(result))) => {
                    let mut state = state.lock().await;
                    if !state.visited.contains(&url.to_string()) {
                        state.results.push(result);
                    }
                }
                Ok((url, Err(e))) => {
                    eprintln!("Task completed with unexpected error for {}: {}", url, e);
                    let mut state = state.lock().await;
                    if !state.failed_urls.contains(url.as_str())
                        && !state.visited.contains(url.as_str())
                    {
                        state.queue.push_back(url.clone()); // Re-queue if not marked
                                                            // println!("Re-queued URL due to error: {}", url);
                    }
                }
                Err(e) => {
                    // eprintln!("Task panicked or was cancelled: {:?}", e);
                    // URL isn’t available here; rely on pending_urls to catch
                }
            }
        }

        if crawl_start_time.elapsed() > CRAWL_TIMEOUT {
            println!("\nCrawl timeout reached. Stopping...");
            if let Err(err) = app_handle.emit("crawl_interrupted", ()) {
                eprintln!("Failed to emit crawl interruption event: {}", err);
            }
            break;
        }
    }

    let state = state.lock().await;
    println!("\nCrawl completed:");
    println!("Total crawlable URLs found: {}", state.total_urls);
    println!("URLs crawled: {}", state.crawled_urls);
    println!("Failed URLs: {}", state.failed_urls.len());
    println!("Total time: {:?}", crawl_start_time.elapsed());

    if state.crawled_urls + state.failed_urls.len() < state.total_urls {
        println!("\nWARNING: Incomplete crawl! Some URLs may have been lost:");
        println!("Pending URLs remaining: {}", state.pending_urls.len());
        for url in &state.pending_urls {
            println!("  - Unprocessed: {}", url);
        }
    }

    if let Err(err) = app_handle.emit("crawl_complete", ()) {
        eprintln!("Failed to emit crawl completion event: {}", err);
    }

    // Remove duplicates from the results
    let mut unique_results = Vec::new();
    let mut seen_urls = HashSet::new();
    for result in state.results.clone() {
        if seen_urls.insert(result.url.clone()) {
            unique_results.push(result);
        }
    }

    Ok(unique_results)
}
