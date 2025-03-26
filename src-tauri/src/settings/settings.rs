use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tokio::fs;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    pub max_retries: u32,
    pub base_delay: u32,
    pub max_delay: u32,
    pub concurrent_requests: u32,
    pub crawl_timeout: u32,
    pub batch_size: u32,
    pub user_agent: String,
    pub max_page_crawl: u32,
}

impl Settings {
    /// Creates a new Settings instance with default values
    pub fn new() -> Self {
        Self {
            max_retries: 5,
            base_delay: 500,
            max_delay: 8000,
            concurrent_requests: 120,
            crawl_timeout: 28800,
            batch_size: 20,
            user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3".to_string(),
            max_page_crawl: 20000,
        }
    }

    /// Builder method to set crawl timeout
    pub fn with_crawl_timeout(mut self, timeout: u32) -> Self {
        self.crawl_timeout = timeout;
        self
    }

    /// Builder method to set max retries
    pub fn with_max_retries(mut self, max_retries: u32) -> Self {
        self.max_retries = max_retries;
        self
    }

    /// Gets the default configuration file path
    pub fn config_path() -> Result<PathBuf, String> {
        ProjectDirs::from("", "", "rustyseo")
            .ok_or_else(|| "Failed to determine configuration directory".to_string())
            .map(|proj_dirs| proj_dirs.config_dir().join("configs.toml"))
    }
}

impl Default for Settings {
    fn default() -> Self {
        Self::new()
    }
}

/// Creates or loads the configuration file asynchronously
pub async fn create_config_file() -> Result<Settings, String> {
    let config_path = Settings::config_path()?;

    // Create parent directories if they don't exist
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)
            .await
            .map_err(|e| e.to_string())?;
    }

    let settings = Settings::new();

    // Only write if file doesn't exist
    if !config_path.exists() {
        let toml_string = toml::to_string(&settings).map_err(|e| e.to_string())?;
        fs::write(&config_path, toml_string)
            .await
            .map_err(|e| e.to_string())?;
        println!("Settings file created successfully at {:?}", config_path);
    } else {
        eprintln!("Settings file already exists at {:?}", config_path);
    }

    Ok(settings)
}

/// Loads settings from configuration file asynchronously
pub async fn load_settings() -> Result<Settings, String> {
    let config_path = Settings::config_path()?;
    let contents = fs::read_to_string(&config_path)
        .await
        .map_err(|e| e.to_string())?;
    toml::from_str(&contents).map_err(|e| e.to_string())
}

/// Initializes settings asynchronously (creates if doesn't exist)
pub async fn init_settings() -> Result<Settings, String> {
    match load_settings().await {
        Ok(settings) => Ok(settings),
        Err(_) => create_config_file().await,
    }
}
