// main.rs

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crawler::{CrawlResult, LinkResult, PageSpeedResponse};
use tokio; // Ensure tokio is imported

mod crawler;
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

    println!("This is the Page Speed function{:#?}", result);

    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err),
    }
}

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .manage(LinkResult { links: vec![] })
        .invoke_handler(tauri::generate_handler![crawl, fetch_page_speed])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
