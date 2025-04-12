use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tokio::fs;
use tokio::time::Duration;
use toml;

use crate::domain_crawler::user_agents;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    pub crawl_timeout: u64,
    pub max_retries: u32,
    pub base_delay: u64,
    pub max_delay: u64,
    pub concurrent_requests: usize,
    pub batch_size: usize,
    pub db_batch_size: usize,
    pub user_agents: Vec<String>,
    pub html: bool,
    pub links_concurrent_requests: usize,
    pub links_initial_task_capacity: usize,
    pub links_max_retries: usize,
    pub links_retry_delay: u64,
    pub links_request_timeout: u64,
}

impl Settings {
    pub fn new() -> Self {
        Self {
            crawl_timeout: 28800,
            max_retries: 5,
            base_delay: 500,
            max_delay: 8000,
            concurrent_requests: 150,
            batch_size: 20,
            db_batch_size: 10,
            user_agents: user_agents::agents(),
            html: false,
            links_concurrent_requests: 150,
            links_initial_task_capacity: 100,
            links_max_retries: 3,
            links_request_timeout: 15,
            links_retry_delay: 500,
        }
    }

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

/// Loads settings from file (returns error if file doesn't exist)
pub async fn load_settings() -> Result<Settings, String> {
    let config_path = Settings::config_path()?;
    let contents = fs::read_to_string(&config_path)
        .await
        .map_err(|e| format!("Failed to read config: {}", e))?;
    toml::from_str(&contents).map_err(|e| format!("Failed to parse config: {}", e))
}

/// Creates a new config file if it doesn't exist
pub async fn create_config_file() -> Result<Settings, String> {
    let config_path = Settings::config_path()?;
    println!("Config path: {:?}", config_path);

    if let Some(parent) = config_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .await
                .map_err(|e| format!("Failed to create config dir: {}", e))?;
        }
    }

    let settings = Settings::new();

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

/// Initializes settings (loads or creates if missing)
pub async fn init_settings() -> Result<Settings, String> {
    println!("Attempting to load settings...");
    match load_settings().await {
        Ok(settings) => {
            println!("Settings loaded successfully.");
            Ok(settings)
        }
        Err(e) => {
            println!("Failed to load settings: {}. Creating config file...", e);
            create_config_file().await
        }
    }
}

pub fn print_settings(settings: &Settings) {
    // Use the settings
    println!("Crawl Timeout: {:?}", settings.crawl_timeout);
    println!("Max Retries: {}", settings.max_retries);
    println!("Base Delay: {}", settings.base_delay);
    println!("Max Delay: {}", settings.max_delay);
    println!("Concurrent Requests: {}", settings.concurrent_requests);
    println!("Batch Size: {}", settings.batch_size);
    println!("DB Batch Size: {}", settings.db_batch_size);
    println!(
        "Links Concurrent Requests: {}",
        settings.links_concurrent_requests
    );
    println!("User Agents: {:?}", settings.user_agents);
    println!("HTML: {}", settings.html);
}
