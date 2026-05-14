use once_cell::sync::Lazy;
use rusqlite::Connection;
use std::collections::HashSet;
use std::sync::Mutex;

// Store Crawl data in memory for fast access
// Store only the normalized URL
static CRAWL_CACHE: Lazy<Mutex<HashSet<String>>> =
    Lazy::new(|| Mutex::new(HashSet::new()));

// Store if Crawl data is loaded
static CRAWL_LOADED: Lazy<Mutex<bool>> = Lazy::new(|| Mutex::new(false));

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum Message {
    Loaded,
    NotLoaded,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CrawlMessage {
    pub message: Message,
    pub count: usize,
}

/// Load Crawl data from database and cache it
#[tauri::command]
pub fn load_crawl_from_database() -> Result<CrawlMessage, String> {
    use crate::uploads::storage::Storage;

    let db = Storage::new("crawl_excel.db").map_err(|e| e.to_string())?;
    let crawl_entries = db.get_all_crawl_data().map_err(|e| e.to_string())?;

    let mut cache = CRAWL_CACHE.lock().unwrap();
    cache.clear();

    for entry in crawl_entries {
        // Normalize the URL when loading into cache
        let normalized_url = normalize_crawl_path(&entry.url);
        println!("Loaded Crawl entry: {} -> {}", &entry.url, normalized_url);

        cache.insert(normalized_url);
    }

    println!("Loaded {} Crawl entries from database", cache.len());

    // Update loaded status
    let mut loaded = CRAWL_LOADED.lock().unwrap();
    *loaded = true;

    match cache.len() {
        0 => Ok(CrawlMessage {
            message: Message::NotLoaded,
            count: 0,
        }),
        _ => Ok(CrawlMessage {
            message: Message::Loaded,
            count: cache.len(),
        }),
    }
}

#[tauri::command]
pub fn unload_crawl_from_memory() -> Result<CrawlMessage, String> {
    let mut cache = CRAWL_CACHE.lock().unwrap();
    let count = cache.len();
    cache.clear();

    // Update loaded status
    let mut loaded = CRAWL_LOADED.lock().unwrap();
    *loaded = false;

    println!("Unloaded {} Crawl entries from memory", count);

    Ok(CrawlMessage {
        message: Message::NotLoaded,
        count: 0,
    })
}

/// Normalize path for Crawl matching
/// This removes protocol, domain, query parameters, fragments, and normalizes slashes
fn normalize_crawl_path(path: &str) -> String {
    let mut normalized = path.trim().to_string();

    // Convert to lowercase for case-insensitive matching
    normalized = normalized.to_lowercase();

    // Remove protocol and domain if present
    if normalized.contains("://") {
        if let Some(scheme_end) = normalized.find("://") {
            let after_scheme = &normalized[scheme_end + 3..];
            // Find the first slash after domain or end of string
            if let Some(path_start) = after_scheme.find('/') {
                normalized = after_scheme[path_start..].to_string();
            } else {
                // No path after domain, return root
                normalized = "/".to_string();
            }
        }
    }

    // Remove query parameters
    if let Some(pos) = normalized.find('?') {
        normalized = normalized[..pos].to_string();
    }

    // Remove fragments
    if let Some(pos) = normalized.find('#') {
        normalized = normalized[..pos].to_string();
    }

    // Ensure it starts with /
    if !normalized.starts_with('/') && !normalized.is_empty() {
        normalized = format!("/{}", normalized);
    }

    // Remove trailing slash (except for root)
    if normalized != "/" {
        normalized = normalized.trim_end_matches('/').to_string();
    }

    // Remove duplicate slashes (except at start)
    normalized = normalized.replace("//", "/");

    // Trim any whitespace
    normalized.trim().to_string()
}

/// Check if a path is in Crawl data using exact matching
pub fn check_crawl_data_for_path(path: &str) -> bool {
    let cache = CRAWL_CACHE.lock().unwrap();

    // Normalize the input path
    let normalized_path = normalize_crawl_path(path);

    // Try exact match on normalized path
    cache.contains(&normalized_path)
}

/// Find the matching URL for a path using exact matching
pub fn get_matching_crawl_url(path: &str) -> Option<String> {
    let cache = CRAWL_CACHE.lock().unwrap();

    // Normalize the input path
    let normalized_path = normalize_crawl_path(path);

    // Try exact match
    if cache.contains(&normalized_path) {
        return Some(normalized_path);
    }

    None
}

/// Alternative: Check Crawl data with more flexible matching options
pub fn check_crawl_data_for_path_with_options(
    path: &str,
    exact_match: bool,
) -> bool {
    let cache = CRAWL_CACHE.lock().unwrap();
    let normalized_path = normalize_crawl_path(path);

    if exact_match {
        // Strict exact matching
        cache.contains(&normalized_path)
    } else {
        // Try exact match first
        if cache.contains(&normalized_path) {
            return true;
        }

        // Fallback: Try to match with or without www
        let alternatives = generate_crawl_path_alternatives(&normalized_path);
        for alt_path in alternatives {
            if cache.contains(&alt_path) {
                return true;
            }
        }

        false
    }
}

/// Generate alternative path representations for matching
fn generate_crawl_path_alternatives(path: &str) -> Vec<String> {
    let mut alternatives = Vec::new();

    if path.starts_with("/www.") {
        // Remove www prefix
        alternatives.push(path.replacen("/www.", "/", 1));
    } else if let Some(stripped) = path.strip_prefix('/') {
        // Add www prefix if not present
        alternatives.push(format!("/www.{}", stripped));
    }

    // Add root alternative if path has multiple segments
    if path != "/" && path.contains('/') {
        alternatives.push("/".to_string());
    }

    alternatives
}

// Helper function for log parsing
pub fn check_crawl_match(
    path: &str,
) -> (
    bool,
    Option<String>,
) {
    let cache = CRAWL_CACHE.lock().unwrap();
    let normalized_path = normalize_crawl_path(path);

    if cache.contains(&normalized_path) {
        (
            true,
            Some(normalized_path),
        )
    } else {
        (false, None)
    }
}

/// Check if Crawl data is loaded
#[tauri::command]
pub fn is_crawl_loaded() -> bool {
    let loaded = CRAWL_LOADED.lock().unwrap();
    *loaded
}

/// Get all cached Crawl URLs (for debugging)
#[tauri::command]
pub fn get_cached_crawl_urls() -> Vec<String> {
    let cache = CRAWL_CACHE.lock().unwrap();
    cache.iter().cloned().collect()
}

/// Test URL matching function
#[tauri::command]
pub fn test_crawl_matching(test_url: &str) -> String {
    let normalized = normalize_crawl_path(test_url);
    let cache = CRAWL_CACHE.lock().unwrap();

    if cache.contains(&normalized) {
        format!("Exact match found for normalized path: {}", normalized)
    } else {
        format!("No exact match for normalized path: {}", normalized)
    }
}
