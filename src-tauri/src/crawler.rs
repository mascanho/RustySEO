use db::CrawledData;
use html5ever::driver::parse_document;
use html5ever::serialize::{serialize, SerializeOpts, TraversalScope};
use html5ever::tendril::{ByteTendril, TendrilSink};
use markup5ever_rcdom::{Handle, RcDom, SerializableHandle};
use regex::Regex;
use reqwest::header::{HeaderMap, HeaderValue, USER_AGENT};
use reqwest::Client;
use rusqlite::Connection;
use scraper::{ElementRef, Html, Selector};
use serde::de::Error;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::error::Error as StdError;
use std::io;
use std::time::Instant;
use std::{
    collections::HashMap,
    env,
    fs::{self, File},
    io::{Read, Write},
    usize,
};
use url::Url;

use crate::crawler;

mod content;
pub mod db;
mod libs;

#[derive(Serialize)]
struct Element {
    tag_name: String,
    attributes: Vec<(String, String)>,
    children: Vec<Element>,
    text: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct OgDetails {
    title: Option<String>,
    og_type: Option<String>, // `type` is a reserved keyword in Rust, so we use `og_type`
    url: Option<String>,
    image: Option<String>,
    site_name: Option<String>,
    description: Option<String>,
    author: Option<String>,
    locale: Option<String>,
    publisher: Option<String>,
    modified_time: Option<String>,
    published_time: Option<String>,
    alternate_links: Option<Vec<String>>,
    // Add other fields based on the JSON response structure
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CrawlResult {
    pub links: Vec<(String, String)>,
    pub headings: Vec<String>,
    pub indexation: Vec<String>,
    pub page_title: Vec<String>,
    pub page_description: Vec<String>,
    pub canonical_url: Vec<String>,
    pub hreflangs: Vec<Hreflang>,
    pub index_type: Vec<String>,
    pub page_schema: Vec<String>,
    pub words_arr: Vec<(usize, Vec<String>, usize)>,
    // pub reading_time: usize,
    pub page_speed_results: Vec<Result<Value, String>>,
    pub og_details: HashMap<String, Option<String>>,
    pub favicon_url: Vec<String>,
    pub keywords: Vec<Vec<(String, usize)>>,
    pub readings: Vec<(f64, String)>,
    pub google_tag_manager: Vec<String>,
    pub tag_container: Vec<String>,
    pub images: Vec<ImageInfo>,
    //pub head_elements: Vec<String>,
    //pub body_elements: Vec<String>,
    pub robots: Result<String, libs::MyError>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Hreflang {
    pub lang: String,
    pub href: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LinkResult {
    pub links: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageInfo {
    alt_text: String,
    link: String,
    size_mb: f64,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PageSpeedResponse {
    id: String,
    captcha_result: Option<String>,
    lighthouseResult: Option<LighthouseResult>,
    audits: Option<serde_json::Value>,
    // Add other fields based on the JSON response structure
}

#[derive(Debug, Deserialize, Serialize)]
pub struct LighthouseResult {
    pub categories: Categories,
    lighthouseVersion: String,
    diagnostics: Option<serde_json::Value>,
    audits: Option<serde_json::Value>,
    // Add other fields based on the JSON response structure
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Categories {
    pub performance: Performance,
    // Add other fields based on the JSON response structure
}

#[derive(Debug, Deserialize, Serialize)]
pub struct audits {
    score: Option<f64>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Performance {
    score: Option<f64>,
}

pub async fn crawl(mut url: String) -> Result<CrawlResult, String> {
    // remove the "/" at the end of the url
    if url.ends_with("/") {
        url.pop();
    }

    // HANDLE DB CREATION AAND check
    let _create_table = db::create_table();

    let client = Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Request error: {}", e))?;

    let page_speed_results = Vec::new();
    let mut links = Vec::new();
    let mut headings = Vec::new();
    let mut page_title: Vec<String> = Vec::new();
    let mut indexation = Vec::new();
    let mut page_description: Vec<String> = Vec::new();
    let mut canonical_url: Vec<String> = Vec::new();
    let mut hreflangs: Vec<Hreflang> = Vec::new();
    let mut index_type = Vec::new();
    let mut page_schema: Vec<String> = Vec::new();
    let mut words_arr: Vec<(usize, Vec<String>, usize)> = Vec::new();
    let mut og_details: HashMap<String, Option<String>> = [
        ("title".to_string(), None),
        ("description".to_string(), None),
        ("url".to_string(), None),
        ("image".to_string(), None),
        ("type".to_string(), None),
        ("site_name".to_string(), None),
        ("description".to_string(), None),
    ]
    .iter()
    .cloned()
    .collect();
    let mut favicon_url = Vec::new();
    let mut keywords = Vec::new();
    let mut readings = Vec::new();
    let mut google_tag_manager: Vec<String> = Vec::new();
    let mut tag_container = Vec::new();
    //let mut head_elements = Vec::new();
    //let mut body_elements = Vec::new();

    if response.status().is_success() {
        let body = response
            .text()
            .await
            .map_err(|e| format!("Response error: {}", e))?;
        let document = Html::parse_document(&body);

        // Fetch Links and each respective anchor text

        // Function to clean and sanitize text
        fn clean_text(text: &str) -> String {
            // Remove extra whitespace
            let cleaned = text.split_whitespace().collect::<Vec<_>>().join(" ");

            // Remove any HTML tags that might have slipped through
            let re = Regex::new(r"<[^>]*>").unwrap();
            let cleaned = re.replace_all(&cleaned, "");

            // Trim and limit the length
            cleaned.trim().chars().take(100).collect()
        }

        let link_selector = Selector::parse("a").map_err(|e| format!("Selector error: {}", e))?;
        for link in document.select(&link_selector) {
            if let Some(href) = link.value().attr("href") {
                let mut text = link.text().collect::<Vec<_>>().join(" ");

                // If text is empty, try to get the alt text from an img child
                if text.is_empty() {
                    if let Some(img) = link.select(&Selector::parse("img").unwrap()).next() {
                        if let Some(alt) = img.value().attr("alt") {
                            text = alt.to_string();
                        }
                    }
                }

                // Clean and sanitize the text
                let cleaned_text = clean_text(&text);

                // Only add non-empty texts
                if !cleaned_text.is_empty() {
                    links.push((href.to_string(), cleaned_text));
                }
            }
        }

        // Get all the elements that exist inside <head>
        //let head_selector = Selector::parse("head").unwrap();

        //if let Some(head) = document.select(&head_selector).next() {
        // println!("Found head element: {:?}", head.html());
        //head_elements.push(head.html());

        // Serialize the head element and output in JSON format
        //let head_contents = serialize_element(&head);
        //let json_head_contents = serde_json::to_string_pretty(&head_contents).unwrap();
        // println!("Head contents: {}", json_head_contents);
        //}

        // Get all the elements that exist inside <body>
        //let body_selector = Selector::parse("body").unwrap();

        //if let Some(body) = document.select(&body_selector).next() {
        // println!("Found head element: {:?}", body.html());
        //body_elements.push(body.html());

        // Serialize the head element and output in JSON format
        //let body_contents = serialize_element(&body);
        //let json_head_contents = serde_json::to_string_pretty(&body_contents).unwrap();
        // println!("Head contents: {}", json_head_contents);
        //}

        // check for Google Tag Manager and Its content
        let gtm_selector = Selector::parse("script").unwrap();
        // Iterate over script tags and check for GTM
        for script in document.select(&gtm_selector) {
            if let Some(script_text) = script.text().next() {
                if script_text.contains("googletagmanager.com") {
                    //println!("Found Google Tag Manager script:\n{}", script_text);
                    google_tag_manager.push(script_text.to_string());
                }
            }
        }
        // Print all found GTM scripts
        if !google_tag_manager.is_empty() {
            for (index, script) in google_tag_manager.iter().enumerate() {
                // grab the GTM container part of the script
                let gtm_container = script
                    .split("googletagmanager.com")
                    .collect::<Vec<&str>>()
                    .join("googletagmanager.com")
                    .to_string();

                let re = Regex::new(r"GTM-[A-Z0-9]+").unwrap();
                let gtm_id = re
                    .captures_iter(&gtm_container)
                    .next()
                    .unwrap()
                    .get(0)
                    .unwrap()
                    .as_str()
                    .to_string();

                tag_container.push(gtm_id);
            }
        } else {
            println!("No Google Tag Manager scripts found.");
        }

        // Get the text content from the URL
        let text_content = content::extract_text(&document);

        // Calculate the reading level
        // // Function to convert Html to string (Placeholder, adjust based on actual Html type)
        fn html_to_string(html: &str) -> String {
            html.to_string()
        }
        let reading_level = content::calculate_reading_level(&html_to_string(&text_content));
        //println!("Reading Level: {:?}", reading_level);
        readings.push(reading_level);

        // Get the top keywords from the content
        let top_keywords = content::get_top_keywords(&text_content, 10);
        //println!("Top Keywords: {:?}", top_keywords);
        keywords.push(top_keywords);

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
            db::add_page_title_to_db(&title, &url);
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
            if let (Some(lang), Some(href)) = (
                hreflang.value().attr("hreflang"),
                hreflang.value().attr("href"),
            ) {
                hreflangs.push(Hreflang {
                    lang: lang.to_string(),
                    href: href.to_string(),
                });
            }
        }

        if hreflangs.is_empty() {
            hreflangs.push(Hreflang {
                lang: String::from("No hreflangs found"),
                href: String::from("No hreflangs found"),
            });
        }

        // Fetch Indexation
        let indexation_type = libs::get_indexation_status(&document);
        println!("Indexation: {:?}", indexation_type);

        indexation.push(indexation_type);

        // Fetch the favicon
        let favicon_selector = Selector::parse("link[rel=icon]").unwrap();
        for favicon in document.select(&favicon_selector) {
            if let Some(favicon) = favicon.value().attr("href") {
                favicon_url.push(favicon.to_string());
            }
        }

        // Fetch The page Schema
        let schema_selector = Selector::parse("script[type='application/ld+json']").unwrap();

        for element in document.select(&schema_selector) {
            if let Some(schema) = element.text().next() {
                page_schema.push(schema.trim().to_string());
            }
        }

        // Fetch the opengraph details
        let og_selector = Selector::parse("meta[property^='og:']").unwrap();

        for og in document.select(&og_selector) {
            if let (Some(property), Some(content)) =
                (og.value().attr("property"), og.value().attr("content"))
            {
                let key = property.trim_start_matches("og:").to_string();
                if og_details.contains_key(&key) {
                    og_details.insert(key, Some(content.to_string()));
                }
            }
        }

        // Output the details
        for (key, value) in &og_details {
            // println!("{}: {:?}", key, value);
        }
        // Fetch the word count
        let (word_count, words) = content::count_words_accurately(&document);
        //println!(
        //    "This is the word count: {:#?} and the words are {:#?}",
        //    word_count, words
        //);

        let reading_time = content::calculate_reading_time(word_count, 250);
        words_arr.push((word_count, words, reading_time));
        //println!("From the array: {:#?}", words_arr);
    } else {
        return Err(format!("Failed to fetch the URL: {}", response.status()));
    }

    // Fine tuning the word count given the GPT variance
    // let words_adjusted = (words_amount as f64 * 2.9).round() as usize;

    // println!("Links: {:?}", links);
    // println!("Headings: {:?}", headings);
    // println!("Alt texts: {:?}", alt_texts);
    // println!("Page title: {:?}", page_title);
    // println!("Page description: {:?}", page_description);
    // println!("Canonical URL: {:?}", canonical_url);
    // println!("Hreflang: {:?}", hreflangs);
    // println!("Response code: {:?}", response_code);
    // println!("Index Type: {:?}", index_type);
    // println!("Image Links: {:?}", image_links);
    // println!("Alt text count: {:?}", alt_text_count.len());
    // println!("Page Schema: {:?}", page_schema);
    // println!("Word Count: {:?}", words);
    // println!("Reading Time: {:?}", reading_time);
    // println!("Words Adjusted: {:?}", words_adjusted);
    // println!("Open Graph Details: {:?}", og_details);

    // SITEMAP FETCHING
    let sitemap_from_url = libs::get_sitemap(&url);
    //println!("Sitemap: {:?}", sitemap_from_url.await);

    // Robots FETCHING
    let robots = libs::get_robots(&url).await;
    //println!("Robots: {:#?}", robots);

    // println!("Hreflangs: {:?}", hreflangs);

    //println!("Google Tag Manager: {:?}", tag_container);

    let images = fetch_image_info(&url).await.unwrap();
    // println!("Images: {:?}", images);
    //

    let _add_crawled_data = db::add_crawled_data(&url, &page_title);
    let db_data = db::read_data_from_db();

    Ok(CrawlResult {
        links,
        headings,
        indexation,
        page_title,
        page_description,
        canonical_url,
        hreflangs,
        index_type,
        page_schema,
        words_arr,
        page_speed_results,
        og_details,
        favicon_url,
        keywords,
        readings,
        google_tag_manager,
        tag_container,
        images,
        //head_elements,
        //body_elements,
        robots,
    })
}

pub async fn get_page_speed_insights(
    url: String,
    strategy: String,
) -> Result<PageSpeedResponse, String> {
    dotenv::dotenv().ok();

    let api_key = "AIzaSyCCZu9Qxvkv8H0sCR9YPP7aP6CCQTZHFt8";
    let page_speed_url = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

    let client = Client::new();
    let request_url = format!(
        "{}?url={}&strategy={}&key={}",
        page_speed_url, url, strategy, api_key
    );

    match client.get(&request_url).send().await {
        Ok(response) => {
            let response_text = response
                .text()
                .await
                .map_err(|e| format!("Failed to read response text: {}", e))?;

            // Save the raw JSON response into a file
            // let mut file = File::create("page_speed_results.json")
            //     .map_err(|e| format!("Failed to create file: {}", e))?;
            // file.write_all(&response_text.as_bytes())
            //     .map_err(|e| format!("Failed to write to file: {}", e))?;

            // println!("Raw JSON response: {}", response_text);
            println!("Page Speed Results: OK ");

            // PUSH DATA INTO DB
            db::add_data_from_pagespeed(&response_text, &strategy, &url);

            // Parse the response text into PageSpeedResponse struct
            match serde_json::from_str::<PageSpeedResponse>(&response_text) {
                Ok(page_speed_response) => Ok(page_speed_response),
                Err(e) => {
                    eprintln!("Failed to parse response: {}", e);
                    Err(format!("Failed to parse response: {}", e))
                }
            }
        }
        Err(e) => {
            eprintln!("Failed to make request: {}", e);
            Err(format!("Failed to make request: {}", e))
        }
    }
}

async fn fetch_image_info(url: &str) -> Result<Vec<ImageInfo>, Box<dyn StdError + Send + Sync>> {
    let mut headers = HeaderMap::new();
    headers.insert(USER_AGENT, HeaderValue::from_static("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"));

    let client = Client::builder().default_headers(headers).build()?;

    let body = client.get(url).send().await?.text().await?;

    let base_url = Url::parse(url)?;
    let mut image_data = Vec::new();

    for cap in regex::Regex::new(r#"<img[^>]*>"#)?.captures_iter(&body) {
        let img_tag = cap.get(0).unwrap().as_str();
        let alt_text = extract_attribute(img_tag, "alt").unwrap_or_default();
        let src = extract_attribute(img_tag, "src").unwrap_or_default();

        if let Ok(image_url) = base_url.join(&src) {
            // println!("Fetching image: {}", image_url);
            let start = Instant::now();

            match client.get(image_url.as_str()).send().await {
                Ok(response) => {
                    // println!("Response status: {}", response.status());
                    for (name, value) in response.headers() {
                        // println!("{}: {:?}", name, value);
                    }

                    let bytes = response.bytes().await?;
                    let duration = start.elapsed();
                    // make it just two decimal places
                    let size_mb = bytes.len() as f64 / 1024.0;
                    let rounded_size_mb = (size_mb * 100.0).round() / 100.0;

                    // println!("Image size: {:.2} KB", size_mb);
                    // println!("Fetch time: {:?}", duration);

                    image_data.push(ImageInfo {
                        alt_text,
                        link: image_url.to_string(),
                        size_mb: rounded_size_mb,
                    });
                }
                Err(e) => {
                    // println!("Failed to fetch image {}: {}", image_url, e);
                }
            }
        }
    }

    Ok(image_data)
}

fn extract_attribute(tag: &str, attr: &str) -> Option<String> {
    regex::Regex::new(&format!(r#"{}="([^"]*)"#, attr))
        .ok()?
        .captures(tag)?
        .get(1)
        .map(|m| m.as_str().to_string())
}

// Function to format HTML contents in a pretty way
fn serialize_element(element: &ElementRef) -> Element {
    let tag_name = element.value().name().to_string();
    let attributes = element
        .value()
        .attrs()
        .map(|(name, value)| (name.to_string(), value.to_string()))
        .collect();

    let children = element
        .children()
        .filter_map(|child| {
            if let Some(child_element) = ElementRef::wrap(child) {
                Some(serialize_element(&child_element))
            } else {
                None
            }
        })
        .collect();

    let text = element.text().next().map(|s| s.to_string());

    Element {
        tag_name,
        attributes,
        children,
        text,
    }
}
