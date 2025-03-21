use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Serialize, Deserialize)]
pub struct Settings {
    pub max_retries: u32,
    pub base_delay: u32,
    pub max_delay: u32,
    pub concurrent_requests: u32,
    pub crawl_timeout: u32,
    pub batch_size: u32,
    pub user_agent: String,
}

// CREATE AND INSTATIATE SETTINGS
pub fn create_config_file() -> Result<(), String> {
    let project_dirs = directories::ProjectDirs::from("", "", "rustyseo")
        .ok_or("Failed to determine configuration directory")?;
    let config_dir = project_dirs.config_dir();
    std::fs::create_dir_all(config_dir).map_err(|e| e.to_string())?;
    let file_path = config_dir.join("configs.toml");

    // Create a Settings struct with the default configuration
    let settings = Settings {
        max_retries: 3,
        base_delay: 5,
        max_delay: 60,
        concurrent_requests: 10,
        crawl_timeout: 60,
        batch_size: 100,
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3".to_string(),
    };

    // Serialize the struct to a TOML string
    let toml_string = toml::to_string(&settings).map_err(|e| e.to_string())?;

    if !file_path.exists() {
        fs::write(file_path, toml_string).map_err(|e| e.to_string())?;
        println!("Settings file created successfully");
    } else {
        eprintln!("Settings file already exist... continuing rustySEO...");
    }

    Ok(())
}

pub fn start_settings() -> Result<(), String> {
    create_config_file().map_err(|e| e.to_string())?;
    Ok(())
}
