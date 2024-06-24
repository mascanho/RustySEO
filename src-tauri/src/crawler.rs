use std::{fs::File, io::Write};

use reqwest::Client;
use scraper::{Html, Selector};
use serde::Serialize;
use tokio;

#[derive(Serialize)]
pub struct CrawlResult {
    links: Vec<String>,
}

#[derive(Serialize)]
pub struct Sitemap {
    links: Vec<String>,
    schema: String,
}

pub async fn crawl(url: String) -> Result<CrawlResult, String> {
    let client = Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Request error: {}", e))?;

    let mut links = Vec::new();
    if response.status().is_success() {
        let body = response
            .text()
            .await
            .map_err(|e| format!("Response error: {}", e))?;
        let document = Html::parse_document(&body);
        let selector = Selector::parse("a").map_err(|e| format!("Selector error: {}", e))?;

        for element in document.select(&selector) {
            if let Some(link) = element.value().attr("href") {
                links.push(link.to_string());
            }
        }
    } else {
        return Err(format!("Failed to fetch the URL: {}", response.status()));
    }

    Ok(CrawlResult { links })
}

pub async fn generate_sitemap(url: String) -> Result<CrawlResult, String> {
    // Await the result of the crawl function
    let crawl_result = crawl(url).await?;
    // You can add more processing here if needed
    Ok(crawl_result)
}

// Helper function to generate sitemap XML from links
fn generate_sitemap_xml(links: &[String]) -> String {
    let mut sitemap_xml = String::new();
    sitemap_xml.push_str("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    sitemap_xml.push_str("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

    for link in links {
        sitemap_xml.push_str(&format!("  <url>\n    <loc>{}</loc>\n  </url>\n", link));
    }

    sitemap_xml.push_str("</urlset>\n");
    sitemap_xml
}

// Helper function to save sitemap XML to a file
fn save_sitemap_to_file(sitemap_xml: &str) -> Result<(), String> {
    let mut file =
        File::create("sitemap.xml").map_err(|e| format!("Failed to create sitemap file: {}", e))?;

    file.write_all(sitemap_xml.as_bytes())
        .map_err(|e| format!("Failed to write sitemap content: {}", e))?;

    Ok(())
}
