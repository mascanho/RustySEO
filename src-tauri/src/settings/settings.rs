use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tokio::fs;

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
}

impl Settings {
    pub fn new() -> Self {
        Self {
            crawl_timeout: 30,
            max_retries: 5,
            base_delay: 500,
            max_delay: 8000,
            concurrent_requests: 150,
            batch_size: 20,
            db_batch_size: 10,
            links_concurrent_requests: 150,
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
        let mut toml_string = String::new();

        // Add header comments
        toml_string.push_str("# RustySEO Configuration File\n");
        toml_string.push_str("# This file is automatically generated.\n");
        toml_string.push_str("# All values are in milliseconds unless specified otherwise.\n\n");

        // Add individual field comments
        toml_string.push_str("# Maximum time (in seconds) to wait for a page to load\n");
        toml_string.push_str(&format!("crawl_timeout = {}\n", settings.crawl_timeout));

        toml_string.push_str("\n# Maximum number of retries for failed requests\n");
        toml_string.push_str(&format!("max_retries = {}\n", settings.max_retries));

        toml_string.push_str("\n# Base delay between requests (in milliseconds)\n");
        toml_string.push_str(&format!("base_delay = {}\n", settings.base_delay));

        toml_string.push_str("\n# Maximum delay between requests (in milliseconds)\n");
        toml_string.push_str(&format!("max_delay = {}\n", settings.max_delay));

        toml_string.push_str("\n# Number of concurrent HTTP requests\n");
        toml_string.push_str(&format!(
            "concurrent_requests = {}\n",
            settings.concurrent_requests
        ));

        toml_string.push_str("\n# Number of URLs to process in each batch\n");
        toml_string.push_str(&format!("batch_size = {}\n", settings.batch_size));

        toml_string.push_str("\n# Number of database operations to batch together\n");
        toml_string.push_str(&format!("db_batch_size = {}\n", settings.db_batch_size));

        toml_string.push_str("\n# Number of concurrent requests for link checking\n");
        toml_string.push_str(&format!(
            "links_concurrent_requests = {}\n",
            settings.links_concurrent_requests
        ));

        fs::write(&config_path, toml_string)
            .await
            .map_err(|e| format!("Failed to write config: {}", e))?;

        println!("✅ Config file created at {:?}", config_path);
    } else {
        println!("⚠️ Config file already exists at {:?}", config_path);
    }

    Ok(settings)
}

// Rest of the functions remain unchanged...
pub async fn load_settings() -> Result<Settings, String> {
    let config_path = Settings::config_path()?;
    let contents = fs::read_to_string(&config_path)
        .await
        .map_err(|e| format!("Failed to read config: {}", e))?;

    toml::from_str(&contents).map_err(|e| format!("Failed to parse config: {}", e))
}

pub async fn init_settings() -> Result<Settings, String> {
    match load_settings().await {
        Ok(settings) => Ok(settings),
        Err(_) => create_config_file().await,
    }
}
