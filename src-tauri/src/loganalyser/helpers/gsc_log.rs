use once_cell::sync::Lazy;
use rusqlite::Connection;
use std::collections::HashMap;
use std::sync::Mutex;

// Store GSC data in memory for fast access
static GSC_CACHE: Lazy<Mutex<HashMap<String, (i32, i32, i32)>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

/// Load GSC data from database and cache it
#[tauri::command]
pub fn load_gsc_from_database() -> Result<Vec<String>, String> {
    use crate::uploads::storage::Storage;

    // Get database connection (adjust based on your setup)
    let db = Storage::new("gsc_excel.db").map_err(|e| e.to_string())?;

    // Fetch all GSC data from database
    let gsc_entries = db.get_all_gsc_data().map_err(|e| e.to_string())?;

    // Store in cache
    let mut cache = GSC_CACHE.lock().unwrap();
    cache.clear();

    for entry in gsc_entries {
        // Use url as key, store (position, clicks, impressions) as value
        cache.insert(
            entry.url.clone(),
            (entry.position, entry.clicks, entry.impressions),
        );
    }

    Ok(vec![format!(
        "Loaded {} GSC entries from database",
        cache.len()
    )])
}

/// Get GSC data for a specific path
pub fn get_gsc_data_for_path(path: &str) -> (i32, i32, i32) {
    let cache = GSC_CACHE.lock().unwrap();

    // Try exact match first
    if let Some(&(pos, clicks, impressions)) = cache.get(path) {
        return (pos, clicks, impressions);
    }

    // Try normalizing the path for better matching
    let normalized_path = normalize_gsc_path(path);
    if let Some(&(pos, clicks, impressions)) = cache.get(&normalized_path) {
        return (pos, clicks, impressions);
    }

    // Try to find partial matches
    for (key, &value) in cache.iter() {
        if path.contains(key) || key.contains(path) {
            return value;
        }
    }

    // Default values if no match found
    (0, 0, 0)
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

// Your existing gsc_position_match function - now uses database data
pub fn gsc_position_match(path: &str) -> i32 {
    let (position, _, _) = get_gsc_data_for_path(path);
    position
}
