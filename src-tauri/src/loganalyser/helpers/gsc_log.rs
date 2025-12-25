use once_cell::sync::Lazy;
use rusqlite::Connection;
use std::collections::HashMap;
use std::sync::Mutex;

// Store GSC data in memory for fast access
// Store only metrics, not the URL again
static GSC_CACHE: Lazy<Mutex<HashMap<String, GscMetrics>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

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
        println!("Loaded GSC entry: {:?}", &entry.url);

        cache.insert(
            entry.url,
            GscMetrics {
                position: entry.position,
                clicks: entry.clicks,
                impressions: entry.impressions,
            },
        );
    }

    println!("Loaded {} GSC entries from database", cache.len());

    match cache.len() {
        0 => Ok(GscMessage {
            message: Message::NotLoaded,
        }),
        _ => Ok(GscMessage {
            message: Message::Loaded,
        }),
    }
}

/// Normalize path for GSC matching
fn normalize_gsc_path(path: &str) -> String {
    let mut normalized = path.to_string();

    // Remove query parameters
    if let Some(pos) = normalized.find('?') {
        normalized = normalized[..pos].to_string();
    }

    // Remove fragments
    if let Some(pos) = normalized.find('#') {
        normalized = normalized[..pos].to_string();
    }

    // Remove protocol and domain if present
    if let Some(pos) = normalized.find("://") {
        normalized = normalized
            .split_at(pos + 3)
            .1
            .splitn(2, '/')
            .nth(1)
            .unwrap_or("")
            .to_string();
    }

    // Ensure it starts with /
    if !normalized.starts_with('/') && !normalized.is_empty() {
        normalized = format!("/{}", normalized);
    }

    // Remove trailing slash (except for root)
    if normalized != "/" {
        normalized = normalized.trim_end_matches('/').to_string();
    }

    normalized
}

/// Get GSC data for a specific path
pub fn get_gsc_data_for_path(path: &str) -> Option<(i32, i32, i32)> {
    let cache = GSC_CACHE.lock().unwrap();

    // Try exact match first
    if let Some(metrics) = cache.get(path) {
        return Some((metrics.position, metrics.clicks, metrics.impressions));
    }

    // Try normalizing the path
    let normalized_path = normalize_gsc_path(path);
    if let Some(metrics) = cache.get(&normalized_path) {
        return Some((metrics.position, metrics.clicks, metrics.impressions));
    }

    // Try to find partial matches
    for (key, metrics) in cache.iter() {
        if path.contains(key) || key.contains(path) {
            return Some((metrics.position, metrics.clicks, metrics.impressions));
        }
    }

    None
}

/// Find the matching URL for a path
pub fn get_matching_url(path: &str) -> Option<String> {
    let cache = GSC_CACHE.lock().unwrap();

    // Try exact match
    if cache.contains_key(path) {
        return Some(path.to_string());
    }

    // Try normalized path
    let normalized_path = normalize_gsc_path(path);
    if cache.contains_key(&normalized_path) {
        return Some(normalized_path);
    }

    // Try partial matches
    for key in cache.keys() {
        if path.contains(key) || key.contains(path) {
            return Some(key.clone());
        }
    }

    None
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
    let metrics = get_gsc_data_for_path(path);
    let url = get_matching_url(path);

    match metrics {
        Some((pos, clicks, imp)) => (Some(pos), Some(clicks), Some(imp), url),
        None => (None, None, None, url),
    }
}
