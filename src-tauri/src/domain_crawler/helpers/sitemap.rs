use reqwest::Client;
use std::collections::HashSet;
use url::Url;
use scraper::{Html, Selector};
use crate::domain_crawler::helpers::robots::get_robots_data;

pub async fn extract_urls_from_sitemaps(base_url: &Url, client: &Client) -> HashSet<String> {
    let mut discovered_urls = HashSet::new();
    let mut sitemap_queue = HashSet::new();
    let mut processed_sitemaps = HashSet::new();

    // 1. Try to find sitemaps in robots.txt
    if let Some(robots_data) = get_robots_data(base_url).await {
        for text in &robots_data.raw_text {
            for line in text.lines() {
                let line = line.trim();
                if line.to_lowercase().starts_with("sitemap:") {
                    let sitemap_url = line["sitemap:".len()..].trim();
                    if let Ok(url) = Url::parse(sitemap_url) {
                        sitemap_queue.insert(url);
                    }
                }
            }
        }
    }

    // 2. Add default sitemap locations if the queue is still empty (or as fallback)
    let defaults = ["sitemap.xml", "sitemap_index.xml"];
    for path in defaults {
        if let Ok(url) = base_url.join(path) {
            sitemap_queue.insert(url);
        }
    }

    let mut queue_vec: Vec<Url> = sitemap_queue.into_iter().collect();

    // 3. Process sitemaps recursively (to handle sitemap indexes)
    while let Some(current_sitemap) = queue_vec.pop() {
        let sitemap_str = current_sitemap.to_string();
        if processed_sitemaps.contains(&sitemap_str) {
            continue;
        }
        processed_sitemaps.insert(sitemap_str);

        println!("Processing sitemap: {}", current_sitemap);

        match fetch_sitemap(&current_sitemap, client).await {
            Ok(content) => {
                let (urls, nested_sitemaps) = parse_sitemap_content(&content);
                
                // Add found URLs to discovered_urls
                for url in urls {
                    discovered_urls.insert(url);
                }

                // Add nested sitemaps back to the queue
                for nested in nested_sitemaps {
                    if let Ok(url) = Url::parse(&nested) {
                        queue_vec.push(url);
                    }
                }
            }
            Err(e) => {
                eprintln!("Failed to fetch sitemap {}: {}", current_sitemap, e);
            }
        }
    }

    discovered_urls
}

async fn fetch_sitemap(url: &Url, client: &Client) -> Result<String, String> {
    let response = client.get(url.clone())
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    let body = response.text().await.map_err(|e| e.to_string())?;
    Ok(body)
}

fn parse_sitemap_content(content: &str) -> (Vec<String>, Vec<String>) {
    let mut urls = Vec::new();
    let mut sitemaps = Vec::new();

    let document = Html::parse_document(content);
    
    // Check if it's a sitemap index or a regular sitemap
    let is_index = content.contains("<sitemapindex");
    
    let loc_selector = Selector::parse("loc").unwrap();

    for element in document.select(&loc_selector) {
        let loc = element.inner_html().trim().to_string();
        if !loc.is_empty() {
            if is_index || loc.to_lowercase().ends_with(".xml") {
                // If we are in an index, or the loc itself looks like a sitemap
                // Note: some sitemaps don't end in .xml but if we're in <sitemapindex> we know they are sitemaps
                // We'll trust the context of where we found it.
                // However, most locs in sitemapindex are sitemaps.
                
                // In a sitemapindex, <loc> points to another sitemap.
                // In a urlset (regular sitemap), <loc> points to a page.
                
                // We'll check the parent tag if possible, but scraper's inner_html is easier.
                // If it's a sitemap index, everything in <loc> is a sitemap.
                if is_index {
                    sitemaps.push(loc);
                } else {
                    urls.push(loc);
                }
            } else {
                urls.push(loc);
            }
        }
    }

    (urls, sitemaps)
}
