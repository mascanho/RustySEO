// Import necessary modules and dependencies
use directories::ProjectDirs;
use dotenv::dotenv;
use html5ever::driver::parse_document;
use html5ever::serialize::{serialize, SerializeOpts, TraversalScope};
use html5ever::tendril::{ByteTendril, TendrilSink};
use markup5ever_rcdom::{Handle, RcDom, SerializableHandle};
use regex::Regex;
use reqwest::header::{HeaderMap, HeaderValue, ACCEPT, USER_AGENT};
use reqwest::Client;
use rusqlite::Connection;
use scraper::selectable::Selectable;
use scraper::{ElementRef, Html, Selector};
use serde::de::Error;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::error::Error as StdError;
use std::time::Instant;
use std::{
    collections::HashMap,
    env,
    fs::{self, File},
    io::{Read, Write},
    usize,
};
use std::{io, vec};
use url::Url;

use crate::crawler;

pub mod content;
pub mod db;
pub mod libs;
mod page_rank;

/// Struct representing data to be stored in the database
#[derive(Debug, Serialize, Deserialize)]
pub struct DBData {
    title: String,
    description: String,
    keywords: Vec<String>,
    headings: Vec<String>,
}

/// Struct representing an HTML element
#[derive(Serialize)]
struct Element {
    tag_name: String,
    attributes: Vec<(String, String)>,
    children: Vec<Element>,
    text: Option<String>,
}

/// Struct representing Open Graph details
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

/// Struct representing the result of crawling a webpage
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
    pub body_elements: Vec<String>,
    pub robots: Result<String, libs::MyError>,
    pub ratio: Vec<(f64, f64, f64)>,
    pub page_rank: Vec<f32>,
    pub charset_arr: Vec<String>,
    pub video: Vec<String>,
    pub url_length: Vec<usize>,
}

/// Struct representing hreflang information
#[derive(Serialize, Deserialize, Debug)]
pub struct Hreflang {
    pub lang: String,
    pub href: String,
}

/// Struct representing the result of link extraction
#[derive(Serialize, Deserialize, Debug)]
pub struct LinkResult {
    pub links: Vec<String>,
}

/// Struct representing image information
#[derive(Debug, Serialize, Deserialize)]
pub struct ImageInfo {
    alt_text: String,
    link: String,
    size_mb: f64,
}

/// Struct representing the SEO page speed response
#[derive(Debug, Serialize, Deserialize)]
pub struct SeoPageSpeedResponse {
    id: String,
    lighthouseResult: Option<SEOLighthouseResponse>,
    audits: Option<serde_json::Value>,
    // Add other fields based on the JSON response structure
}

/// Struct representing the SEO Lighthouse response
#[derive(Debug, Deserialize, Serialize)]
pub struct SEOLighthouseResponse {
    audits: Option<serde_json::Value>,
    categories: Option<serde_json::Value>,
    // Add other fields based on the JSON response structure
}

/// Struct representing the page speed response
#[derive(Debug, Deserialize, Serialize)]
pub struct PageSpeedResponse {
    id: String,
    captcha_result: Option<String>,
    lighthouseResult: Option<LighthouseResult>,
    audits: Option<serde_json::Value>,
    // Add other fields based on the JSON response structure
}

/// Struct representing the Lighthouse result
#[derive(Debug, Deserialize, Serialize)]
pub struct LighthouseResult {
    pub categories: Categories,
    lighthouseVersion: String,
    diagnostics: Option<serde_json::Value>,
    audits: Option<serde_json::Value>,
    // Add other fields based on the JSON response structure
}

/// Struct representing categories in the Lighthouse result
#[derive(Debug, Deserialize, Serialize)]
pub struct Categories {
    pub performance: Performance,
    // Add other fields based on the JSON response structure
}

/// Struct representing audits
#[derive(Debug, Deserialize, Serialize)]
pub struct audits {
    category: Option<String>,
    score: Option<f64>,
}

/// Struct representing performance in the Lighthouse result
#[derive(Debug, Deserialize, Serialize)]
pub struct Performance {
    score: Option<f64>,
}

/// Function to crawl a webpage and extract various information
pub async fn crawl(url: String) -> Result<CrawlResult, String> {
    let _create_table = db::create_results_table();
    let _create_links_table = db::create_links_table();

    let url_clone = url.clone();
    let host_value = HeaderValue::from_str(
        &Url::parse(&url_clone)
            .map_err(|e| format!("Failed to parse URL: {}", e))?
            .host_str()
            .ok_or("Failed to extract host")?,
    )
    .map_err(|e| format!("Failed to create header value: {}", e))?;

    let mut headers = HeaderMap::new();
    headers.insert(
        "User-Agent",
        HeaderValue::from_static(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
        ),
    );
    headers.insert("Accept", HeaderValue::from_static("*/*"));
    // headers.insert("Host", host_value);

    println!("host Value is: {:#?}", host_value);

    let client = Client::builder()
        .default_headers(headers)
        .build()
        .map_err(|e| format!("Failed to create client: {}", e))?;

    dbg!(&client);

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Request error: {}", e))?;

    dbg!(&response);

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
    let mut ratio = Vec::new();
    let mut body_elements = Vec::new();
    let mut charset_arr = Vec::new();
    let mut video = Vec::new();
    let mut url_length = Vec::new();

    url_length.push(url.len());

    if response.status().is_success() {
        let body = response
            .text()
            .await
            .map_err(|e| format!("Response error: {}", e))?;
        let document = Html::parse_document(&body);

        /// Function to clean text by removing HTML tags and trimming whitespace
        fn clean_text(text: &str) -> String {
            let cleaned = text.split_whitespace().collect::<Vec<_>>().join(" ");
            let re = Regex::new(r"<[^>]*>").unwrap();
            let cleaned = re.replace_all(&cleaned, "");
            cleaned.trim().chars().take(100).collect()
        }

        let link_selector = Selector::parse("a").map_err(|e| format!("Selector error: {}", e))?;
        for link in document.select(&link_selector) {
            if let Some(href) = link.value().attr("href") {
                let mut text = link.text().collect::<Vec<_>>().join(" ");

                if text.is_empty() {
                    if let Some(img) = link.select(&Selector::parse("img").unwrap()).next() {
                        if let Some(alt) = img.value().attr("alt") {
                            text = alt.to_string();
                        }
                    }
                }

                let cleaned_text = clean_text(&text);

                if !cleaned_text.is_empty() {
                    links.push((href.to_string(), cleaned_text));
                }
            }
        }

        // db::refresh_links_table();

        let body_selector = Selector::parse("body").unwrap();

        if let Some(body) = document.select(&body_selector).next() {
            body_elements.push(body.html());
            let body_contents = serialize_element(&body);
        }

        let gtm_selector = Selector::parse("script").unwrap_or_else(|_| {
            println!("Failed to parse script selector, GTM detection may be incomplete");
            Selector::parse("invalid").unwrap()
        });

        for script in document.select(&gtm_selector) {
            if let Some(script_text) = script.text().next() {
                if script_text.contains("googletagmanager.com") {
                    google_tag_manager.push(script_text.to_string());
                }
            }
        }

        if !google_tag_manager.is_empty() {
            for script in google_tag_manager.iter() {
                let gtm_container = script
                    .split("googletagmanager.com")
                    .collect::<Vec<&str>>()
                    .join("googletagmanager.com")
                    .to_string();

                if let Ok(re) = Regex::new(r"GTM-[A-Z0-9]+") {
                    if let Some(captures) = re.captures(&gtm_container) {
                        if let Some(gtm_match) = captures.get(0) {
                            let gtm_id = gtm_match.as_str().to_string();
                            if !gtm_id.is_empty() {
                                tag_container.push(gtm_id);
                            } else {
                                println!("Found GTM script, but ID is empty");
                            }
                        } else {
                            println!("Found GTM script, but couldn't extract ID");
                        }
                    } else {
                        println!("Found GTM script, but no ID matches the expected format");
                    }
                } else {
                    println!("Failed to create regex for GTM ID extraction");
                }
            }
        } else {
            println!("No Google Tag Manager scripts found.");
        }

        let text_content = content::extract_text(&document);

        /// Function to convert HTML to string
        fn html_to_string(html: &str) -> String {
            html.to_string()
        }
        let reading_level = content::calculate_reading_level(&html_to_string(&text_content));
        readings.push(reading_level);

        let top_keywords = content::get_top_keywords(&text_content, 10);
        keywords.push(top_keywords);

        let charset_selector = Selector::parse("meta[charset]").unwrap();
        for meta in document.select(&charset_selector) {
            if let Some(charset) = meta.value().attr("charset") {
                charset_arr.push(charset.to_string());
            }
        }

        let video_selector = Selector::parse("video").unwrap();
        let iframe_selector = Selector::parse("iframe").unwrap();
        let embed_selector = Selector::parse("embed").unwrap();

        let has_video = document.select(&video_selector).next().is_some()
            || document.select(&iframe_selector).next().is_some()
            || document.select(&embed_selector).next().is_some();

        if has_video {
            video.push(String::from("Yes"));
        } else {
            video.push(String::from("No"));
        }

        let heading_selector = Selector::parse("h1, h2, h3, h4, h5, h6")
            .map_err(|e| format!("Selector error: {}", e))?;

        for element in document.select(&heading_selector) {
            let tag_name = element.value().name().to_lowercase();
            let level = tag_name.chars().nth(1).unwrap().to_digit(10).unwrap();
            let text = element
                .text()
                .map(|t| t.trim())
                .filter(|t| !t.is_empty())
                .collect::<Vec<_>>()
                .join(" ");

            if !text.is_empty() {
                let heading_with_type = format!("h{}: {}", level, text);
                headings.push(heading_with_type);
            }
        }

        headings.sort_by(|a, b| {
            let a_level = a.chars().nth(1).unwrap().to_digit(10).unwrap();
            let b_level = b.chars().nth(1).unwrap().to_digit(10).unwrap();
            a_level.cmp(&b_level)
        });

        let title_selector =
            Selector::parse("title").map_err(|e| format!("Selector error: {}", e))?;
        for element in document.select(&title_selector) {
            let title = element.text().collect::<Vec<_>>().join(" ");
            page_title.push(title)
        }

        let meta_selector = Selector::parse("meta[name=description]").unwrap();
        for meta in document.select(&meta_selector) {
            if let Some(description) = meta.value().attr("content") {
                page_description.push(description.to_string());
            }
        }

        let canonical_selector = Selector::parse("link[rel=canonical]").unwrap();
        for canonical in document.select(&canonical_selector) {
            if let Some(canonical) = canonical.value().attr("href") {
                canonical_url.push(canonical.to_string());
            }
        }

        if canonical_url.is_empty() {
            canonical_url.push(String::from("No canonical URL found"));
        }

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

        let indexation_type = libs::get_indexation_status(&document);
        println!("Indexation: {:?}", indexation_type);

        indexation.push(indexation_type);

        let favicon_selectors = [
            Selector::parse("link[rel='icon']").unwrap(),
            Selector::parse("link[rel='shortcut icon']").unwrap(),
            Selector::parse("link[rel='apple-touch-icon']").unwrap(),
        ];

        for selector in &favicon_selectors {
            for favicon in document.select(selector) {
                if let Some(favicon_href) = favicon.value().attr("href") {
                    let full_url = match Url::parse(&url).and_then(|base| base.join(favicon_href)) {
                        Ok(full_url) => full_url.to_string(),
                        Err(_) => favicon_href.to_string(),
                    };
                    favicon_url.push(full_url);
                }
            }
            if !favicon_url.is_empty() {
                break;
            }
        }

        if favicon_url.is_empty() {
            if let Ok(root_url) = Url::parse(&url) {
                let favicon_ico_url = root_url
                    .join("/favicon.ico")
                    .unwrap_or(root_url)
                    .to_string();
                favicon_url.push(favicon_ico_url);
            }
        }

        favicon_url.dedup();

        let schema_selector = Selector::parse("script[type='application/ld+json']").unwrap();

        for element in document.select(&schema_selector) {
            if let Some(schema) = element.text().next() {
                page_schema.push(schema.trim().to_string());
            }
        }

        let og_selector = Selector::parse("meta[property^='og:']").unwrap();

        for og in document.select(&og_selector) {
            if let (Some(property), Some(content)) =
                (og.value().attr("property"), og.value().attr("content"))
            {
                let key = property.strip_prefix("og:").unwrap_or(property).to_string();
                println!(
                    "Found OG tag - property: {}, content: {}",
                    property, content
                );

                if key == "logo" {
                    if !og_details.contains_key(&key) {
                        og_details.insert(key, Some(content.to_string()));
                        println!("Inserting image: {}", content);
                    } else {
                        println!("Image already set, skipping: {}", content);
                    }
                } else {
                    og_details.insert(key, Some(content.to_string()));
                }
            }
        }

        let (word_count, words) = content::count_words_accurately(&document);

        let reading_time = content::calculate_reading_time(word_count, 250);
        words_arr.push((word_count, words, reading_time));

        let html_to_text_ratio = content::html_to_text_ratio(&document);
        ratio.push(html_to_text_ratio);
    } else {
        return Err(format!("Failed to fetch the URL: {}", response.status()));
    }

    let sitemap_from_url = libs::get_sitemap(&url);

    let robots = libs::get_robots(&url).await;

    let images = fetch_image_info(&url).await.unwrap();

    let title = match page_title.len() {
        0 => String::from(""),
        _ => page_title[0].clone(),
    };

    let description = match page_description.len() {
        0 => String::from(""),
        _ => page_description[0].clone(),
    };

    let kws = keywords[0].clone();
    let words: Vec<String> = kws.iter().map(|(word, _)| word.clone()).collect();

    let mut db_data: DBData = DBData {
        title,
        description,
        keywords: words.clone(),
        headings: headings.clone(),
    };

    let mut page_rank = Vec::new();
    let page_score = page_rank::fetch_page_rank(&url).await;
    match page_score {
        Ok(page_score) => {
            page_rank.push(page_score);
        }
        Err(e) => {
            println!("Error: {:?}", e);
        }
    }

    println!("Page URL length: {:?}", url_length);
    db::refresh_links_table().expect("Failed to refresh links table");
    db::store_links_in_db(links.clone()).expect("Failed to store link in the DB");
    db::add_technical_data(db_data, &url).unwrap();

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
        body_elements,
        robots,
        ratio,
        page_rank,
        charset_arr,
        video,
        url_length,
    })
}

/// Function to fetch performance data from Google PageSpeed Insights
pub async fn get_page_speed_insights(
    url: String,
    strategy: Option<String>,
) -> Result<(PageSpeedResponse, SeoPageSpeedResponse), String> {
    dotenv().ok();

    // ----- This loads the API key prompted from the user, if not set, it will use the default one -----

    let api_key = match libs::load_api_keys().await {
        Ok(api_keys) => {
            if api_keys.page_speed_key.is_empty() {
                println!("No API key found, using default key");
                String::from("AIzaSyADhimFwkVUWEcFhHWclTGCU56USITLn9k")
            } else {
                api_keys.page_speed_key
            }
        }
        Err(_) => {
            println!("Failed to load API keys file, using default key");
            String::from("AIzaSyADhimFwkVUWEcFhHWclTGCU56USITLn9k")
        }
    };

    // let api_key = libs::load_api_keys()
    //     .await
    //     .map_err(|e| format!("Failed to load API keys: {}", e))?
    //     .page_speed_key;

    // ------- BAKEDINS API KEY -------
    // let api_key = "AIzaSyADhimFwkVUWEcFhHWclTGCU56USITLn9k";

    let page_speed_url = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
    let client = Client::new();

    // General page speed insights request URL
    let general_request_url = format!(
        "{}?url={}&key={}{}",
        page_speed_url,
        url,
        api_key,
        if let Some(strategy) = &strategy {
            format!("&strategy={}", strategy)
        } else {
            String::new()
        }
    );

    // SEO-specific insights request URL
    let seo_request_url = format!(
        "{}?url={}&category=seo&key={}",
        page_speed_url, url, api_key
    );

    // Send both requests concurrently
    let (general_response, seo_response) = tokio::try_join!(
        client.get(&general_request_url).send(),
        client.get(&seo_request_url).send()
    )
    .map_err(|e| format!("Failed to make one or both requests: {}", e))?;

    // Handle general response
    let general_response_text = general_response
        .text()
        .await
        .map_err(|e| format!("Failed to read general response text: {}", e))?;

    // Handle SEO response
    let seo_response_text = seo_response
        .text()
        .await
        .map_err(|e| format!("Failed to read SEO response text: {}", e))?;

    println!("General Page Speed Results: OK ");
    println!("SEO Page Speed Results: OK ");

    // Optionally, cache results here if applicable

    // Push data into DB (consider doing this asynchronously)
    // You may want to implement retry logic or batch this
    db::add_data_from_pagespeed(&general_response_text, &strategy.unwrap_or_default(), &url);
    //db::add_data_from_pagespeed(&seo_response_text, "seo", &url);

    // Parse responses into PageSpeedResponse structs
    let general_page_speed_response =
        serde_json::from_str::<PageSpeedResponse>(&general_response_text)
            .map_err(|e| format!("Failed to parse general response: {}", e))?;

    let seo_page_speed_response = serde_json::from_str::<SeoPageSpeedResponse>(&seo_response_text)
        .map_err(|e| format!("Failed to parse SEO response: {}", e))?;

    Ok((general_page_speed_response, seo_page_speed_response))
}

/// Function to fetch image information from a webpage
async fn fetch_image_info(url: &str) -> Result<Vec<ImageInfo>, Box<dyn StdError + Send + Sync>> {
    let mut headers = HeaderMap::new();
    headers.insert(
        USER_AGENT,
        HeaderValue::from_static(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
        ),
    );
    headers.insert(
        ACCEPT,
        HeaderValue::from_static(
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        ),
    );
    headers.insert(ACCEPT, HeaderValue::from_static("en-US,en;q=0.5"));

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

/// Function to extract attribute value from an HTML tag
fn extract_attribute(tag: &str, attr: &str) -> Option<String> {
    regex::Regex::new(&format!(r#"{}="([^"]*)"#, attr))
        .ok()?
        .captures(tag)?
        .get(1)
        .map(|m| m.as_str().to_string())
}

/// Function to format HTML contents in a pretty way
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
