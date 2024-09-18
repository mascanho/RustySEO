use crate::crawler::db;
use crate::crawler::db::GscMatched;
use crate::crawler::libs;
use crate::crawler::libs::ApiKeys;
use crate::crawler::libs::Credentials;
use crate::image_converter::converter;
use serde::Deserialize;
use serde::Serialize;
use std::collections::HashSet;
use std::error::Error;
use std::fs;
use std::io::{self, BufWriter, Write};
use std::path::PathBuf;
use tauri::command;
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
    let credentials = libs::set_search_console_credentials(credentials).await;
}

// ------ CALL THE GOOGLE SEARCH CONSOLE FUNCTION
#[tauri::command]
pub async fn call_google_search_console() -> Result<(), String> {
    println!("Calling Google Search Console");
    match libs::get_google_search_console().await {
        Ok(_) => {
            println!("Successfully called Google Search Console");
            Ok(())
        }
        Err(e) => {
            eprintln!("Failed to call Google Search Console: {}", e);
            Err(format!("Failed to call Google Search Console: {}", e))
        }
    }
}

// ------- CALL GSC MATCH URL FUNCTION
#[tauri::command]
pub fn call_gsc_match_url(url: String) -> Result<Vec<GscMatched>, String> {
    println!("Calling Google Search Console");

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

#[tauri::command]
pub async fn get_google_analytics_command() -> Result<(), String> {
    match libs::get_google_analytics().await {
        Ok(_) => {
            println!("Successfully called Google Analytics");
            Ok(())
        }
        Err(e) => {
            eprintln!("Failed to call Google Analytics: {}", e);
            Err(format!("Failed to call Google Analytics: {}", e))
        }
    }
}
