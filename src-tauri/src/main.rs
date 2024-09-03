#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crawler::{
    CrawlResult, LinkResult, PageSpeedResponse, SEOLighthouseResponse, SeoPageSpeedResponse,
};
use directories::ProjectDirs;
use genai::genai;
use globals::actions;
use serde::{Deserialize, Serialize};
use std::io::Write;
use tauri::{api::path::config_dir, Manager};
use tokio;
use toml;

mod crawler;
mod domain_crawler;
mod downloads {
    pub mod csv;
}

pub mod globals {
    pub mod actions;
}

mod commands;
pub mod gemini;
mod genai;
mod gsc;
mod image_converter;
pub mod server;

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
async fn fetch_page_speed(
    url: &str,
    strategy: &str,
) -> Result<(PageSpeedResponse, SeoPageSpeedResponse), String> {
    let result =
        crawler::get_page_speed_insights(url.to_string(), Some(strategy.to_string())).await;

    match result {
        Ok((general_response, seo_response)) => Ok((general_response, seo_response)),
        Err(err) => Err(err),
    }
}

#[tauri::command]
async fn fetch_google_search_console() -> Result<(), String> {
    let result = gsc::check_google_search_console().await;

    Ok(result)
}

// ----------------- GENERATE AI SUMMARY OF CONTENT -----------------
#[tauri::command]
async fn get_genai(query: String) -> Result<String, String> {
    match genai(query).await {
        Ok(response) => Ok(response.content.unwrap_or_default()),
        Err(e) => Err(e.to_string()),
    }
}

//FETCH THE DATA FROM THE DB
#[tauri::command]
fn get_db_data() -> Result<Vec<crawler::db::ResultRecord>, String> {
    let result = crawler::db::read_data_from_db();

    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    }
}

// ----------------- GENERATE AI TOPICS OF CONTENT -----------------
#[tauri::command]
async fn generate_ai_topics(body: String) -> Result<String, String> {
    match gemini::generate_topics(body).await {
        Ok(response) => Ok(response),
        Err(e) => Err(e.to_string()),
    }
}

#[tokio::main]
async fn main() {
    // Execute the ID check
    let uuid = globals::actions::uuid_creation_check();
    println!("UUID: {}", uuid);

    // Start the server
    let _start_server = server::rusty_server().await;

    // Tauri setup
    tauri::Builder::default()
        .manage(LinkResult { links: vec![] })
        // .setup(|app| {
        //     let window = app.get_window("main").unwrap();
        //     window.set_decorations(true).unwrap();
        //     // Create and show splash screen
        //     let splash = tauri::WindowBuilder::new(
        //         app,
        //         "splash",
        //         tauri::WindowUrl::App("splashscreen.html".into()),
        //     )
        //     .decorations(false)
        //     .always_on_top(true)
        //     .center()
        //     .build()
        //     .expect("Failed to create splash window");
        //     // Schedule splash screen removal
        //     let main_window = window.clone();
        //     tauri::async_runtime::spawn(async move {
        //         std::thread::sleep(std::time::Duration::from_secs(3));
        //         splash.close().unwrap();
        //         main_window.show().unwrap();
        //     });
        //     Ok(())
        // })
        .invoke_handler(tauri::generate_handler![
            check_system,
            crawl,
            fetch_page_speed,
            fetch_google_search_console,
            add_api_key,
            get_genai,
            get_db_data,
            globals::actions::ai_model_selected,
            downloads::csv::generate_csv_command,
            commands::read_seo_data_from_db,
            commands::check_link_status,
            commands::write_model_to_disk,
            commands::check_ollama,
            commands::call_google_search_console,
            commands::call_gsc_match_url,
            commands::set_google_search_console_credentials,
            image_converter::converter::handle_image_conversion,
            commands::crawl_domain,
            gemini::set_gemini_api_key,
            downloads::csv::generate_seo_csv,
            generate_ai_topics,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// -------------------- CHECK SYSTEM ---------------------
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

    println!("Config directory: {:?}", config_dir);
    println!("project_dirs: {:?}", project_dirs);

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
        println!(
            "Key: {} \n added to configuration file {}",
            key,
            config_file.display()
        );
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
        //println!("Config file created at: {}", config_file.display());
        return Ok(key);
    }

    println!("API key: {}", key);
    Ok(key)
}
