use futures::stream::{self, StreamExt};
use reqwest::Client;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet, VecDeque};
use std::io::Write;
use std::sync::{Arc, Mutex};
use tokio::time::{sleep, Duration};
use url::Url; // Import the Write trait to use the flush method

use crate::domain_crawler::helpers;

use super::helpers::javascript_selector::JavaScript;

#[derive(Serialize, Debug, Deserialize, Clone)]
pub struct DomainCrawlResults {
    pub url: String,
    pub title: String,
    pub description: String,
    pub headings: HashMap<String, Vec<String>>,
    pub javascript: JavaScript,
    pub images: Vec<String>,
    pub status_code: u16,
}

pub async fn crawl_domain(domain: &str) -> Result<Vec<DomainCrawlResults>, String> {
    // Create a client with a trustworthy user-agent
    let client = Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    // Parse the base URL
    let base_url = Url::parse(domain).map_err(|_| "Invalid domain")?;

    // Shared state for visited URLs and their titles
    let visited = Arc::new(Mutex::new(HashSet::new()));
    let results = Arc::new(Mutex::new(Vec::new()));

    // Queue for URLs to crawl
    let queue = Arc::new(Mutex::new(VecDeque::new()));
    queue.lock().unwrap().push_back(base_url.clone());

    // Track total URLs and crawled URLs for progress
    let total_urls = Arc::new(Mutex::new(1)); // Start with 1 (the base URL)
    let crawled_urls = Arc::new(Mutex::new(0));

    // Loop until the queue is empty
    while !queue.lock().unwrap().is_empty() {
        // Collect the current batch of URLs to crawl
        let current_batch: Vec<Url> = {
            let mut queue_guard = queue.lock().unwrap();
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

                async move {
                    // Skip if URL already visited
                    {
                        let mut visited_guard = visited.lock().unwrap();
                        if visited_guard.contains(url.as_str()) {
                            return Ok::<(), String>(());
                        }
                        visited_guard.insert(url.to_string());
                    }

                    // Output the URL being crawled
                    // println!("Crawling: {}", url);

                    // Fetch the page content
                    let response = match client.get(url.as_str()).send().await {
                        Ok(response) => response,
                        Err(e) => {
                            eprintln!("Failed to fetch {}: {}", url, e);
                            return Ok(());
                        }
                    };

                    // Extract the content-type header before consuming the response
                    let content_type = response
                        .headers()
                        .get("content-type")
                        .and_then(|header| header.to_str().ok())
                        .map(|s| s.to_string());

                    // CHECK THE STATUS CODE OF EACH URL REPONSE
                    let status_code = response.status().as_u16();

                    // Consume the response body
                    let body = match response.text().await {
                        Ok(body) => body,
                        Err(e) => {
                            eprintln!("Failed to read response body from {}: {}", url, e);
                            return Ok(());
                        }
                    };

                    // Check if the response is an HTML page
                    let is_html =
                        helpers::check_html_page::is_html_page(&body, content_type.as_deref());

                    // Debug log for pages incorrectly classified as non-HTML
                    if !is_html {
                        println!("Page classified as non-HTML: {}", url);
                        println!("Content-Type: {:?}", content_type);

                        // Log the first 100 characters of the body, or the entire body if it's shorter
                        let body_snippet = if body.len() > 100 {
                            &body[..100]
                        } else {
                            &body
                        };
                        println!("Body snippet: {}", body_snippet);
                    }

                    // Extract the title if it's an HTML page
                    let title = if is_html {
                        helpers::title_selector::extract_title(&body)
                            .unwrap_or_else(|| "No Title".to_string())
                    } else {
                        "Not an HTML page".to_string()
                    };

                    // Extract the page description if it's an HTML page
                    let description = if is_html {
                        helpers::page_description::extract_page_description(&body)
                            .unwrap_or_else(|| "No Description".to_string())
                    } else {
                        "Not an HTML page".to_string()
                    };

                    // Extract the headings on the page
                    let headings = helpers::headings_selector::headings_selector(&body);

                    // Extract the JavaScript on the page
                    let javascript = helpers::javascript_selector::extract_javascript(&body);

                    // EXTRACT THE IMAGES FROM THE PAGE
                    let images = helpers::images_selector::extract_images(&body);

                    // STORE THE RESULTS
                    {
                        let mut results_guard = results.lock().unwrap();
                        results_guard.push(DomainCrawlResults {
                            url: url.to_string(),
                            title: title.clone().to_string(),
                            description: description.clone().to_string(),
                            headings: headings.clone(),
                            javascript: javascript.clone(),
                            images: images.clone(),
                            status_code,
                        });
                    }

                    // Increment the crawled URLs counter
                    {
                        let mut crawled_urls_guard = crawled_urls.lock().unwrap();
                        *crawled_urls_guard += 1;
                    }

                    // If it's not an HTML page, don't extract links
                    if !is_html {
                        return Ok(());
                    }

                    // GET THE LINKS FROM THE PAGE AND CRAWL THEM
                    let links = helpers::links_selector::extract_links(&body, &base_url);

                    // Add new links to the queue
                    {
                        let mut queue_guard = queue.lock().unwrap();
                        let mut visited_guard = visited.lock().unwrap();
                        let mut total_urls_guard = total_urls.lock().unwrap();

                        for link in links {
                            if !visited_guard.contains(link.as_str())
                                && !queue_guard.contains(&link)
                            {
                                queue_guard.push_back(link.clone());
                                *total_urls_guard += 1; // Update the total URLs count
                            }
                        }
                    }

                    // Display progress
                    {
                        {
                            let total_urls_guard = total_urls.lock().unwrap();
                            let crawled_urls_guard = crawled_urls.lock().unwrap();
                            let progress =
                                (*crawled_urls_guard as f32 / *total_urls_guard as f32) * 100.0;
                            print!(
                                "\r\x1b[34mProgress: {:.2}%\x1b[0m ({} / {})",
                                progress, crawled_urls_guard, total_urls_guard
                            );
                            std::io::stdout().flush().unwrap(); // Ensure the output is displayed immediately
                        }
                    }

                    // Add a delay to avoid overwhelming the server
                    sleep(Duration::from_millis(500)).await;

                    Ok(())
                }
            })
            .buffer_unordered(10); // Limit concurrency to 10

        // Execute the stream for the current batch
        while let Some(result) = stream.next().await {
            if let Err(e) = result {
                eprintln!("Error crawling page: {}", e);
            }
        }
    }

    // Print a newline after the progress indicator
    println!();

    // Return the results
    let results_guard = results.lock().unwrap();
    println!("\x1b[32m{} Pages Crawled\x1b[0m", &results_guard.len());
    Ok(results_guard.clone())
}
