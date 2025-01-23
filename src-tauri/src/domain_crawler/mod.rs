use reqwest::blocking::Client;
use scraper::{Html, Selector};
use std::collections::HashSet;
use url::{ParseError, Url};

pub fn domain_crawl() {
    let domain = "https://www.algarvewonders.com";

    if let Err(e) = crawl_website(domain) {
        eprintln!("Error: {}", e)
    }
}

pub fn crawl_website(domain: &str) -> Result<(), String> {
    let client = Client::new();
    let mut visited = HashSet::new();
    let base_url = Url::parse(domain).expect("Failed to parse URL");

    crawl_page(&client, &base_url, &mut visited, &base_url)?;

    Ok(())
}

pub fn crawl_page(
    client: &Client,
    url: &Url,
    visited: &mut HashSet<String>,
    base_url: &Url,
) -> Result<(), String> {
    if visited.contains(url.as_str()) {
        return Ok(());
    }

    Ok(())
}
