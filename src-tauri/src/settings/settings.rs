use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use sysinfo::{ProcessExt, System, SystemExt};
use tokio::fs;
use tokio::io::AsyncWriteExt;
use toml;
use uuid::Uuid;

use crate::domain_crawler::helpers::keyword_selector::default_stop_words;
use crate::domain_crawler::{self, user_agents};
use crate::loganalyser::log_state::set_taxonomies;
use crate::settings::utils::user_bots::generate_default_user_bots;
use crate::version::local_version;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    pub version: String,
    pub crawl_timeout: u64,
    pub client_timeout: u64,
    pub client_connect_timeout: u64,
    pub redirect_policy: usize,
    pub max_retries: u32,
    pub base_delay: u64,
    pub max_delay: u64,
    pub concurrent_requests: usize,
    pub batch_size: usize,
    pub db_batch_size: usize,
    pub user_agents: Vec<String>,
    pub html: bool,
    pub links_max_concurrent_requests: usize,
    pub links_initial_task_capacity: usize,
    pub links_max_retries: usize,
    pub links_retry_delay: u64,
    pub links_request_timeout: u64,
    pub taxonomies: Vec<String>,
    pub rustyid: Uuid,
    pub page_speed_bulk: bool,
    pub page_speed_bulk_api_key: Option<Option<String>>,
    pub log_batchsize: usize,
    pub log_chunk_size: usize,
    pub log_sleep_stream_duration: u64,
    pub log_capacity: usize,
    pub log_project_chunk_size: usize,
    pub log_file_upload_size: usize,
    pub extract_ngrams: bool,
    pub stop_words: HashSet<String>,
    pub log_bots: Vec<(String, String)>,
    pub gsc_row_limit: i32,
    pub javascript_rendering: bool,
    pub javascript_concurrency: usize,
    pub stall_check_interval: u64, // CHECKS CRAWLER STALLS EVERY 30 SECONDS
    pub max_pending_time: u64,     // 15 MINUTES MAX PENDING TIME, set in seconds
    pub max_depth: usize,
    pub max_urls_per_domain: usize,
}

impl Settings {
    pub fn new() -> Self {
        Self {
            version: local_version(),
            crawl_timeout: 28800,
            client_timeout: 60,
            client_connect_timeout: 15,
            redirect_policy: 5,
            max_retries: 5,
            base_delay: 500,
            max_delay: 8000,
            concurrent_requests: 50,
            batch_size: 40,
            db_batch_size: 200,
            user_agents: user_agents::agents(),
            html: false,
            links_max_concurrent_requests: 250,
            links_initial_task_capacity: 100,
            links_max_retries: 3,
            links_request_timeout: 15,
            links_retry_delay: 500,
            taxonomies: set_taxonomies(),
            rustyid: Uuid::new_v4(),
            page_speed_bulk: false,
            page_speed_bulk_api_key: None,
            log_batchsize: 2,
            log_chunk_size: 500000,
            log_sleep_stream_duration: 1,
            log_capacity: 1,
            log_project_chunk_size: 1,
            log_file_upload_size: 75, // THE DEFAULT VALUE TO FILE UPLOADING
            extract_ngrams: false,
            stop_words: default_stop_words(),
            log_bots: generate_default_user_bots(),
            gsc_row_limit: 25000,
            javascript_rendering: false,
            javascript_concurrency: 8,
            stall_check_interval: 30, // SECONDS
            max_pending_time: 900,    // SECONDS
            max_depth: 50,
            max_urls_per_domain: 10000000,
        }
    }

    pub fn config_path() -> Result<PathBuf, String> {
        ProjectDirs::from("", "", "rustyseo")
            .ok_or("Failed to determine config directory".to_string())
            .map(|dirs| dirs.config_dir().join("configs.toml"))
    }

    // Delete the file
    pub fn delete_file() -> Result<(), String> {
        let config_path = Self::config_path()?;
        std::fs::remove_file(config_path).map_err(|e| e.to_string())
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
    println!("Version: {}", settings.version);
    println!("Crawl Timeout: {:?}", settings.crawl_timeout);
    println!("Client Timeout: {:?}", settings.client_timeout);
    println!(
        "Client Connect Timeout: {:?}",
        settings.client_connect_timeout
    );
    println!("Redirect Policy: {:?}", settings.redirect_policy);
    println!("Max Retries: {}", settings.max_retries);
    println!("Base Delay: {}", settings.base_delay);
    println!("Max Delay: {}", settings.max_delay);
    println!("Concurrent Requests: {}", settings.concurrent_requests);
    println!("Batch Size: {}", settings.batch_size);
    println!("DB Batch Size: {}", settings.db_batch_size);
    println!(
        "Links Concurrent Requests: {}",
        settings.links_max_concurrent_requests
    );
    println!("User Agents: {:?}", settings.user_agents);
    println!("HTML: {}", settings.html);
    println!(
        "Links Initial Task Capacity: {}",
        settings.links_initial_task_capacity
    );
    println!("Links Max Retries: {}", settings.links_max_retries);
    println!("Links Retry Delay: {}", settings.links_retry_delay);
    println!("Links Request Timeout: {}", settings.links_request_timeout);
    println!("Taxonomies: {:?}", settings.taxonomies);
    println!("Rusty ID: {}", settings.rustyid);
    println!("Page Speed Bulkd: {}", settings.page_speed_bulk);
    if let Some(key) = &settings.page_speed_bulk_api_key {
        println!("Page Speed Bulk API Key: {:#?}", key);
    } else {
        println!("Page Speed Bulk API Key: None");
    }

    println!("Log Batchsize: {}", settings.log_batchsize);
    println!("Log Chunksize: {}", settings.log_chunk_size);
    println!(
        "Log Sleep Stream Duration: {}",
        settings.log_sleep_stream_duration
    );

    println!("Log Capacity: {}", settings.log_capacity);
    println!(
        "Log Chunk Size Project: {}",
        settings.log_project_chunk_size
    );

    println!("Log File Upload Size: {}", settings.log_file_upload_size);

    println!("Ngrams: {}", settings.extract_ngrams);

    println!("Log Bots: {:#?}", settings.log_bots);

    println!("GSC Row Limit: {}", settings.gsc_row_limit);

    println!("")
}

pub async fn override_settings(updates: &str) -> Result<Settings, String> {
    // Load current settings or create new ones
    let mut settings = init_settings().await?;

    // Parse updates into a HashMap
    let updates: HashMap<String, toml::Value> =
        toml::from_str(updates).map_err(|e| format!("Failed to parse updates: {}", e))?;

    // Apply updates (only fields that were provided)
    if let Some(val) = updates
        .get("page_speed_bulk_api_key")
        .and_then(|v| v.as_str())
    {
        settings.page_speed_bulk_api_key = Some(Some(val.to_string()));
    }

    if let Some(val) = updates.get("crawl_timeout").and_then(|v| v.as_integer()) {
        settings.crawl_timeout = val as u64;
    }

    if let Some(val) = updates.get("client_timeout").and_then(|v| v.as_integer()) {
        settings.client_timeout = val as u64;
    }

    if let Some(val) = updates
        .get("client_connect_timeout")
        .and_then(|v| v.as_integer())
    {
        settings.client_connect_timeout = val as u64;
    }

    if let Some(val) = updates.get("redirect_policy").and_then(|v| v.as_integer()) {
        settings.redirect_policy = val as usize;
    }

    if let Some(val) = updates.get("max_retries").and_then(|v| v.as_integer()) {
        settings.max_retries = val as u32;
    }

    if let Some(val) = updates.get("base_delay").and_then(|v| v.as_integer()) {
        settings.base_delay = val as u64;
    }

    if let Some(val) = updates.get("max_delay").and_then(|v| v.as_integer()) {
        settings.max_delay = val as u64;
    }

    if let Some(val) = updates
        .get("concurrent_requests")
        .and_then(|v| v.as_integer())
    {
        settings.concurrent_requests = val as usize;
    }

    if let Some(val) = updates.get("batch_size").and_then(|v| v.as_integer()) {
        settings.batch_size = val as usize;
    }

    if let Some(val) = updates.get("db_batch_size").and_then(|v| v.as_integer()) {
        settings.db_batch_size = val as usize;
    }

    if let Some(val) = updates.get("user_agents").and_then(|v| v.as_array()) {
        settings.user_agents = val
            .iter()
            .filter_map(|v| v.as_str())
            .map(|s| s.to_string())
            .collect();
    }

    if let Some(val) = updates.get("html").and_then(|v| v.as_bool()) {
        settings.html = val;
    }

    if let Some(val) = updates
        .get("links_max_concurrent_requests")
        .and_then(|v| v.as_integer())
    {
        settings.links_max_concurrent_requests = val as usize;
    }

    if let Some(val) = updates
        .get("links_initial_task_capacity")
        .and_then(|v| v.as_integer())
    {
        settings.links_initial_task_capacity = val as usize;
    }

    if let Some(val) = updates
        .get("links_max_retries")
        .and_then(|v| v.as_integer())
    {
        settings.links_max_retries = val as usize;
    }

    if let Some(val) = updates
        .get("links_retry_delay")
        .and_then(|v| v.as_integer())
    {
        settings.links_retry_delay = val as u64;
    }

    if let Some(val) = updates
        .get("links_request_timeout")
        .and_then(|v| v.as_integer())
    {
        settings.links_request_timeout = val as u64;
    }

    if let Some(val) = updates.get("page_speed_bulk").and_then(|v| v.as_bool()) {
        settings.page_speed_bulk = val;
    }

    if let Some(val) = updates.get("taxonomies").and_then(|v| v.as_array()) {
        settings.taxonomies = val
            .iter()
            .filter_map(|v| v.as_str())
            .map(|s| s.to_string())
            .collect();
    }

    // Add the new settings
    if let Some(val) = updates.get("log_batchsize").and_then(|v| v.as_integer()) {
        settings.log_batchsize = val as usize;
    }

    if let Some(val) = updates.get("log_chunk_size").and_then(|v| v.as_integer()) {
        settings.log_chunk_size = val as usize;
    }

    if let Some(val) = updates
        .get("log_sleep_stream_duration")
        .and_then(|v| v.as_integer())
    {
        settings.log_sleep_stream_duration = val as u64;
    }

    if let Some(val) = updates.get("log_capacity").and_then(|v| v.as_integer()) {
        settings.log_capacity = val as usize;
    }

    if let Some(val) = updates
        .get("log_chunk_size_project")
        .and_then(|v| v.as_integer())
    {
        settings.log_project_chunk_size = val as usize;
    }

    if let Some(val) = updates
        .get("log_file_upload_size")
        .and_then(|v| v.as_integer())
    {
        settings.log_file_upload_size = val as usize;
    }

    if let Some(val) = updates.get("extract_ngrams").and_then(|v| v.as_bool()) {
        settings.extract_ngrams = val;
    }

    if let Some(val) = updates.get("gsc_row_limit").and_then(|v| v.as_integer()) {
        settings.gsc_row_limit = val as i32;
    }

    if let Some(val) = updates
        .get("javascript_rendering")
        .and_then(|v| v.as_bool())
    {
        settings.javascript_rendering = val;
    }

    if let Some(val) = updates
        .get("javascript_concurrency")
        .and_then(|v| v.as_integer())
    {
        settings.javascript_concurrency = val as usize;
    }

    if let Some(val) = updates
        .get("stall_check_interval")
        .and_then(|v| v.as_integer())
    {
        settings.stall_check_interval = val as u64;
    }

    if let Some(val) = updates
        .get("max_concurrent_requests")
        .and_then(|v| v.as_integer())
    {
        settings.max_pending_time = val as u64;
    }

    if let Some(val) = updates.get("max_depth").and_then(|v| v.as_integer()) {
        settings.max_depth = val as usize;
    }

    if let Some(val) = updates
        .get("max_urls_per_domain")
        .and_then(|v| v.as_integer())
    {
        settings.max_urls_per_domain = val as usize;
    }

    // Explicit file writing with flush
    let config_path = Settings::config_path()?;
    let toml_str = toml::to_string_pretty(&settings) // prettier formatting
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    let mut file = fs::File::create(&config_path)
        .await
        .map_err(|e| format!("Failed to create config file: {}", e))?;

    AsyncWriteExt::write_all(&mut file, toml_str.as_bytes())
        .await
        .map_err(|e| format!("Failed to write config: {}", e))?;

    file.flush()
        .await // Ensure data is written to disk
        .map_err(|e| format!("Failed to flush config: {}", e))?;

    Ok(settings)
}

#[tauri::command]
pub async fn get_project_chunk_size_command() -> Result<usize, String> {
    let settings = load_settings().await?;
    Ok(settings.log_project_chunk_size)
}

#[tauri::command]
pub async fn get_log_file_upload_size_command() -> Result<usize, String> {
    let settings = load_settings().await?;
    Ok(settings.log_file_upload_size)
}

#[tauri::command]
pub fn get_system() -> Result<Value, String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    Ok(json!({
        "totalMemory": sys.total_memory(),
        "usedMemory": sys.used_memory(),
        "totalSwap": sys.total_swap(),
        "usedSwap": sys.used_swap(),

        // System Information
        "systemName": sys.name(),
        "kernelVersion" : sys.kernel_version(),
        "osVersion": sys.os_version(),
        "hostName": sys.host_name(),
        "cpus": sys.cpus().len(),

    }))
}

// REMOVE ALL THE FOLDERS IN THE CONFIG PATH
#[tauri::command]
pub async fn delete_config_folders_command() -> Result<(), String> {
    let config_path = directories::ProjectDirs::from("", "", "rustyseo")
        .ok_or("Failed to determine config directory".to_string())?
        .config_dir()
        .to_path_buf();
    if config_path.exists() {
        fs::remove_dir_all(&config_path)
            .await
            .map_err(|e| format!("Failed to delete config directory: {}", e))?;
        println!("✅ Config directory deleted at {:?}", config_path);
    } else {
        println!("⚠️ Config directory does not exist at {:?}", config_path);
    }
    Ok(())
}

// OPEN THE CONFIG FOLDER IN THE FILE EXPLORER
#[tauri::command]
pub fn open_config_folder_command() -> Result<(), String> {
    let config_path = directories::ProjectDirs::from("", "", "rustyseo")
        .ok_or("Failed to determine config directory".to_string())?
        .config_dir()
        .to_path_buf();

    if config_path.exists() {
        if cfg!(target_os = "windows") {
            std::process::Command::new("explorer")
                .arg(config_path)
                .spawn()
                .map_err(|e| format!("Failed to open config folder: {}", e))?;
        } else if cfg!(target_os = "macos") {
            std::process::Command::new("open")
                .arg(config_path)
                .spawn()
                .map_err(|e| format!("Failed to open config folder: {}", e))?;
        } else if cfg!(target_os = "linux") {
            std::process::Command::new("xdg-open")
                .arg(config_path)
                .spawn()
                .map_err(|e| format!("Failed to open config folder: {}", e))?;
        }
        Ok(())
    } else {
        Err("Config folder does not exist".to_string())
    }
}

// COMMAND TO GET ANY SETTINGS INTO THE FRONT END TO BE USED
#[tauri::command]
pub async fn get_settings_command() -> Result<Settings, String> {
    let settings = load_settings().await?;
    Ok(settings)
}

#[tauri::command]
pub async fn toggle_javascript_rendering(
    value: bool,
    app_handle: tauri::AppHandle,
    settings_state: tauri::State<'_, crate::AppState>,
) -> Result<(), String> {
    let state = format!("javascript_rendering = {}", value);

    let updated_settings = override_settings(&state).await?;

    let mut settings_lock = settings_state.settings.write().await;
    *settings_lock = updated_settings;

    println!("Javascript Rendering set to: {}", value);

    use tauri::Emitter;
    app_handle
        .emit("javascript-rendering-toggled", value)
        .map_err(|e| format!("Failed to emit event: {}", e))?;

    Ok(())
}
