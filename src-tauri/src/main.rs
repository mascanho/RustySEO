#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crawler::{CrawlResult, LinkResult, PageSpeedResponse};
use tokio; // Ensure tokio is imported

mod crawler;
mod gsc;
mod redirects;
mod schema;

#[tauri::command]
async fn crawl(url: String) -> Result<CrawlResult, String> {
    let result = crawler::crawl(url).await;

    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err),
    }
}

#[tauri::command]
async fn fetch_page_speed(url: &str) -> Result<PageSpeedResponse, String> {
    let result = crawler::get_page_speed_insights(url.to_string()).await;

    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err),
    }
}

#[tauri::command]
async fn fetch_google_search_console() -> Result<(), String> {
    let result = gsc::check_google_search_console().await;

    Ok(result)
}

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .manage(LinkResult { links: vec![] })
        .invoke_handler(tauri::generate_handler![
            crawl,
            fetch_page_speed,
            fetch_google_search_console
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
