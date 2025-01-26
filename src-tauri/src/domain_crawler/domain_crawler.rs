use futures::stream::{self, StreamExt};
use reqwest::Client;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet, VecDeque};
use std::sync::{Arc, Mutex};
use url::Url;

use crate::domain_crawler::helpers;

#[derive(Serialize, Debug, Deserialize, Clone)]
pub struct DomainCrawlResults {
    pub url: String,
    pub title: String,
    pub description: String,
    pub headings: HashMap<String, Vec<String>>,
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

                    // Extract the content-type header before consuming the response
                    let content_type = response
                        .headers()
                        .get("content-type")
                        .and_then(|header| header.to_str().ok())
                        .map(|s| s.to_string());

                    // Consume the response body
                    let body = match response.text().await {
                        Ok(body) => body,
                        Err(e) => {
                            eprintln!("Failed to read response body from {}: {}", url, e);
                            return Ok(());
                        }
                    };

                    // Check if the response is an HTML page
                    let is_html = is_html_page(&body, content_type.as_deref());

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

                    println!("These are the headings:{:?}", headings);

                    // Store the result
                    {
                        let mut results_guard = results.lock().unwrap();
                        results_guard.push(DomainCrawlResults {
                            url: url.to_string(),
                            title: title.clone().to_string(),
                            description: description.clone().to_string(),
                            headings: headings.clone(),
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

                    // GET THE LINKS FROM THE PAGE AND CRAWL THEM
                    let links = helpers::links_selector::extract_links(&body, &base_url);

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
            .buffer_unordered(10); // Limit concurrency to 10

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

/// Checks if the response is an HTML page
fn is_html_page(body: &str, content_type: Option<&str>) -> bool {
    // Check the content-type header for HTML MIME types
    let is_html_header = content_type
        .map(|content_type| {
            content_type.contains("text/html") || content_type.contains("application/xhtml+xml")
        })
        .unwrap_or(false);

    // Check the response body for HTML-like content
    let is_html_body = {
        // Check for common HTML tags or patterns
        body.contains("<html")
            || body.contains("<!DOCTYPE html")
            || body.contains("<head")
            || body.contains("<body")
            || body.contains("<div") // Common HTML tags
            || body.contains("<p")
            || body.contains("<a")
            || body.contains("<img")
            || body.contains("<script")
            || body.contains("<style")
            || body.contains("<h1")
            || body.contains("<h2")
            || body.contains("<h3")
            || body.contains("<h4")
            || body.contains("<h5")
            || body.contains("<h6")
    };

    // Consider the page HTML if either the header or body suggests it
    is_html_header || is_html_body
}
