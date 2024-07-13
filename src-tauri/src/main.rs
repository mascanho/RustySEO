#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crawler::{CrawlResult, LinkResult, PageSpeedResponse};
use directories::ProjectDirs;
use serde::Serialize;
use std::io::Write;
use tokio;
use toml;

mod crawler;
mod gsc;
mod redirects;
mod schema;

#[derive(Serialize)]
struct Config {
    api_key: String,
}

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
            check_system,
            crawl,
            fetch_page_speed,
            fetch_google_search_console,
            add_api_key
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    println!("Running from Tauri")
}

// Configurations & system checks
#[tauri::command]
async fn check_system(key: String) -> Result<(), String> {
    let project_dirs = ProjectDirs::from("", "", "rustyseo").unwrap();
    let data_dir = project_dirs.data_dir();
    let cache_dir = project_dirs.cache_dir();
    let config_dir = project_dirs.config_dir();
    let log_dir = project_dirs.data_local_dir();
    let temp_dir = project_dirs.data_local_dir();
    let log_file = log_dir.join("rustyseo.log");

    // Create directories if they don't exist
    if !data_dir.exists() {
        std::fs::create_dir_all(data_dir).unwrap();
    }
    if !cache_dir.exists() {
        std::fs::create_dir_all(cache_dir).unwrap();
    }
    if !config_dir.exists() {
        std::fs::create_dir_all(config_dir).unwrap();
    }
    if !log_dir.exists() {
        std::fs::create_dir_all(log_dir).unwrap();
    }
    if !temp_dir.exists() {
        std::fs::create_dir_all(temp_dir).unwrap();
    }

    println!("Data dir: {}", data_dir.display());
    println!("Cache dir: {}", cache_dir.display());
    println!("Config dir: {}", config_dir.display());
    println!("Log dir: {}", log_dir.display());
    println!("Temp dir: {}", temp_dir.display());
    println!("Log file: {}", log_file.display());

    Ok(())
}

#[tauri::command]
fn add_api_key(key: String) -> Result<String, String> {
    // Create config directory
    let project_dirs = ProjectDirs::from("", "", "rustyseo")
        .ok_or_else(|| "Failed to get project directories".to_string())?;
    let config_dir = project_dirs.config_dir();
    std::fs::create_dir_all(config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    // Create config file
    let config = Config {
        api_key: key.clone(),
    };
    let config_file = config_dir.join("page_speed_api_key.toml");
    let toml_string =
        toml::to_string(&config).map_err(|e| format!("Failed to serialize config: {}", e))?;

    std::fs::write(&config_file, toml_string)
        .map_err(|e| format!("Failed to write config file: {}", e))?;

    println!("Config file created at: {}", config_file.display());
    println!("API key: {}", key);
    Ok(key)
}
