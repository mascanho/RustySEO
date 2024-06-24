// main.rs

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs::File, io::Write};

use reqwest::Client;
use scraper::{Html, Selector};
use serde::Serialize;
use tokio; // Ensure tokio is imported

mod sitemaps;

#[derive(Serialize)]
struct CrawlResult {
    links: Vec<String>,
}

#[tauri::command]
async fn crawl(url: String) -> Result<CrawlResult, String> {
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

// Generate sitemap
#[tauri::command]
async fn sitemap_crawl(url: String) -> Result<String, String> {
    // Step 1: Perform HTTP request to fetch the HTML content
    let client = Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Request error: {}", e))?;

    // Step 2: Check if request was successful
    if response.status().is_success() {
        // Step 3: Extract links from the HTML content
        let body = response
            .text()
            .await
            .map_err(|e| format!("Response error: {}", e))?;
        let document = Html::parse_document(&body);
        let selector = Selector::parse("a").map_err(|e| format!("Selector error: {}", e))?;

        let mut links = Vec::new();
        for element in document.select(&selector) {
            if let Some(link) = element.value().attr("href") {
                links.push(link.to_string());
            }
        }

        // Step 4: Generate sitemap XML
        let sitemap_xml = generate_sitemap_xml(&links);

        // Step 5: Save the sitemap to a file
        save_sitemap_to_file(&sitemap_xml)?;

        // prihnt the sitemap
        println!("{}", sitemap_xml);

        // print the links
        for link in &links {
            println!("{}", link);
        }

        // Step 6: Return the sitemap XML and the links
        Ok(("").to_string())
    } else {
        // Return error if fetching URL failed
        Err(format!("Failed to fetch the URL: {}", response.status()))
    }
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

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![crawl, sitemap_crawl])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
