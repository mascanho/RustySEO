use reqwest::Client;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::{collections::HashSet, error::Error};
use url::Url;

#[derive(Serialize, Deserialize, Debug)]
pub struct PageDetails {
    title: String,
    h1: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GlobalCrawlResults {
    visited_urls: HashMap<String, PageDetails>,
    all_files: HashSet<String>,
}

pub async fn crawl_domain(base_url: &str) -> Result<GlobalCrawlResults, Box<dyn Error>> {
    let client = Client::new();
    let mut urls_to_visit = vec![base_url.to_string()];
    let mut visited_urls = HashMap::new(); // Updated type
    let mut all_files = HashSet::new();

    while let Some(url) = urls_to_visit.pop() {
        if visited_urls.contains_key(&url) {
            continue;
        }

        println!("Crawling: {}", url);

        match fetch_page(&client, &url).await {
            Ok(body) => {
                let document = Html::parse_document(&body);

                // Extract page title
                let title_selector = Selector::parse("title").unwrap();
                let title = document
                    .select(&title_selector)
                    .next()
                    .map(|e| e.inner_html())
                    .unwrap_or_else(|| "Untitled".to_string());

                // Extract h1 content
                let h1_selector = Selector::parse("h1").unwrap();
                let h1_content: Vec<String> = document
                    .select(&h1_selector)
                    .map(|e| e.inner_html())
                    .collect();
                let h1 = h1_content.join(", ");

                // Store URL with details
                visited_urls.insert(url.clone(), PageDetails { title, h1 });

                extract_links(
                    &document,
                    &url,
                    base_url,
                    &mut urls_to_visit,
                    &mut all_files,
                    &visited_urls,
                );
                check_directory_listings(
                    &document,
                    &url,
                    base_url,
                    &mut urls_to_visit,
                    &mut all_files,
                    &visited_urls,
                );
            }
            Err(e) => eprintln!("Error fetching {}: {:?}", url, e),
        }
    }

    println!("Total files found: {:?}", all_files.len());
    println!("Total URLs visited: {:?}", visited_urls.len());

    Ok(GlobalCrawlResults {
        visited_urls,
        all_files,
    })
}

async fn fetch_page(client: &Client, url: &str) -> Result<String, reqwest::Error> {
    let response = client.get(url).send().await?;
    response.text().await
}

fn extract_links(
    document: &Html,
    current_url: &str,
    base_url: &str,
    urls_to_visit: &mut Vec<String>,
    all_files: &mut HashSet<String>,
    visited_urls: &HashMap<String, PageDetails>, // Updated type
) {
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
                    if absolute_url_str
                        .split('/')
                        .last()
                        .unwrap_or("")
                        .contains('.')
                    {
                        all_files.insert(absolute_url_str.clone());
                    } else if !visited_urls.contains_key(&absolute_url_str) {
                        urls_to_visit.push(absolute_url_str);
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
    urls_to_visit: &mut Vec<String>,
    all_files: &mut HashSet<String>,
    visited_urls: &HashMap<String, PageDetails>, // Updated type
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
                            all_files.insert(absolute_url_str.clone());
                        } else if !visited_urls.contains_key(&absolute_url_str) {
                            urls_to_visit.push(absolute_url_str);
                        }
                    }
                }
            }
        }
    }
}
