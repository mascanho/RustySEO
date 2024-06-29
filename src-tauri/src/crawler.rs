use std::{time::Instant, usize};

use reqwest::{blocking::get, Client};
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CrawlResult {
    pub links: Vec<(String, String)>,
    pub headings: Vec<String>,
    pub alt_texts: Vec<String>,
    pub elapsed_time: u128,
    pub indexation: Vec<String>,
    pub page_title: Vec<String>,
    pub page_description: Vec<String>,
    pub canonical_url: Vec<String>,
    pub hreflangs: Vec<String>,
    pub response_code: u16,
    pub index_type: Vec<String>,
    pub image_links: Vec<ImageInfo>,
    pub page_schema: Vec<String>,
    pub words: Vec<String>,
    pub reading_time: usize,
}

#[derive(Serialize)]
pub struct LinkResult {
    pub links: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImageInfo {
    link: String,
    alt_text: String,
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

    let response_headers = response
        .headers()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_str().unwrap().to_string()))
        .collect::<Vec<_>>();

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
    // Initialize flags
    let mut index_type = Vec::new();
    let mut image_links = Vec::new();
    let mut alt_text_count = Vec::new();
    let mut page_schema: Vec<String> = Vec::new();
    let mut words = Vec::new();

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

        // Fetch Links and each respective anchor text
        let link_selector = Selector::parse("a").map_err(|e| format!("Selector error: {}", e))?;
        for link in document.select(&link_selector) {
            if let Some(href) = link.value().attr("href") {
                let text = link.text().collect::<Vec<_>>().join(" ").trim().to_string();
                links.push((href.to_string(), text));
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

        // Fetch all the images in the url and their respective alt texts, display them
        for img in document.select(&img_selector) {
            if let Some(link) = img.value().attr("src") {
                let mut alt_text = img.value().attr("alt").unwrap_or("").to_string();

                if alt_text.is_empty() {
                    let no_alt_text;
                    no_alt_text = link.to_string();
                    alt_text_count.push(no_alt_text)
                }

                let image_info = ImageInfo {
                    link: link.to_string(),
                    alt_text,
                };

                image_links.push(image_info);
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

        // Fetch Indexation
        let noindex_selector = Selector::parse("meta[name=robots]").unwrap();
        for noindex in document.select(&noindex_selector) {
            if let Some(noindex) = noindex.value().attr("content") {
                if !noindex.contains("noindex") {
                    index_type.push(String::from("Indexed"));
                }
            } else {
                index_type.push(String::from("Not Available"));
            }
        }

        // Fetch The page Schema
        let schema_selector = Selector::parse("script[type='application/ld+json']").unwrap();

        for element in document.select(&schema_selector) {
            if let Some(schema) = element.text().next() {
                page_schema.push(schema.trim().to_string());
            }
        }

        // Fetch the word count
        let word_count_selector =
            Selector::parse("body, h1, h2, h3, h4, h5, h6, p, span, li, div, a").unwrap();
        let mut word_count = 0;

        for element in document.select(&word_count_selector) {
            let text = element.text().collect::<Vec<_>>().join(" ");
            word_count += text.split_whitespace().filter(|s| !s.is_empty()).count();

            words.push(text);
        }
    } else {
        return Err(format!("Failed to fetch the URL: {}", response.status()));
    }

    // calculate reading time
    let reading_time = calculate_reading_time(words.len(), 150);

    println!("Links: {:?}", links);
    println!("Headings: {:?}", headings);
    println!("Alt texts: {:?}", alt_texts);
    println!("Page title: {:?}", page_title);
    println!("Page description: {:?}", page_description);
    println!("Canonical URL: {:?}", canonical_url);
    println!("Hreflang: {:?}", hreflangs);
    println!("Response code: {:?}", response_code);
    println!("Index Type: {:?}", index_type);
    println!("Image Links: {:?}", image_links);
    println!("Alt text count: {:?}", alt_text_count.len());
    println!("Page Schema: {:?}", page_schema);
    println!("Word Count: {:?}", words);
    println!("Reading Time: {:?}", reading_time);

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
        index_type,
        image_links,
        page_schema,
        words,
        reading_time,
    })
}

pub fn calculate_reading_time(word_count: usize, words_per_minute: usize) -> usize {
    (word_count as f64 / words_per_minute as f64).ceil() as usize
}
