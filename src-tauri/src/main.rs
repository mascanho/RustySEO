#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crate::crawler::content::scrape_google_headings_command;
use crate::domain_crawler::db_deep::db;
use crate::domain_crawler::domain_commands;
use crawler::{
    CrawlResult, LinkResult, PageSpeedResponse, SEOLighthouseResponse, SeoPageSpeedResponse,
};
use directories::ProjectDirs;
use globals::actions;
use serde::{Deserialize, Deserializer, Serialize};
use settings::settings::Settings;
use std::io::Write;
use std::sync::Arc;
use std::time::Duration;
use tauri::State;
use tauri::{Manager, Window, WindowEvent};
use tokio::sync::Mutex;
use tokio::sync::RwLock;
use toml;

pub mod crawler;
pub mod domain_crawler;
pub mod settings;

pub mod machine_learning;

pub mod downloads {
    pub mod csv;
    pub mod excel;
    pub mod google_sheets;
}

pub mod globals {
    pub mod actions;
}

pub mod commands;
pub mod gemini;
pub mod genai;
pub mod gsc;
mod image_converter;
pub mod server;
pub mod version;

// Handling the app state
pub struct AppState {
    pub settings: Arc<RwLock<Settings>>,
}

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
    let timeout = Duration::from_secs(70); // 70 seconds timeout

    let result = tokio::time::timeout(
        timeout,
        crawler::get_page_speed_insights(url.to_string(), Some(strategy.to_string())),
    )
    .await;

    match result {
        Ok(inner_result) => match inner_result {
            Ok((general_response, seo_response)) => Ok((general_response, seo_response)),
            Err(err) => Err(err),
        },
        Err(_) => {
            println!("Fetch page speed timed out after {:?}", timeout);
            Err("Request timed out".to_string())
        }
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
    match genai::genai(query).await {
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
    match genai::generate_topics(body).await {
        Ok(response) => Ok(response.content.unwrap_or_default()),
        Err(e) => Err(e.to_string()),
    }
}

#[tokio::main]
async fn main() {
    // Execute the ID check
    // let uuid = globals::actions::uuid_creation_check();
    // clear the custom_search DB entry
    match db::clear_custom_search() {
        Ok(_) => println!("Custom search entry cleared successfully"),
        Err(err) => eprintln!("Error clearing custom search entry: {}", err),
    }

    // Set the configurations
    let settings = match settings::settings::init_settings().await {
        Ok(s) => Arc::new(RwLock::new(s)),
        Err(e) => {
            eprintln!("Failed to load settings: {}", e);
            Arc::new(RwLock::new(Settings::default()))
        }
    };

    // initialise the dbs
    let _start_db = crawler::db::databases_start();
    // let _domain_results_db = domain_crawler::database::add_data().await;

    // Start the server
    // let _start_server = server::rusty_server().await;

    // Tauri setup
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(LinkResult { links: vec![] })
        .manage(AppState { settings })
        .invoke_handler(tauri::generate_handler![
            crawl,
            fetch_page_speed,
            fetch_google_search_console,
            add_api_key,
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
            gemini::set_gemini_api_key,
            downloads::csv::generate_seo_csv,
            generate_ai_topics,
            get_genai,
            crawler::db::clear_table_command,
            server::ask_rusty_command,
            downloads::excel::export_to_excel_command,
            globals::actions::get_search_console_credentials,
            globals::actions::check_ai_model,
            commands::get_google_analytics_command,
            crawler::content::scrape_google_headings_command,
            crawler::content::fetch_google_suggestions,
            crawler::libs::set_google_analytics_id,
            crawler::libs::load_api_keys,
            crawler::libs::get_google_analytics_id,
            crawler::libs::read_credentials_file,
            genai::get_ai_model,
            actions::ai_model_selected,
            commands::set_microsoft_clarity_command,
            commands::get_microsoft_clarity_command,
            commands::get_microsoft_clarity_data_command,
            version::version_check_command,
            gemini::get_headings_command,
            gemini::get_jsonld_command,
            commands::add_gsc_data_to_kw_tracking_command,
            commands::fetch_tracked_keywords_command,
            commands::delete_keyword_command,
            commands::match_tracked_with_gsc_command,
            commands::read_tracked_keywords_from_db_command,
            commands::read_gsc_data_from_db_command,
            commands::read_matched_keywords_from_db_command,
            commands::fetch_keywords_summarized_matched_command,
            domain_commands::domain_crawl_command,
            domain_commands::create_excel,
            domain_commands::create_excel_main_table,
            // DEEP CRAWL DATABASE STUFF
            db::create_domain_results_table,
            db::read_domain_results_history_table,
            db::create_domain_results_history,
            db::store_custom_search,
            domain_commands::create_excel_two_cols,
            domain_commands::create_css_excel,
            domain_commands::create_keywords_excel_command,
            domain_commands::generate_links_table_xlsx_command,
            domain_commands::analyse_diffs_command,
            commands::open_configs_with_native_editor
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
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
