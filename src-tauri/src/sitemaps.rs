use reqwest::Client;
use scraper::{Html, Selector};
use serde::Serialize;

#[derive(Serialize)]
pub struct CrawlResult {
    links: Vec<String>,
}

pub async fn crawl_sitemaps(url: String) -> Result<Vec<String>, String> {
    let client = Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Request error: {}", e))?;

    let mut links = Vec::new();
    if response.status().is_success() {
        let body = response
            .text()
            .await
            .map_err(|e| format!("Response error: {}", e))?;
        let document = Html::parse_document(&body);
        let selector = Selector::parse("a").map_err(|e| format!("Selector error: {}", e))?;

        for element in document.select(&selector) {
            if let Some(link) = element.value().attr("href") {
                println!("Link: {}", link);
                links.push(link.to_string());
            }
        }
    } else {
        return Err(format!("Failed to fetch the URL: {}", response.status()));
    }

    // Add the initial URL to the list of links
    links.push(url);

    // Remove duplicates
    links.dedup();

    // Sort the links
    links.sort();

    // Print the links
    for link in &links {
        println!("Link: {}", link);
    }

    println!("Links: {:?}", links);

    Ok(links)
}

// generate a sitemap with the sitemap  .xml format!
