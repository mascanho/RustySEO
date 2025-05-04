use std::{collections::HashMap, fs, path::PathBuf};

use directories::ProjectDirs;

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
