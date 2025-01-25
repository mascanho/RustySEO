use futures::stream::{self, StreamExt};
use regex::Regex;
use reqwest::Client;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use url::Url;

pub async fn crawl_domain(domain: &str) -> Result<Vec<(String, String)>, String> {
    // Create a client with a trustworthy user-agent
    let client = Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    let visited = Arc::new(Mutex::new(HashMap::new())); // Use HashMap to store URLs and titles
    let base_url = Url::parse(domain).map_err(|_| "Invalid domain")?;

    crawl_page(client, base_url.clone(), visited, &base_url).await
}

async fn crawl_page(
    client: Client,
    url: Url,
    visited: Arc<Mutex<HashMap<String, String>>>, // Use HashMap to store URLs and titles
    base_url: &Url,
) -> Result<Vec<(String, String)>, String> {
    // Check if URL already visited
    {
        let mut visited_guard = visited.lock().map_err(|_| "Lock error")?;
        if visited_guard.contains_key(url.as_str()) {
            return Ok(vec![]); // Return early if URL already visited
        }
    }

    // Fetch the page content
    let response = client
        .get(url.as_str())
        .send()
        .await
        .map_err(|e| e.to_string())?;

    // Check if the response is an HTML page
    let is_html = response
        .headers()
        .get("content-type")
        .and_then(|header| header.to_str().ok())
        .map(|content_type| content_type.contains("text/html"))
        .unwrap_or(false);

    // Consume the response body
    let body = response.text().await.map_err(|e| e.to_string())?;

    // Extract the title if it's an HTML page
    let title = if is_html {
        extract_title(&body).unwrap_or_else(|| "No Title".to_string())
    } else {
        "Not an HTML page".to_string()
    };

    // Add the URL and title to the visited map
    {
        let mut visited_guard = visited.lock().map_err(|_| "Lock error")?;
        visited_guard.insert(url.to_string(), title.clone());
    }

    // Collect the URL and title
    let mut all_links = vec![(url.to_string(), title)];

    // If it's not an HTML page, don't extract links
    if !is_html {
        return Ok(all_links);
    }

    // Extract links using regex
    let re = Regex::new(r#"href="([^"]+)"#).map_err(|e| e.to_string())?;
    let mut links: Vec<Url> = re
        .captures_iter(&body)
        .filter_map(|cap| {
            let href = cap.get(1)?.as_str();
            build_full_url(base_url, href).ok()
        })
        .collect();

    // Filter links to only include those from the same domain
    links.retain(|next_url| next_url.domain() == base_url.domain());

    // Recursively crawl linked pages
    let mut futures = Vec::new();
    for next_url in links {
        let client = client.clone();
        let base_url = base_url.clone();
        let visited = visited.clone();
        futures.push(async move { crawl_page(client, next_url, visited, &base_url).await });
    }

    // Execute futures concurrently
    let results = stream::iter(futures)
        .buffer_unordered(5) // Limit concurrency to 5
        .collect::<Vec<_>>()
        .await;

    // Aggregate results
    for result in results {
        match result {
            Ok(mut links) => all_links.append(&mut links),
            Err(e) => eprintln!("Error crawling page: {}", e),
        }
    }

    Ok(all_links)
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
