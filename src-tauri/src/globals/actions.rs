use crate::crawler::libs::read_credentials_file;
use crate::crawler::libs::InstalledInfo;
use directories::ProjectDirs;
use std::fs;
use std::sync::{Mutex, OnceLock};
use uuid::Uuid;

static AI_MODEL_CACHE: OnceLock<Mutex<Option<String>>> = OnceLock::new();

// ------------- Check if the UUID is present in the system  ---------------
pub fn uuid_creation_check() -> String {
    // CHECK FOR THE FILE IN THE CONFIG DIRECTORY
    println!("Checking for UUID file");
    let project_dirs =
        ProjectDirs::from("", "", "rustyseo").expect("Failed to get project directories");
    println!("Config directory: {:?}", project_dirs.config_dir());
    let config_dir = project_dirs.config_dir();
    let uuid_file = config_dir.join("uuid.toml");

    // Create directories if they don't exist
    if !config_dir.exists() {
        std::fs::create_dir_all(config_dir).expect("Failed to create config directory");
    }

    // Check if the file exists
    if uuid_file.exists() {
        match std::fs::read_to_string(&uuid_file) {
            Ok(uuid) => uuid,
            Err(e) => {
                eprintln!("Failed to read UUID file: {}", e);
                Uuid::new_v4().to_string()
            }
        }
    } else {
        let uuid = Uuid::new_v4().to_string();
        if let Err(e) = std::fs::write(&uuid_file, &uuid) {
            eprintln!("Failed to write UUID file: {}", e);
        }
        uuid
    }
}

// ---------- Write to disk the AI Model being used
#[tauri::command]
pub fn ai_model_selected(model: String) -> Result<String, String> {
    // CHECK FOR THE FILE IN THE CONFIG DIRECTORY
    println!("Checking for AI Model file");
    let project_dirs =
        ProjectDirs::from("", "", "rustyseo").expect("Failed to get project directories");
    println!("Config directory: {:?}", project_dirs.config_dir());
    let config_dir = project_dirs.config_dir();
    let ai_model_file = config_dir.join("chosen_ai_model.toml");

    // Update cache and write new model
    let cache = AI_MODEL_CACHE.get_or_init(|| Mutex::new(None));
    if let Ok(mut cache_guard) = cache.lock() {
        *cache_guard = Some(model.clone());
    }
    
    match std::fs::write(&ai_model_file, &model) {
        Ok(_) => Ok(model),
        Err(e) => Err(format!("Failed to write AI model file: {}", e)),
    }
}

// ------ read the AI Model being used
#[tauri::command]
pub fn check_ai_model() -> String {
    ai_model_read()
}
pub fn ai_model_read() -> String {
    // Initialize cache if not already done
    let cache = AI_MODEL_CACHE.get_or_init(|| Mutex::new(None));
    
    // Try to get cached value
    if let Ok(cached_model) = cache.lock() {
        if let Some(ref model) = *cached_model {
            return model.clone();
        }
    }

    // CHECK FOR THE FILE IN THE CONFIG DIRECTORY
    println!("Checking for AI Model file");
    let project_dirs =
        ProjectDirs::from("", "", "rustyseo").expect("Failed to get project directories");
    println!("Config directory: {:?}", project_dirs.config_dir());
    let config_dir = project_dirs.config_dir();
    let ai_model_file = config_dir.join("chosen_ai_model.toml");

    // Create directories if they don't exist
    if !config_dir.exists() {
        std::fs::create_dir_all(config_dir).expect("Failed to create config directory");
    }

    // Check if the file exists
    let ai_model = if ai_model_file.exists() {
        match std::fs::read_to_string(&ai_model_file) {
            Ok(model) => {
                println!("General AI Model Selected : {:?}", model);
                model
            }
            Err(e) => {
                eprintln!("Failed to read AI model file: {}", e);
                "No AI Model selected".to_string()
            }
        }
    } else {
        "No AI Model selected".to_string()
    };

    // Cache the result
    if let Ok(mut cache_guard) = cache.lock() {
        *cache_guard = Some(ai_model.clone());
    }

    ai_model
}

#[tauri::command]
pub fn clear_ai_model_cache() -> Result<(), String> {
    let cache = AI_MODEL_CACHE.get_or_init(|| Mutex::new(None));
    match cache.lock() {
        Ok(mut cache_guard) => {
            *cache_guard = None;
            Ok(())
        }
        Err(e) => Err(format!("Failed to clear cache: {}", e)),
    }
}

#[tauri::command]
pub async fn get_search_console_credentials() -> Result<InstalledInfo, String> {
    let credentials = read_credentials_file()
        .await
        .map_err(|e| format!("Failed to read credentials file: {}", e))?;
    Ok(credentials)
}
