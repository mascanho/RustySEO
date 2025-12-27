use once_cell::sync::Lazy;
use rusqlite::Connection;
use std::collections::HashMap;
use std::sync::Mutex;

// Store GSC data in memory for fast access
// Store only metrics, not the URL again
static GSC_CACHE: Lazy<Mutex<HashMap<String, GscMetrics>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

// Store if GSC data is loaded
static GSC_LOADED: Lazy<Mutex<bool>> = Lazy::new(|| Mutex::new(false));

#[derive(Debug)]
struct GscMetrics {
    position: i32,
    clicks: i32,
    impressions: i32,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum Message {
    Loaded,
    NotLoaded,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GscMessage {
    pub message: Message,
    pub count: usize,
}

/// Load GSC data from database and cache it
#[tauri::command]
pub fn load_gsc_from_database() -> Result<GscMessage, String> {
    use crate::uploads::storage::Storage;

    let db = Storage::new("gsc_excel.db").map_err(|e| e.to_string())?;
    let gsc_entries = db.get_all_gsc_data().map_err(|e| e.to_string())?;

    let mut cache = GSC_CACHE.lock().unwrap();
    cache.clear();

    for entry in gsc_entries {
        // Normalize the URL when loading into cache
        let normalized_url = normalize_gsc_path(&entry.url);
        println!("Loaded GSC entry: {} -> {}", &entry.url, normalized_url);

        cache.insert(
            normalized_url,
            GscMetrics {
                position: entry.position,
                clicks: entry.clicks,
                impressions: entry.impressions,
            },
        );
    }

    println!("Loaded {} GSC entries from database", cache.len());

    // Update loaded status
    let mut loaded = GSC_LOADED.lock().unwrap();
    *loaded = true;

    match cache.len() {
        0 => Ok(GscMessage {
            message: Message::NotLoaded,
            count: 0,
        }),
        _ => Ok(GscMessage {
            message: Message::Loaded,
            count: cache.len(),
        }),
    }
}

#[tauri::command]
pub fn unload_gsc_from_memory() -> Result<GscMessage, String> {
    let mut cache = GSC_CACHE.lock().unwrap();
    let count = cache.len();
    cache.clear();

    // Update loaded status
    let mut loaded = GSC_LOADED.lock().unwrap();
    *loaded = false;

    println!("Unloaded {} GSC entries from memory", count);

    Ok(GscMessage {
        message: Message::NotLoaded,
        count: 0,
    })
}

/// Normalize path for GSC matching
/// This removes protocol, domain, query parameters, fragments, and normalizes slashes
fn normalize_gsc_path(path: &str) -> String {
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

/// Get GSC data for a specific path using exact matching
pub fn get_gsc_data_for_path(path: &str) -> Option<(i32, i32, i32)> {
    let cache = GSC_CACHE.lock().unwrap();

    // Normalize the input path
    let normalized_path = normalize_gsc_path(path);

    // Try exact match on normalized path
    cache
        .get(&normalized_path)
        .map(|metrics| (metrics.position, metrics.clicks, metrics.impressions))
}

/// Find the matching URL for a path using exact matching
pub fn get_matching_url(path: &str) -> Option<String> {
    let cache = GSC_CACHE.lock().unwrap();

    // Normalize the input path
    let normalized_path = normalize_gsc_path(path);

    // Try exact match
    if cache.contains_key(&normalized_path) {
        return Some(normalized_path);
    }

    None
}

/// Alternative: Get GSC data with more flexible matching options
pub fn get_gsc_data_for_path_with_options(
    path: &str,
    exact_match: bool,
) -> Option<(i32, i32, i32)> {
    let cache = GSC_CACHE.lock().unwrap();
    let normalized_path = normalize_gsc_path(path);

    if exact_match {
        // Strict exact matching
        cache
            .get(&normalized_path)
            .map(|metrics| (metrics.position, metrics.clicks, metrics.impressions))
    } else {
        // Try exact match first
        if let Some(metrics) = cache.get(&normalized_path) {
            return Some((metrics.position, metrics.clicks, metrics.impressions));
        }

        // Fallback: Try to match with or without www
        let alternatives = generate_path_alternatives(&normalized_path);
        for alt_path in alternatives {
            if let Some(metrics) = cache.get(&alt_path) {
                return Some((metrics.position, metrics.clicks, metrics.impressions));
            }
        }

        None
    }
}

/// Generate alternative path representations for matching
fn generate_path_alternatives(path: &str) -> Vec<String> {
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

pub fn gsc_position_match(path: &str) -> Option<i32> {
    get_gsc_data_for_path(path).map(|(pos, _, _)| pos)
}

pub fn gsc_impressions_match(path: &str) -> Option<i32> {
    get_gsc_data_for_path(path).map(|(_, _, imp)| imp)
}

pub fn gsc_clicks_match(path: &str) -> Option<i32> {
    get_gsc_data_for_path(path).map(|(_, clicks, _)| clicks)
}

// Helper function for log parsing
pub fn get_all_gsc_metrics(path: &str) -> (Option<i32>, Option<i32>, Option<i32>, Option<String>) {
    let cache = GSC_CACHE.lock().unwrap();
    let normalized_path = normalize_gsc_path(path);

    if let Some(metrics) = cache.get(&normalized_path) {
        (
            Some(metrics.position),
            Some(metrics.clicks),
            Some(metrics.impressions),
            Some(normalized_path),
        )
    } else {
        (None, None, None, None)
    }
}

/// Check if GSC data is loaded
#[tauri::command]
pub fn is_gsc_loaded() -> bool {
    let loaded = GSC_LOADED.lock().unwrap();
    *loaded
}

/// Get all cached GSC URLs (for debugging)
#[tauri::command]
pub fn get_cached_gsc_urls() -> Vec<String> {
    let cache = GSC_CACHE.lock().unwrap();
    cache.keys().cloned().collect()
}

/// Test URL matching function
#[tauri::command]
pub fn test_gsc_matching(test_url: &str) -> String {
    let normalized = normalize_gsc_path(test_url);
    let cache = GSC_CACHE.lock().unwrap();

    if cache.contains_key(&normalized) {
        format!("Exact match found for normalized path: {}", normalized)
    } else {
        format!("No exact match for normalized path: {}", normalized)
    }
}
