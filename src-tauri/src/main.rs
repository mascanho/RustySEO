#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crawler::{CrawlResult, LinkResult, PageSpeedResponse};
use directories::ProjectDirs;
use genai::genai;
use serde::{Deserialize, Serialize};
use std::io::Write;
use tauri::api::path::config_dir;
use tokio;
use toml;

mod crawler;
mod genai;
mod gsc;
mod redirects;
mod schema;

#[derive(Serialize, Debug, Deserialize)]
struct Config {
    page_speed_key: String,
    openai_key: String,
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
async fn fetch_page_speed(url: &str, strategy: &str) -> Result<PageSpeedResponse, String> {
    let result = crawler::get_page_speed_insights(url.to_string(), strategy.to_string()).await;

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

#[tauri::command]
async fn get_genai(query: String) -> Result<String, String> {
    match genai(query).await {
        Ok(response) => Ok(response.content.unwrap_or_default()),
        Err(e) => Err(e.to_string()),
    }
}

//FETCH THE DATA FROM THE DB
#[tauri::command]
fn get_db_data() -> Result<Vec<crawler::db::CrawledData>, String> {
    let result = crawler::db::read_data_from_db();

    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    }
}

#[tokio::main]
async fn main() {
    // Tauri setup
    tauri::Builder::default()
        .manage(LinkResult { links: vec![] })
        .invoke_handler(tauri::generate_handler![
            check_system,
            crawl,
            fetch_page_speed,
            fetch_google_search_console,
            add_api_key,
            get_genai,
            get_db_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    println!("Running from Tauri");
    println!("Running from Main");
}

// Configurations & system checks
#[tauri::command]
async fn check_system() -> Result<String, String> {
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

    // Check the config file and see it it has any keys inside
    let config_file = config_dir.join("api_keys.toml");
    if !config_file.exists() {
        return Err("No API keys found".to_string());
    }

    Ok("System check completed".to_string())
}

#[tauri::command]
fn add_api_key(key: String, api_type: String) -> Result<String, String> {
    // Create config directory
    let project_dirs = ProjectDirs::from("", "", "rustyseo")
        .ok_or_else(|| "Failed to get project directories".to_string())?;
    let config_dir = project_dirs.config_dir();
    std::fs::create_dir_all(config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    if api_type == "page_speed" {
        // Create config file
        let config = Config {
            page_speed_key: key.clone(),
            openai_key: "".to_string(),
        };
        let config_file = config_dir.join("api_keys.toml");
        let toml_string =
            toml::to_string(&config).map_err(|e| format!("Failed to serialize config: {}", e))?;

        std::fs::write(&config_file, toml_string)
            .map_err(|e| format!("Failed to write config file: {}", e))?;
        println!("Config file created at: {}", config_file.display());
        return Ok(key);
    }

    if api_type == "openai" {
        // Create config file
        let config = Config {
            page_speed_key: "".to_string(),
            openai_key: key.clone(),
        };
        let config_file = config_dir.join("api_keys.toml");
        let toml_string =
            toml::to_string(&config).map_err(|e| format!("Failed to serialize config: {}", e))?;

        std::fs::write(&config_file, toml_string)
            .map_err(|e| format!("Failed to write config file: {}", e))?;
        println!("Config file created at: {}", config_file.display());
        return Ok(key);
    }

    println!("API key: {}", key);
    Ok(key)
}
