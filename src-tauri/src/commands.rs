use crate::crawler::db;
use crate::crawler::libs;
use serde::Deserialize;
use serde::Serialize;
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

// ------ CALL THE GOOGLE SEARCH CONSOLE FUNCTION
#[tauri::command]
pub async fn call_google_search_console() {
    println!("Calling Google Search Console");
    let result = libs::get_google_search_console()
        .await
        .expect("Failed to call Google Search Console");
}
