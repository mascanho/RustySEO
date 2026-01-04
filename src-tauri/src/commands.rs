use crate::crawler::db;
use crate::crawler::db::GscMatched;
use crate::crawler::db::KeywordsSummary;
use crate::crawler::db::KwTrackingData;
use crate::crawler::db::MatchedKeywordData;
use crate::crawler::libs;
use crate::crawler::libs::ApiKeys;
use crate::crawler::libs::ClarityData;
use crate::crawler::libs::Credentials;
use crate::crawler::libs::DateRange;
use crate::crawler::libs::GA4Credentials;
use crate::image_converter::converter;
use crate::machine_learning::keyword_frequency;
use crate::settings::settings;
use serde::Deserialize;
use serde::Serialize;
use serde_json::Value;
use std::collections::HashSet;
use std::error::Error;
use std::fs;
use std::io::{self, BufWriter, Write};
use std::path::PathBuf;
use tauri::command;
use tauri_plugin_shell::ShellExt;
use toml;

// ---------------- READ SEO PAGE DATA FROM THE DB ----------------
#[tauri::command]
pub fn read_seo_data_from_db() -> Result<Vec<db::SEOResultRecord>, String> {
    let result = db::read_seo_data_from_db();
    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    }
}

// CHECK THE LINKS STATUS CODES

#[tauri::command]
pub async fn check_link_status(url: String) -> Result<Vec<libs::LinkStatus>, String> {
    // Call the async function from the `libs` module
    let result = libs::check_links(url).await;

    // Handle the result and convert errors to strings
    match result {
        Ok(link_statuses) => Ok(link_statuses),
        Err(err) => Err(err.to_string()),
    }
}

// WRITE THE MODEL SELECTION TO DISK
#[tauri::command]
pub fn write_model_to_disk(model: String) -> Result<String, String> {
    // Define the project directory and the path for the model
    let config_dir = directories::ProjectDirs::from("", "", "rustyseo")
        .ok_or("Failed to get project directories")?;
    let model_dir = config_dir.data_dir().join("models");
    fs::create_dir_all(&model_dir) // Ensure the directory exists
        .map_err(|e| e.to_string())?;
    let model_path = model_dir.join("ai.toml");

    // Write the model directly to the file
    let file = fs::File::create(&model_path).map_err(|e| e.to_string())?;
    let mut writer = BufWriter::new(file);
    writer
        .write_all(model.as_bytes())
        .map_err(|e| e.to_string())?;

    // Return the path to the file as a success indication
    println!("Model {} written to: {}", model, model_path.display());
    Ok(model)
}

// ------------- CHECK IF OLLAMA IS RUNNING ON THE SYSTEM
#[derive(Serialize, Debug, Deserialize)]
pub struct OllamaProcess {
    pub text: String,
    pub status: bool,
}

#[tauri::command]
pub fn check_ollama() -> Result<OllamaProcess, String> {
    let result = libs::check_ollama();

    println!("Ollama Status: {:?}", result);

    Ok(if result {
        OllamaProcess {
            text: String::from("Ollama is running"),
            status: true,
        }
    } else {
        OllamaProcess {
            text: String::from("Ollama is not running"),
            status: false,
        }
    })
}

// ------- SETTING GOOGLE SEARCH CONSOLE CREDENTIALS
#[tauri::command]
pub async fn set_google_search_console_credentials(credentials: Credentials) {
    println!("Command: set_google_search_console_credentials for URL: {}", credentials.url);
    let _ = libs::set_search_console_credentials(credentials).await;
    println!("Command: set_google_search_console_credentials completed");
}

// ------ CALL THE GOOGLE SEARCH CONSOLE FUNCTION
#[tauri::command]
pub async fn call_google_search_console() -> Result<(), String> {
    println!("Command: call_google_search_console starting...");
    match libs::get_google_search_console().await {
        Ok(_) => {
            println!("Command: call_google_search_console successfully completed");
            Ok(())
        }
        Err(e) => {
            eprintln!("Command: call_google_search_console failed: {}", e);
            Err(format!("Failed to call Google Search Console: {}", e))
        }
    }
}

// ------- CALL GSC MATCH URL FUNCTION
#[tauri::command]
pub fn call_gsc_match_url(url: String) -> Result<Vec<GscMatched>, String> {
    // println!("Calling Google Search Console");

    // Assuming match_gsc_url does not require arguments and does not return a result
    // If it does return a result, make sure to handle it accordingly
    if let Err(e) = db::match_gsc_url(&url) {
        return Err(e.to_string());
    }

    // Read matched URLs from the database
    match db::read_gsc_matched_from_db() {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    }
}



// ------- SETTING GOOGLE ANALYTICS CREDENTIALS
#[tauri::command]
pub async fn set_google_analytics_credentials(credentials: GA4Credentials) {
    println!("Command: set_google_analytics_credentials for property: {}", credentials.property_id);
    let _ = libs::set_google_analytics_credentials(credentials).await;
}

// ------- READ GA4 CREDENTIALS FILE
#[tauri::command]
pub async fn read_ga4_credentials_file() -> Result<GA4Credentials, String> {
    libs::read_ga4_credentials_file().await
}

// ------- GET GA4 PROPERTIES
#[tauri::command]
pub async fn get_ga4_properties(token: String) -> Result<Vec<Value>, String> {
    libs::get_ga4_properties(token).await
}

#[tauri::command]
pub async fn get_google_analytics_command(
    search_type: Vec<serde_json::Value>,
    date_ranges: Vec<DateRange>,
) -> Result<libs::AnalyticsData, String> {
    match libs::get_google_analytics(search_type, date_ranges).await {
        Ok(result) => {
            println!("Successfully called Google Analytics");
            Ok(result)
        }
        Err(e) => {
            eprintln!("Failed to call Google Analytics: {}", e);
            Err(format!("Failed to call Google Analytics: {}", e))
        }
    }
}

// ------- SET MICROSOFT CLARITY CREDENTIALS
#[tauri::command]
pub async fn set_microsoft_clarity_command(
    endpoint: String,
    token: String,
) -> Result<String, String> {
    let result = libs::set_microsoft_clarity_credentials(endpoint, token).await;
    match result {
        Ok(result) => Ok(result),
        Err(e) => Err(e.to_string()),
    }
}

// ------- GET MICROSOFT CLARITY CREDENTIALS
#[tauri::command]
pub async fn get_microsoft_clarity_command() -> Result<Vec<String>, String> {
    let result = libs::get_microsoft_clarity_credentials().await;
    match result {
        Ok(result) => Ok(result),
        Err(e) => Err(e.to_string()),
    }
}

// ------- Fetch the Microsoft Clarity Data
#[tauri::command]
pub async fn get_microsoft_clarity_data_command() -> Result<Vec<Value>, String> {
    let result = libs::get_microsoft_clarity_data().await;
    match result {
        Ok(result) => Ok(result),
        Err(e) => Err(e.to_string()),
    }
}

// ---------- Add Keyword & ITS DATA TO THE KEYWORD TRACKING TABLE

#[tauri::command]
pub fn add_gsc_data_to_kw_tracking_command(data: db::KwTrackingData) -> Result<(), String> {
    println!("Tracking KW data: {:#?}", data);
    // Call database function to add Keyword Related data Call the database function to add the

    match db::add_gsc_data_to_kw_tracking(&data) {
        Ok(_) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

// ------- FETCH THE TRACKED KEYWORDS FROM THE DB
#[tauri::command]
pub fn fetch_tracked_keywords_command() -> Result<Vec<KwTrackingData>, String> {
    let result = db::read_tracked_keywords_from_db();
    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    }
}

// ------- DELETE KEYWORD FROM THE DB
#[tauri::command]
pub fn delete_keyword_command(id: String) -> Result<(), String> {
    let result = db::delete_keyword_from_db(&id);
    match result {
        Ok(_) => Ok(()),
        Err(err) => Err(err.to_string()),
    }
}

// ------- SYNC KEYWORD TABLES FOR CONSISTENCY
#[tauri::command]
pub fn sync_keyword_tables_command() -> Result<(), String> {
    let result = db::sync_keyword_tables();
    match result {
        Ok(_) => Ok(()),
        Err(err) => Err(err.to_string()),
    }
}

// ------- MATCH KEYWORDS WITH GSC
#[tauri::command]
pub fn match_tracked_with_gsc_command() -> Result<(), String> {
    let result = db::match_tracked_with_gsc();
    match result {
        Ok(_) => Ok(()),
        Err(err) => Err(err.to_string()),
    }
}

// READ KEYWORD TRACKING DATA FROM THE DB
#[tauri::command]
pub fn read_tracked_keywords_from_db_command() -> Result<Vec<KwTrackingData>, String> {
    let result = db::read_tracked_keywords_from_db();
    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    }
}

// READ KEYWORDS FROM GSC TABLE ALL DATA
#[tauri::command]
pub fn read_gsc_data_from_db_command() -> Result<Vec<db::GscDataFromDB>, String> {
    let result = db::read_gsc_data_from_db();
    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    }
}

// READ KEYWORD MATCHED DATA FROM THE DB
#[tauri::command]
pub fn read_matched_keywords_from_db_command() -> Result<Vec<MatchedKeywordData>, String> {
    let result = db::read_matched_keywords_from_db();
    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    }
}

// FETCH THE KEYWORDS SUMMARIZED AND MATCHED WITH THE GSC DATA
#[tauri::command]
pub fn fetch_keywords_summarized_matched_command() -> Result<Vec<KeywordsSummary>, String> {
    let result = db::fetch_keywords_summarized_matched();
    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    }
}

// OPEN OS TEXT EDITOR WITH THE SETTINGS FILE
#[tauri::command]
pub async fn open_configs_with_native_editor(
    _app_handle: tauri::AppHandle, // We might not need this for std::process
) -> Result<(), String> {
    let config_path = settings::Settings::config_path()
        .map_err(|e| format!("Failed to get config path: {}", e))?;

    let path = config_path.to_string_lossy().to_string();

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd.exe")
            .args(["/C", "start", "", &path]) // Empty string after start is important
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new("xdg-open") // Linux
            .arg(&path)
            .spawn()
            .or_else(|_| {
                std::process::Command::new("open") // macOS fallback
                    .arg(&path)
                    .spawn()
            })
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    Ok(())
}
