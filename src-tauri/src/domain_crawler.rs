use reqwest::Client;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, error::Error};
use url::{ParseError, Url};

#[derive(Serialize, Deserialize, Debug)]
pub struct GlobalCrawlResults {
    visited_urls: HashSet<String>,
    all_files: HashSet<String>,
}

pub async fn crawl_domain(base_url: &str) -> Result<GlobalCrawlResults, Box<dyn Error>> {
    let client = Client::new();
    let mut urls_to_visit = vec![base_url.to_string()];
    let mut visited_urls = HashSet::new();
    let mut all_files = HashSet::new();

    while let Some(url) = urls_to_visit.pop() {
        if visited_urls.contains(&url) {
            continue;
        }

        println!("Crawling: {}", url);
        let response = client.get(&url).send().await?;
        let body = response.text().await?;

        // Parse the HTML
        let document = Html::parse_document(&body);

        // Select all 'a' tags and other elements that might contain links
        let link_selector = Selector::parse("a[href], link[href], script[src], img[src]").unwrap();

        for element in document.select(&link_selector) {
            let href = element
                .value()
                .attr("href")
                .or_else(|| element.value().attr("src"));
            if let Some(href) = href {
                if let Ok(absolute_url) = Url::parse(&url).and_then(|base| base.join(href)) {
                    let absolute_url_str = absolute_url.as_str().to_string();
                    if absolute_url_str.starts_with(base_url) {
                        if absolute_url_str
                            .split('/')
                            .last()
                            .unwrap_or("")
                            .contains('.')
                        {
                            all_files.insert(absolute_url_str.clone());
                        } else if !visited_urls.contains(&absolute_url_str) {
                            urls_to_visit.push(absolute_url_str);
                        }
                    }
                }
            }
        }

        // Check for directory listings
        let directory_selector = Selector::parse("pre").unwrap();
        if let Some(directory_listing) = document.select(&directory_selector).next() {
            for line in directory_listing.text().collect::<Vec<_>>() {
                if let Some(file_or_dir) = line.split_whitespace().last() {
                    if let Ok(absolute_url) =
                        Url::parse(&url).and_then(|base| base.join(file_or_dir))
                    {
                        let absolute_url_str = absolute_url.as_str().to_string();
                        if absolute_url_str.starts_with(base_url) {
                            if file_or_dir.contains('.') {
                                all_files.insert(absolute_url_str.clone());
                            } else if !visited_urls.contains(&absolute_url_str) {
                                urls_to_visit.push(absolute_url_str);
                            }
                        }
                    }
                }
            }
        }

        visited_urls.insert(url);
    }

    println!("All files: {:?}", all_files.len());
    println!("Visited URLs: {:?}", visited_urls.len());

    Ok(GlobalCrawlResults {
        visited_urls,
        all_files,
    })
}
