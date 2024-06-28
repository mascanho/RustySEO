use std::time::Instant;

use reqwest::Client;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CrawlResult {
    pub links: Vec<String>,
    pub headings: Vec<String>,
    pub alt_texts: Vec<String>,
    pub elapsed_time: u128,
    pub indexation: Vec<String>,
}

#[derive(Serialize)]
pub struct LinkResult {
    pub links: Vec<String>,
}

pub async fn crawl(url: String) -> Result<CrawlResult, String> {
    let client = Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Request error: {}", e))?;

    let mut links = Vec::new();
    let mut headings = Vec::new();
    let mut alt_texts = Vec::new();
    let mut page_title: Vec<String> = Vec::new();
    let mut indexation: Vec<String> = Vec::new();

    if response.status().is_success() {
        let body = response
            .text()
            .await
            .map_err(|e| format!("Response error: {}", e))?;
        let document = Html::parse_document(&body);

        // Fetch links
        let link_selector = Selector::parse("a").map_err(|e| format!("Selector error: {}", e))?;
        for element in document.select(&link_selector) {
            if let Some(link) = element.value().attr("href") {
                links.push(link.to_string());
            }
        }

        // Fetch alt texts for images
        let img_selector = Selector::parse("img").map_err(|e| format!("Selector error: {}", e))?;
        for img in document.select(&img_selector) {
            if let Some(alt) = img.value().attr("alt") {
                alt_texts.push(alt.to_string());
            } else {
                alt_texts.push("NO ALT".to_string()); // Handle cases where alt attribute is missing
            }
        }

        // Fetch headings
        for level in 1..=6 {
            let heading_selector = Selector::parse(&format!("h{}", level))
                .map_err(|e| format!("Selector error: {}", e))?;
            for element in document.select(&heading_selector) {
                let text = element.text().collect::<Vec<_>>().join(" ");
                let heading_with_type = format!("h{}: {}", level, text);
                headings.push(heading_with_type);
            }
        }

        // Fetch page Title
        let title_selector =
            Selector::parse("title").map_err(|e| format!("Selector error: {}", e))?;
        for element in document.select(&title_selector) {
            let title = element.text().collect::<Vec<_>>().join(" ");
            page_title.push(title)
        }

        // Check meta tags for robots directives
        let meta_selector = Selector::parse("meta[name=robots]").unwrap();
        let mut noindex = false;
        let mut nofollow = false;

        for meta in document.select(&meta_selector) {
            if let Some(content) = meta.value().attr("content") {
                if content.contains("noindex") {
                    noindex = true;
                }
                if content.contains("nofollow") {
                    nofollow = true;
                }
            }

            if noindex {
                indexation.push("NoIndex".to_string());
            } else {
                indexation.push("Indexed".to_string());
            }

            if nofollow {
                indexation.push("NoFollow".to_string());
            }
        }
    } else {
        return Err(format!("Failed to fetch the URL: {}", response.status()));
    }

    println!("Links: {:?}", links);
    println!("Headings: {:?}", headings);
    println!("Alt texts: {:?}", alt_texts);
    println!("Page title: {:?}", page_title);
    println!("Indexation: {:?}", indexation);

    // Measure elapsed time
    let start_time = Instant::now();

    // Simulate some computational work (replace with actual logic)
    for _ in 0..1_000_000 {
        // Simulating some computational work
    }

    let end_time = Instant::now();
    let elapsed_time = end_time.duration_since(start_time).as_millis();

    Ok(CrawlResult {
        links,
        headings,
        alt_texts,
        elapsed_time,
        indexation,
    })
}
