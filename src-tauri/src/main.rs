// main.rs

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crawler::CrawlResult;
use tokio; // Ensure tokio is imported

mod crawler;
mod sitemaps;

#[tauri::command]
async fn crawl(url: String) -> Result<CrawlResult, String> {
    let result = crawler::crawl(url).await;

    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err),
    }
}

// Generate sitemap
#[tauri::command]
async fn sitemap_crawl(url: String) -> Result<CrawlResult, String> {
    let result = crawler::generate_sitemap(url).await;

    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err),
    }
}

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![crawl, sitemap_crawl])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
