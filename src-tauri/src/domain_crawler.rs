use futures::stream::{self, StreamExt};
use reqwest::Client;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet, VecDeque};
use std::error::Error;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::time::sleep;
use url::Url;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PageDetails {
    title: String,
    h1: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GlobalCrawlResults {
    visited_urls: HashMap<String, PageDetails>,
    all_files: HashMap<String, FileDetails>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileDetails {
    url: String,
    file_type: String,
}

#[derive(Debug, Clone)]
struct CrawlState {
    urls_to_visit: VecDeque<String>,
    visited_urls: HashMap<String, PageDetails>,
    all_files: HashMap<String, FileDetails>,
    seen_urls: HashSet<String>,
}

pub async fn crawl_domain(
    base_url: &str,
    concurrency: usize,
) -> Result<GlobalCrawlResults, Box<dyn Error + Send + Sync>> {
    let client = Client::new();
    let state = Arc::new(Mutex::new(CrawlState {
        urls_to_visit: VecDeque::from(vec![base_url.to_string()]),
        visited_urls: HashMap::new(),
        all_files: HashMap::new(),
        seen_urls: HashSet::new(),
    }));

    let mut tasks = Vec::new();

    loop {
        let url = {
            let mut state = state.lock().unwrap();
            state.urls_to_visit.pop_front()
        };

        match url {
            Some(url) => {
                if state.lock().unwrap().visited_urls.len() >= concurrency {
                    sleep(Duration::from_millis(100)).await;
                    continue;
                }

                if !state.lock().unwrap().visited_urls.contains_key(&url) {
                    println!("Crawling: {}", url);

                    let state_clone = Arc::clone(&state);
                    tasks.push(tokio::spawn(crawl_page(
                        client.clone(),
                        url,
                        base_url.to_string(),
                        state_clone,
                    )));
                }
            }
            None => {
                if tasks.is_empty() {
                    break;
                }
                sleep(Duration::from_millis(100)).await;
            }
        }

        // Process completed tasks
        let mut completed_tasks = Vec::new();
        for (i, task) in tasks.iter_mut().enumerate() {
            if task.is_finished() {
                completed_tasks.push(i);
            }
        }
        for i in completed_tasks.into_iter().rev() {
            let _ = tasks.swap_remove(i).await;
        }
    }

    let final_state = state.lock().unwrap();
    println!("Total files found: {:?}", final_state.all_files.len());
    println!("Total URLs visited: {:?}", final_state.visited_urls.len());

    Ok(GlobalCrawlResults {
        visited_urls: final_state.visited_urls.clone(),
        all_files: final_state.all_files.clone(),
    })
}

async fn crawl_page(
    client: Client,
    url: String,
    base_url: String,
    state: Arc<Mutex<CrawlState>>,
) -> Result<(), Box<dyn Error + Send + Sync>> {
    sleep(Duration::from_millis(100)).await;

    match fetch_page(&client, &url).await {
        Ok(body) => {
            let document = Html::parse_document(&body);
            let page_details = extract_page_details(&document);

            let mut state = state.lock().unwrap();
            state.visited_urls.insert(url.clone(), page_details);

            extract_links(&document, &url, &base_url, &mut state);
            check_directory_listings(&document, &url, &base_url, &mut state);
        }
        Err(e) => {
            eprintln!("Error fetching {}: {:?}", url, e);
        }
    }

    Ok(())
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
                    let file_name = absolute_url_str.split('/').last().unwrap_or("");
                    if file_name.contains('.') {
                        let file_type = file_name.split('.').last().unwrap_or("").to_string();
                        state.all_files.insert(
                            absolute_url_str.clone(),
                            FileDetails {
                                url: absolute_url_str.clone(),
                                file_type,
                            },
                        );
                    }
                    if !state.seen_urls.contains(&absolute_url_str) {
                        state.urls_to_visit.push_back(absolute_url_str.clone());
                        state.seen_urls.insert(absolute_url_str);
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
    let directory_selector = Selector::parse("pre, table").unwrap();

    for directory_listing in document.select(&directory_selector) {
        for line in directory_listing.text().collect::<Vec<_>>() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if let Some(file_or_dir) = parts.last() {
                if *file_or_dir != "./" && *file_or_dir != "../" {
                    if let Ok(absolute_url) =
                        Url::parse(current_url).and_then(|base| base.join(file_or_dir))
                    {
                        let absolute_url_str = absolute_url.as_str().to_string();
                        if absolute_url_str.starts_with(base_url) {
                            if file_or_dir.contains('.') {
                                let file_type =
                                    file_or_dir.split('.').last().unwrap_or("").to_string();
                                state.all_files.insert(
                                    absolute_url_str.clone(),
                                    FileDetails {
                                        url: absolute_url_str.clone(),
                                        file_type,
                                    },
                                );
                            }
                            if !state.seen_urls.contains(&absolute_url_str) {
                                state.urls_to_visit.push_back(absolute_url_str.clone());
                                state.seen_urls.insert(absolute_url_str);
                            }
                        }
                    }
                }
            }
        }
    }
}
