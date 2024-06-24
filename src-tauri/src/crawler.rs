use std::{fs::File, io::Write};

use reqwest::Client;
use scraper::{Html, Selector};
use serde::Serialize;
use tokio;

#[derive(Serialize)]
pub struct CrawlResult {
    links: Vec<String>,
}

pub async fn crawl(url: String) -> Result<CrawlResult, String> {
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
                links.push(link.to_string());
            }
        }
    } else {
        return Err(format!("Failed to fetch the URL: {}", response.status()));
    }

    Ok(CrawlResult { links })
}
