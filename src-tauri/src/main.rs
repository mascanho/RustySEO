// main.rs

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;

use crawler::{CrawlResult, LinkResult};
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

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .manage(LinkResult { links: vec![] })
        .invoke_handler(tauri::generate_handler![crawl])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
