use std::{fs::File, io::Write};

use reqwest::Client;
use scraper::{Html, Selector};
use serde::Serialize;
use tokio;

#[derive(Serialize)]
pub struct LinkResult {
    links: Vec<String>,
}

#[derive(Serialize)]
pub struct HeadingsResult {
    headings: Vec<String>,
}

#[derive(Serialize)]
pub struct Sitemap {
    links: Vec<String>,
    schema: String,
}

pub async fn crawl(url: String) -> Result<LinkResult, String> {
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

    Ok(LinkResult { links })
}

// Get the headings

pub async fn crawl_headings(url: String) -> Result<HeadingsResult, String> {
    let client = Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Request error: {}", e))?;

    let mut headings = Vec::new();
    if response.status().is_success() {
        let body = response
            .text()
            .await
            .map_err(|e| format!("Response error: {}", e))?;
        let document = Html::parse_document(&body);

        // Adjust selector to target headings (h1, h2, h3, etc.)
        for level in 1..=6 {
            let selector = Selector::parse(&format!("h{}", level))
                .map_err(|e| format!("Selector error: {}", e))?;

            for element in document.select(&selector) {
                let text = element.text().collect::<String>();
                headings.push(text);
            }
        }
    } else {
        return Err(format!("Failed to fetch the URL: {}", response.status()));
    }
    println!("Headings: {:?}", headings);

    Ok(HeadingsResult { headings })
}
