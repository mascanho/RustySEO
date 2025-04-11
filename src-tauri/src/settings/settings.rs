use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tokio::fs;

use crate::domain_crawler::user_agents;

#[derive(Debug, Serialize, Deserialize)]
pub struct Settings {
    pub crawl_timeout: u32,
    pub max_retries: u32,
    pub base_delay: u64,
    pub max_delay: u64,
    pub concurrent_requests: usize,
    pub batch_size: usize,
    pub db_batch_size: usize,
    pub links_concurrent_requests: usize,
    pub user_agents: Vec<String>,
}

impl Settings {
    pub fn new() -> Self {
        Self {
            crawl_timeout: 30, // Default timeout
            max_retries: 5,    // Default retries
            base_delay: 500,
            max_delay: 8000,
            concurrent_requests: 150,
            batch_size: 20,
            db_batch_size: 10,
            links_concurrent_requests: 150,
            user_agents: user_agents::agents(),
        }
    }

    /// Gets the config file path (e.g., `/home/user/.config/rustyseo/configs.toml` on Linux)
    pub fn config_path() -> Result<PathBuf, String> {
        ProjectDirs::from("", "", "rustyseo")
            .ok_or("Failed to determine config directory".to_string())
            .map(|dirs| dirs.config_dir().join("configs.toml"))
    }
}

impl Default for Settings {
    fn default() -> Self {
        Self::new()
    }
}

/// Creates a new config file if it doesn't exist
pub async fn create_config_file() -> Result<Settings, String> {
    let config_path = Settings::config_path()?;
    println!("Config path: {:?}", config_path); // Debug log

    // Create parent dirs if missing
    if let Some(parent) = config_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .await
                .map_err(|e| format!("Failed to create config dir: {}", e))?;
        }
    }

    let settings = Settings::new();

    // Write default config only if file doesn't exist
    if !config_path.exists() {
        let toml_str = toml::to_string(&settings)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;

        fs::write(&config_path, toml_str)
            .await
            .map_err(|e| format!("Failed to write config: {}", e))?;

        println!("✅ Config file created at {:?}", config_path);
    } else {
        println!("⚠️ Config file already exists at {:?}", config_path);
    }

    Ok(settings)
}

/// Loads settings from file (returns error if file doesn't exist)
pub async fn load_settings() -> Result<Settings, String> {
    let config_path = Settings::config_path()?;
    let contents = fs::read_to_string(&config_path)
        .await
        .map_err(|e| format!("Failed to read config: {}", e))?;

    toml::from_str(&contents).map_err(|e| format!("Failed to parse config: {}", e))
}

/// Initializes settings (loads or creates if missing)
pub async fn init_settings() -> Result<Settings, String> {
    match load_settings().await {
        Ok(settings) => Ok(settings),
        Err(_) => create_config_file().await,
    }
}
