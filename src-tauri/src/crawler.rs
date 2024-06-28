use std::{i32, time::Instant};

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
    pub page_title: Vec<String>,
    pub page_description: Vec<String>,
    pub canonical_url: Vec<String>,
    pub hreflangs: Vec<String>,
    pub response_code: u16,
}

#[derive(Serialize)]
pub struct LinkResult {
    pub links: Vec<String>,
}

pub async fn crawl(mut url: String) -> Result<CrawlResult, String> {
    // remove the "/" at the end of the url
    if url.ends_with("/") {
        url.pop();
    }

    let client = Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Request error: {}", e))?;

    let status = response.status();

    let mut links = Vec::new();
    let mut headings = Vec::new();
    let mut alt_texts = Vec::new();
    let mut page_title: Vec<String> = Vec::new();
    let mut indexation: Vec<String> = Vec::new();
    let mut page_description: Vec<String> = Vec::new();
    let mut canonical_url: Vec<String> = Vec::new();
    let mut hreflangs: Vec<String> = Vec::new();
    let response_code: u16;

    if response.status().is_success() {
        let body = response
            .text()
            .await
            .map_err(|e| format!("Response error: {}", e))?;
        let document = Html::parse_document(&body);

        // Fetch response code
        //format the response code, remove the "OK"
        let status_string = status.to_string();
        let status_code = status_string.replace("OK", "");
        // remove the whitespace
        let status_code = status_code.trim();
        status_code.parse::<u16>().unwrap();

        response_code = status_code.parse::<u16>().unwrap();

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

        // Fetch Meta description
        let meta_selector = Selector::parse("meta[name=description]").unwrap();
        for meta in document.select(&meta_selector) {
            if let Some(description) = meta.value().attr("content") {
                page_description.push(description.to_string());
            }
        }

        // Fetch canonical_url
        let canonical_selector = Selector::parse("link[rel=canonical]").unwrap();
        for canonical in document.select(&canonical_selector) {
            if let Some(canonical) = canonical.value().attr("href") {
                canonical_url.push(canonical.to_string());
            }
        }

        if canonical_url.is_empty() {
            canonical_url.push(String::from("No canonical URL found"));
        }

        // Fetch HrefLangs
        let hreflang_selector = Selector::parse("link[rel=alternate]").unwrap();
        for hreflang in document.select(&hreflang_selector) {
            if let Some(lang) = hreflang.value().attr("hreflang") {
                hreflangs.push(lang.to_string());
            }
        }

        if hreflangs.is_empty() {
            hreflangs.push(String::from("No hreflang found"));
        }
    } else {
        return Err(format!("Failed to fetch the URL: {}", response.status()));
    }

    println!("Links: {:?}", links);
    println!("Headings: {:?}", headings);
    println!("Alt texts: {:?}", alt_texts);
    println!("Page title: {:?}", page_title);
    println!("Indexation: {:?}", indexation);
    println!("Page description: {:?}", page_description);
    println!("Canonical URL: {:?}", canonical_url);
    println!("Hreflang: {:?}", hreflangs);

    println!("Response code: {:?}", response_code);

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
        page_title,
        page_description,
        canonical_url,
        hreflangs,
        response_code,
    })
}
