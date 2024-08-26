use reqwest::Client;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::error::Error;
use url::Url;

#[derive(Serialize, Deserialize, Debug)]
pub struct PageDetails {
    title: String,
    h1: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GlobalCrawlResults {
    visited_urls: HashMap<String, PageDetails>,
    all_files: HashMap<String, FileDetails>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FileDetails {
    url: String,
    file_type: String,
}

#[derive(Debug)]
struct CrawlState {
    urls_to_visit: Vec<String>,
    visited_urls: HashMap<String, PageDetails>,
    all_files: HashMap<String, FileDetails>,
}

pub async fn crawl_domain(base_url: &str) -> Result<GlobalCrawlResults, Box<dyn Error>> {
    let client = Client::new();
    let mut state = CrawlState {
        urls_to_visit: vec![base_url.to_string()],
        visited_urls: HashMap::new(),
        all_files: HashMap::new(),
    };

    while let Some(url) = state.urls_to_visit.pop() {
        if state.visited_urls.contains_key(&url) {
            continue;
        }

        println!("Crawling: {}", url);

        match fetch_page(&client, &url).await {
            Ok(body) => {
                let document = Html::parse_document(&body);
                let page_details = extract_page_details(&document);
                state.visited_urls.insert(url.clone(), page_details);

                extract_links(&document, &url, base_url, &mut state);
                check_directory_listings(&document, &url, base_url, &mut state);
            }
            Err(e) => eprintln!("Error fetching {}: {:?}", url, e),
        }
    }

    println!("Total files found: {:?}", state.all_files.len());
    println!("Total URLs visited: {:?}", state.visited_urls.len());

    Ok(GlobalCrawlResults {
        visited_urls: state.visited_urls,
        all_files: state.all_files,
    })
}

async fn fetch_page(client: &Client, url: &str) -> Result<String, reqwest::Error> {
    let response = client.get(url).send().await?;
    response.text().await
}

fn extract_page_details(document: &Html) -> PageDetails {
    let title_selector = Selector::parse("title").unwrap();
    let title = document
        .select(&title_selector)
        .next()
        .map(|e| e.inner_html())
        .unwrap_or_else(|| "Untitled".to_string());

    let h1_selector = Selector::parse("h1").unwrap();
    let h1_content: Vec<String> = document
        .select(&h1_selector)
        .map(|e| e.inner_html())
        .collect();
    let h1 = h1_content.join(", ");

    PageDetails { title, h1 }
}

fn extract_links(document: &Html, current_url: &str, base_url: &str, state: &mut CrawlState) {
    let link_selector = Selector::parse("a[href], link[href], script[src], img[src]").unwrap();

    for element in document.select(&link_selector) {
        if let Some(href) = element
            .value()
            .attr("href")
            .or_else(|| element.value().attr("src"))
        {
            if let Ok(absolute_url) = Url::parse(current_url).and_then(|base| base.join(href)) {
                let absolute_url_str = absolute_url.as_str().to_string();
                if absolute_url_str.starts_with(base_url) {
                    if let Some(file_name) = absolute_url_str.split('/').last() {
                        if file_name.contains('.') {
                            let file_type = file_name.split('.').last().unwrap_or("").to_string();
                            state.all_files.insert(
                                absolute_url_str.clone(),
                                FileDetails {
                                    url: absolute_url_str,
                                    file_type,
                                },
                            );
                        } else if !state.visited_urls.contains_key(&absolute_url_str) {
                            state.urls_to_visit.push(absolute_url_str);
                        }
                    }
                }
            }
        }
    }
}

fn check_directory_listings(
    document: &Html,
    current_url: &str,
    base_url: &str,
    state: &mut CrawlState,
) {
    let directory_selector = Selector::parse("pre").unwrap();

    if let Some(directory_listing) = document.select(&directory_selector).next() {
        for line in directory_listing.text().collect::<Vec<_>>() {
            if let Some(file_or_dir) = line.split_whitespace().last() {
                if let Ok(absolute_url) =
                    Url::parse(current_url).and_then(|base| base.join(file_or_dir))
                {
                    let absolute_url_str = absolute_url.as_str().to_string();
                    if absolute_url_str.starts_with(base_url) {
                        if file_or_dir.contains('.') {
                            let file_type = file_or_dir.split('.').last().unwrap_or("").to_string();
                            state.all_files.insert(
                                absolute_url_str.clone(),
                                FileDetails {
                                    url: absolute_url_str,
                                    file_type,
                                },
                            );
                        } else if !state.visited_urls.contains_key(&absolute_url_str) {
                            state.urls_to_visit.push(absolute_url_str);
                        }
                    }
                }
            }
        }
    }
}
