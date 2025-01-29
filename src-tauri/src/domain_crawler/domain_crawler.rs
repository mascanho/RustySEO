use futures::stream::{self, StreamExt};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet, VecDeque};
use std::io::Write;
use std::sync::Arc;
use tauri::{Emitter, Manager};
use tokio::sync::Mutex;
use tokio::time::{sleep, Duration};
use url::Url; // Import Tauri's Manager for event emission

use super::helpers::javascript_selector::JavaScript;
use super::helpers::title_selector::TitleDetails;
use super::models::DomainCrawlResults;
use crate::domain_crawler::helpers;

// Define a struct to hold the progress data
#[derive(Clone, Serialize)]
struct ProgressData {
    total_urls: usize,
    crawled_urls: usize,
    percentage: f32,
}

pub async fn crawl_domain(
    domain: &str,
    app_handle: tauri::AppHandle,
) -> Result<Vec<DomainCrawlResults>, String> {
    // Create a client with a trustworthy user-agent
    let client = Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    // Parse the base URL
    let base_url = Url::parse(domain).map_err(|_| "Invalid domain")?;

    // Shared state using tokio::sync::Mutex for thread-safe access
    let visited = Arc::new(Mutex::new(HashSet::new())); // Tracks visited URLs
    let results = Arc::new(Mutex::new(Vec::new())); // Stores crawl results
    let queue = Arc::new(Mutex::new(VecDeque::new())); // Queue of URLs to crawl
    let total_urls = Arc::new(Mutex::new(1)); // Total URLs to crawl (starts with 1 for the base URL)
    let crawled_urls = Arc::new(Mutex::new(0)); // Number of URLs crawled so far

    // Initialize the queue with the base URL
    queue.lock().await.push_back(base_url.clone());

    // Loop until the queue is empty
    while !queue.lock().await.is_empty() {
        // Collect the current batch of URLs to crawl
        let current_batch: Vec<Url> = {
            let mut queue_guard = queue.lock().await;
            queue_guard.drain(..).collect()
        };

        // Concurrently crawl pages using a stream
        let mut stream = stream::iter(current_batch)
            .map(|url| {
                let client = client.clone();
                let base_url = base_url.clone();
                let visited = visited.clone();
                let results = results.clone();
                let queue = queue.clone();
                let total_urls = total_urls.clone();
                let crawled_urls = crawled_urls.clone();
                let app_handle = app_handle.clone(); // Clone the app handle for event emission

                async move {
                    // Skip if URL already visited
                    {
                        let mut visited_guard = visited.lock().await;
                        if visited_guard.contains(url.as_str()) {
                            return Ok::<(), String>(());
                        }
                        visited_guard.insert(url.to_string());
                    }

                    // Fetch the page content
                    let response = match client.get(url.as_str()).send().await {
                        Ok(response) => response,
                        Err(e) => {
                            eprintln!("Failed to fetch {}: {}", url, e);
                            return Ok(());
                        }
                    };

                    let status_code = response.status().as_u16();
                    let content_type = response
                        .headers()
                        .get("content-type")
                        .and_then(|header| header.to_str().ok())
                        .map(|s| s.to_string());

                    let body = match response.text().await {
                        Ok(body) => body,
                        Err(e) => {
                            eprintln!("Failed to read response body from {}: {}", url, e);
                            return Ok(());
                        }
                    };

                    let is_html =
                        helpers::check_html_page::is_html_page(&body, content_type.as_deref())
                            .await;

                    if !is_html {
                        println!("Page classified as non-HTML: {}", url);
                        println!("Content-Type: {:?}", content_type);
                        let body_snippet = if body.len() > 100 {
                            &body[..100]
                        } else {
                            &body
                        };
                        println!("Body snippet: {}", body_snippet);
                    }

                    // GET THE PAGE TITLES
                    let title = if is_html {
                        Some(
                            helpers::title_selector::extract_title(&body).unwrap_or_else(|| vec![]),
                        )
                    } else {
                        None
                    };

                    // GET THE DESCRIPTIONS
                    let description = if is_html {
                        helpers::page_description::extract_page_description(&body)
                            .unwrap_or_else(|| "No Description".to_string())
                    } else {
                        "Not an HTML page".to_string()
                    };

                    // GET ALL THE HEADINGS
                    let headings = helpers::headings_selector::headings_selector(&body);

                    // GET ALL THE JAVASCRIPT
                    let javascript = helpers::javascript_selector::extract_javascript(&body);
                    let images = helpers::images_selector::extract_images(&body);

                    // GET ALL THE ANCHOR LINKS
                    let anchor_links =
                        helpers::anchor_links::extract_internal_external_links(&body);

                    // GET THE INDEXABILITY
                    let indexability = helpers::indexability::extract_indexability(&body);

                    // GET THE ALT TAGS
                    let alt_tags = helpers::alt_tags::get_alt_tags(&body);

                    // GET THE SCHEMA
                    let schema = helpers::schema_selector::get_schema(&body);

                    // Store results
                    {
                        let mut results_guard = results.lock().await;
                        results_guard.push(DomainCrawlResults {
                            url: url.to_string(),
                            title,
                            description,
                            headings,
                            javascript,
                            images,
                            status_code,
                            anchor_links,
                            indexability,
                            alt_tags,
                            schema,
                        });
                    }

                    // Update crawled URLs counter
                    {
                        let mut crawled_urls_guard = crawled_urls.lock().await;
                        *crawled_urls_guard += 1;
                    }

                    if !is_html {
                        return Ok(());
                    }

                    // Process new links
                    let links = helpers::links_selector::extract_links(&body, &base_url);
                    {
                        let mut queue_guard = queue.lock().await;
                        let visited_guard = visited.lock().await;
                        let mut total_urls_guard = total_urls.lock().await;

                        for link in links {
                            if !visited_guard.contains(link.as_str())
                                && !queue_guard.contains(&link)
                            {
                                queue_guard.push_back(link);
                                *total_urls_guard += 1;
                            }
                        }
                    }

                    // DEBUG
                    println!("Queue size: {}", queue.lock().await.len());
                    println!("Visited URLs: {}", visited.lock().await.len());

                    // Calculate progress and emit it to the frontend
                    {
                        let total_urls_guard = total_urls.lock().await;
                        let crawled_urls_guard = crawled_urls.lock().await;
                        let progress =
                            (*crawled_urls_guard as f32 / *total_urls_guard as f32) * 100.0;

                        // Emit progress data to the frontend
                        let progress_data = ProgressData {
                            total_urls: *total_urls_guard,
                            crawled_urls: *crawled_urls_guard,
                            percentage: progress,
                        };
                        if let Err(err) = app_handle.emit("progress_update", progress_data) {
                            eprintln!("Failed to emit progress update: {}", err);
                        }

                        // Display progress in the console
                        print!(
                            "\r\x1b[34mProgress: {:.2}%\x1b[0m ({} / {})",
                            progress, crawled_urls_guard, total_urls_guard
                        );
                        std::io::stdout().flush().unwrap();
                    }

                    sleep(Duration::from_millis(200)).await;
                    Ok(())
                }
            })
            // Concurrently crawl pages using a stream
            .buffer_unordered(5);

        while let Some(result) = stream.next().await {
            if let Err(e) = result {
                eprintln!("Error crawling page: {}", e);
            }
        }
    }

    println!();
    let results_guard = results.lock().await;
    println!("\x1b[32m{} Pages Crawled\x1b[0m", results_guard.len());
    Ok(results_guard.clone())
}
