use std::{collections::HashMap, fs, path::PathBuf};

use directories::ProjectDirs;
use tauri::Emitter;

use crate::settings;

#[tauri::command]
pub async fn read_page_speed_bulk_api_key() -> Result<(), String> {
    // Get the config file path
    let file_path: PathBuf = ProjectDirs::from("", "", "rustyseo")
        .ok_or("Failed to get config directory")?
        .config_dir()
        .join("api_keys.toml");

    // Read and parse the file
    let file_content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let config: HashMap<String, String> =
        toml::from_str(&file_content).map_err(|e| format!("Failed to parse TOML: {}", e))?;

    // Get the API key from the map
    let api_key = config
        .get("page_speed_key")
        .ok_or("API key not found".to_string())?;

    // Create proper TOML update string
    let api_key_update = format!(r#"page_speed_bulk_api_key = "{}""#, api_key);

    settings::settings::override_settings(&api_key_update).await?;
    println!("File to merge is: {:#?}", &file_path);
    println!("Updating settings with API key");

    Ok(())
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct PageSpeedDetails {
    #[serde(rename = "apiKey")]
    pub api_key: Option<String>,
    pub page_speed_crawl: bool,
}

#[tauri::command]
pub async fn check_page_speed_bulk() -> Result<PageSpeedDetails, String> {
    let settings = settings::settings::load_settings().await?;

    // Create the PageSpeedDetails struct to return
    let details = PageSpeedDetails {
        api_key: settings.page_speed_bulk_api_key.unwrap_or_default(),
        page_speed_crawl: settings.page_speed_bulk,
    };

    Ok(details)
}

#[tauri::command]
pub async fn toggle_page_speed_bulk(
    value: bool,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // Create proper TOML update string (unquoted boolean)
    let state = format!("page_speed_bulk = {}", value);

    settings::settings::override_settings(&state).await?;

    println!("Page Speed Bulk Check set to: {}", value);

    // Emit a tauri event
    app_handle
        .emit("page-speed-bulk-toggled", value)
        .map_err(|e| format!("Failed to emit event: {}", e))?;

    Ok(())
}
