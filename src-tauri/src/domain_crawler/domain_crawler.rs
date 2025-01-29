use futures::stream::{self, StreamExt};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::{HashSet, VecDeque};
use std::io::Write;
use std::sync::Arc;
use tauri::{Emitter, Manager};
use tokio::sync::Mutex;
use tokio::time::{sleep, Duration};
use url::Url;

// Import your custom modules
use super::helpers::{
    alt_tags, anchor_links, check_html_page, headings_selector, images_selector, indexability,
    javascript_selector, links_selector, page_description, schema_selector, title_selector,
};
use super::models::DomainCrawlResults;

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

        println!("Processing batch of {} URLs", current_batch.len());

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
                let app_handle = app_handle.clone();

                async move {
                    // Skip if URL already visited
                    {
                        let mut visited_guard = visited.lock().await;
                        if visited_guard.contains(url.as_str()) {
                            println!("Skipping already visited URL: {}", url);
                            return Ok::<(), String>(());
                        }
                        visited_guard.insert(url.to_string());
                    }

                    println!("Fetching URL: {}", url);

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

                    // Check if the page is HTML
                    let is_html =
                        check_html_page::is_html_page(&body, content_type.as_deref()).await;

                    if !is_html {
                        println!("Page classified as non-HTML: {}", url);
                        println!("Content-Type: {:?}", content_type);
                        let body_snippet = if body.len() > 100 {
                            &body[..100]
                        } else {
                            &body
                        };
                        println!("Body snippet: {}", body_snippet);
                        return Ok(());
                    }

                    println!("Processing HTML page: {}", url);

                    // Process HTML content
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

                    // Store results
                    {
                        let mut results_guard = results.lock().await;
                        results_guard.push(DomainCrawlResults {
                            url: url.to_string(),
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
                        });
                    }

                    // Update crawled URLs counter
                    {
                        let mut crawled_urls_guard = crawled_urls.lock().await;
                        *crawled_urls_guard += 1;
                    }

                    // Extract and process new links
                    let links = links_selector::extract_links(&body, &base_url);
                    {
                        let mut queue_guard = queue.lock().await;
                        let visited_guard = visited.lock().await;
                        let mut total_urls_guard = total_urls.lock().await;

                        for link in links {
                            if !visited_guard.contains(link.as_str())
                                && !queue_guard.contains(&link)
                            {
                                println!("Adding new URL to queue: {}", link);
                                queue_guard.push_back(link);
                                *total_urls_guard += 1;
                            }
                        }
                    }

                    // Calculate progress and emit it to the frontend
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

                    sleep(Duration::from_millis(200)).await;
                    Ok(())
                }
            })
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
