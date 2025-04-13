use colored::*;
use futures::stream::{self, StreamExt};
use rand::Rng;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::{HashSet, VecDeque};
use std::io::Write;
use std::sync::{Arc, RwLock};
use std::time::Instant;
use tauri::{Emitter, Manager};
use tokio::sync::{Mutex, Semaphore};
use tokio::task;
use tokio::time::{sleep, Duration};
use url::Url;

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

// Constants for crawler behavior
const MAX_RETRIES: usize = 5;
const BASE_DELAY: u64 = 500;
const MAX_DELAY: u64 = 8000;
const CONCURRENT_REQUESTS: usize = 150;
const CRAWL_TIMEOUT: Duration = Duration::from_secs(28800); // 8 hours
const BATCH_SIZE: usize = 20;
const DB_BATCH_SIZE: usize = 10; // Reduced to ensure more frequent writes for testing

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
    pub db: Option<Database>,
}

impl CrawlerState {
    fn new(db: Option<Database>) -> Self {
        CrawlerState {
            visited: HashSet::new(),
            failed_urls: HashSet::new(),
            pending_urls: HashSet::new(),
            results: Vec::new(),
            queue: VecDeque::new(),
            total_urls: 0,
            crawled_urls: 0,
            db,
        }
    }
}

// Helper to convert crawl results to database format
fn to_database_results(result: &DomainCrawlResults) -> DatabaseResults {
    DatabaseResults {
        url: result.url.clone(),
        data: serde_json::to_value(result).expect("Failed to serialize crawl results"),
    }
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
            return Err(format!("Failed to fetch {}: {}", url, e));
        }
        Err(_) => {
            let mut state = state.lock().await;
            state.failed_urls.insert(url.to_string());
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

    // Cross-origin checker funtion
    let cross_origin = analyze_cross_origin_security(&body, base_url);

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
        state.results.push(result.clone());
        state.crawled_urls += 1;
        state.visited.insert(url.to_string());
        state.pending_urls.remove(url.as_str());

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
    url.contains('#') || url.contains("login")
}

pub async fn crawl_domain(
    domain: &str,
    app_handle: tauri::AppHandle,
    db: Result<Database, DatabaseError>,
    settings_state: tauri::State<'_, AppState>,
) -> Result<Vec<DomainCrawlResults>, String> {
    // Import the user agents from another module to use across domain crawler
    let user_agents = user_agents::agents();

    let settings = Arc::new(settings_state.settings.read().await.clone());

    println!(
        "This is the settings files ouput: {:?}",
        &settings.links_request_timeout
    );

    let client = Client::builder()
        // .user_agent(&user_agents[rand::thread_rng().gen_range(0..user_agents.len())])
        // Instead use the user agents in the configuration files
        .user_agent(&settings.user_agents[rand::thread_rng().gen_range(0..user_agents.len())])
        .timeout(Duration::from_secs(60))
        .connect_timeout(Duration::from_secs(15))
        .redirect(reqwest::redirect::Policy::limited(5))
        .build()
        .map_err(|e| e.to_string())?;

    let url_checked = url_check(domain);
    let base_url = Url::parse(&url_checked).map_err(|_| "Invalid URL")?;

    let db_option = match db {
        Ok(database) => Some(database),
        Err(e) => {
            eprintln!("Database connection failed: {}", e);
            None
        }
    };

    let state = Arc::new(Mutex::new(CrawlerState::new(db_option)));
    {
        let mut state = state.lock().await;
        state.queue.push_back(base_url.clone());
        state.total_urls = 1;
        state.pending_urls.insert(base_url.to_string());
    }

    // Using the settings here to replace the hardcoded concurrent requests
    // let semaphore = Arc::new(Semaphore::new(CONCURRENT_REQUESTS));
    let semaphore = Arc::new(Semaphore::new(settings.concurrent_requests));
    let crawl_start_time = Instant::now();
    let mut batch_counter = 0;

    loop {
        let current_batch: Vec<Url> = {
            let mut state = state.lock().await;
            if state.queue.is_empty() {
                if state.crawled_urls + state.failed_urls.len() >= state.total_urls {
                    break;
                }
                break;
            }
            let batch_size = std::cmp::min(settings.batch_size, state.queue.len());
            state.queue.drain(..batch_size).collect()
        };

        let mut handles = Vec::with_capacity(current_batch.len());
        for url in current_batch.clone() {
            let client = client.clone();
            let base_url = base_url.clone();
            let state = state.clone();
            let app_handle = app_handle.clone();
            let semaphore = semaphore.clone();

            let settings_clone = settings.clone();

            let handle = tokio::spawn(async move {
                let _permit = semaphore.acquire().await.unwrap();
                let jitter = rand::thread_rng().gen_range(500..2000);
                sleep(Duration::from_millis(jitter)).await;

                let mut retries = 0;
                let result: Result<DomainCrawlResults, String> = loop {
                    match process_url(
                        url.clone(),
                        &client,
                        &base_url,
                        state.clone(),
                        &app_handle,
                        &settings_clone,
                    )
                    .await
                    {
                        Ok(result) => break Ok(result),
                        Err(e) => {
                            eprintln!("Error processing URL: {}", e);
                            if retries >= settings_clone.max_retries {
                                let mut state = state.lock().await;
                                state.failed_urls.insert(url.to_string());
                                break Ok(DomainCrawlResults {
                                    url: url.to_string(),
                                    status_code: 0,
                                    ..Default::default()
                                });
                            }
                            retries += 1;
                            sleep(Duration::from_secs(1)).await;
                        }
                    }
                };
                (url, result)
            });

            handles.push(handle);
        }

        for handle in handles {
            match handle.await {
                Ok((url, Ok(result))) => {
                    let mut state = state.lock().await;
                    if !state.visited.contains(&url.to_string()) {
                        state.results.push(result.clone());

                        // Handle database insertion
                        if let Some(db) = &state.db {
                            batch_counter += 1;

                            let batch_start = state.results.len().saturating_sub(batch_counter);
                            let recent_results = &state.results[batch_start..];
                            let db_results = recent_results
                                .iter()
                                .map(to_database_results)
                                .collect::<Vec<_>>();

                            // Insert every DB_BATCH_SIZE or if we have any results
                            if batch_counter >= settings.db_batch_size || !recent_results.is_empty()
                            {
                                match database::insert_bulk_crawl_data(db.get_pool(), db_results)
                                    .await
                                {
                                    Ok(()) => println!(
                                        "Successfully inserted batch of {} results",
                                        recent_results.len()
                                    ),
                                    Err(e) => eprintln!("Failed to batch insert results: {}", e),
                                }
                                batch_counter = 0;
                            }
                        }
                    }
                }
                Ok((url, Err(e))) => {
                    let mut state = state.lock().await;
                    if !state.failed_urls.contains(url.as_str())
                        && !state.visited.contains(url.as_str())
                    {
                        state.queue.push_back(url.clone());
                    }
                }
                Err(e) => eprintln!("Task failed: {:?}", e),
            }
        }

        if crawl_start_time.elapsed() > Duration::from_secs(settings.crawl_timeout) {
            if let Err(err) = app_handle.emit("crawl_interrupted", ()) {
                eprintln!("Failed to emit crawl interruption event: {}", err);
            }
            break;
        }
    }

    // Insert any remaining results
    let final_state = state.lock().await;
    if let Some(db) = &final_state.db {
        if !final_state.results.is_empty() {
            let db_results = final_state
                .results
                .iter()
                .map(to_database_results)
                .collect::<Vec<_>>();

            match database::insert_bulk_crawl_data(db.get_pool(), db_results).await {
                Ok(()) => println!(
                    "Successfully inserted final batch of {} results",
                    final_state.results.len()
                ),
                Err(e) => eprintln!("Failed to insert final batch: {}", e),
            }
        }
    }

    // Remove duplicates from the results
    let mut unique_results = Vec::new();
    let mut seen_urls = HashSet::new();
    for result in final_state.results.clone() {
        if seen_urls.insert(result.url.clone()) {
            unique_results.push(result);
        }
    }

    if let Err(err) = app_handle.emit("crawl_complete", ()) {
        eprintln!("Failed to emit crawl completion event: {}", err);
    }

    println!(
        "Crawl completed with {} unique results",
        unique_results.len()
    );
    Ok(unique_results)
}
