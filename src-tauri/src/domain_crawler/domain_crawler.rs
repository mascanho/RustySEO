use futures::stream::{self, StreamExt};
use regex::Regex;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::{HashSet, VecDeque};
use std::sync::{Arc, Mutex};
use url::Url;

use crate::domain_crawler::helpers;

#[derive(Serialize, Debug, Deserialize, Clone)]
pub struct DomainCrawlResults {
    pub url: String,
    pub title: String,
    pub description: String,
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

    // Store all crawled URLs in a separate variable
    let all_urls = Arc::new(Mutex::new(Vec::new()));

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
                let all_urls = all_urls.clone();

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
                    println!("Crawling: {}", url);

                    // Fetch the page content
                    let response = match client.get(url.as_str()).send().await {
                        Ok(response) => response,
                        Err(e) => {
                            eprintln!("Failed to fetch {}: {}", url, e);
                            return Ok(());
                        }
                    };

                    // Check if the response is an HTML page
                    let is_html = response
                        .headers()
                        .get("content-type")
                        .and_then(|header| header.to_str().ok())
                        .map(|content_type| content_type.contains("text/html"))
                        .unwrap_or(false);

                    // Consume the response body
                    let body = match response.text().await {
                        Ok(body) => body,
                        Err(e) => {
                            eprintln!("Failed to read response body from {}: {}", url, e);
                            return Ok(());
                        }
                    };

                    // Extract the title if it's an HTML page
                    let title = if is_html {
                        extract_title(&body).unwrap_or_else(|| "No Title".to_string())
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

                    // Store the result
                    {
                        let mut results_guard = results.lock().unwrap();
                        results_guard.push(DomainCrawlResults {
                            url: url.to_string(),
                            title: title.clone().to_string(),
                            description: description.clone().to_string(),
                        });
                    }

                    // Store the URL in the all_urls list
                    {
                        let mut all_urls_guard = all_urls.lock().unwrap();
                        all_urls_guard.push(url.to_string());
                    }

                    // If it's not an HTML page, don't extract links
                    if !is_html {
                        return Ok(());
                    }

                    // Extract links using regex
                    let re = Regex::new(r#"href="([^"]+)"#).unwrap();
                    let links: Vec<Url> = re
                        .captures_iter(&body)
                        .filter_map(|cap| {
                            let href = cap.get(1)?.as_str();
                            build_full_url(&base_url, href).ok()
                        })
                        .filter(|next_url| next_url.domain() == base_url.domain()) // Filter by domain
                        .collect();

                    // Add new links to the queue
                    {
                        let mut queue_guard = queue.lock().unwrap();
                        for link in links {
                            if !visited.lock().unwrap().contains(link.as_str()) {
                                queue_guard.push_back(link);
                            }
                        }
                    }

                    Ok(())
                }
            })
            .buffer_unordered(5); // Limit concurrency to 5

        // Execute the stream for the current batch
        while let Some(result) = stream.next().await {
            if let Err(e) = result {
                eprintln!("Error crawling page: {}", e);
            }
        }
    }

    // Return the results
    let results_guard = results.lock().unwrap();
    Ok(results_guard.clone())
}

/// Extracts the title from the HTML content
fn extract_title(html: &str) -> Option<String> {
    let re = Regex::new(r"<title>(.*?)</title>").ok()?;
    re.captures(html)
        .and_then(|cap| cap.get(1))
        .map(|title| title.as_str().trim().to_string())
}

/// Builds a full URL from a base URL and a relative or absolute href
fn build_full_url(base_url: &Url, href: &str) -> Result<Url, url::ParseError> {
    Url::options().base_url(Some(base_url)).parse(href)
}
