use anyhow::Error;
use serde::{Deserialize, Serialize};
use strsim::jaro_winkler;
use tracing::{debug, error, info, warn};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GscDataItem {
    pub query: String,
    pub clicks: u32,
    pub ctr: f32,
    pub date: String, // You might want to use chrono::DateTime if you need to parse dates
    pub id: i64,
    pub impressions: u32,
    pub position: f32,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GscQueryMatch {
    pub url: String,
    pub matches: Vec<GscMatch>,
    pub total_matches: usize,
    pub confidence_score: f32,
    pub top_queries: Vec<String>, // Added for convenience
    pub total_clicks: u32,
    pub total_impressions: u32,
    pub avg_ctr: f32,
    pub avg_position: f32,
}

#[derive(Debug, Serialize, Deserialize, Clone)] // Added Clone
pub struct GscMatch {
    pub query: String,
    pub clicks: u32,
    pub impressions: u32,
    pub ctr: f32,
    pub position: f32,
    pub similarity_score: f32,
    pub source_url: String,
}

pub fn match_gsc_query(data: Vec<GscDataItem>, url: &str) -> Result<GscQueryMatch, Error> {
    tracing::info!("Received {} GSC items for URL: {}", data.len(), url);

    // Process the actual data
    let matches: Vec<GscMatch> = data
        .iter()
        .filter_map(|item| {
            // Check if this GSC item is relevant to the target URL
            let similarity = calculate_url_similarity(&item.url, url);

            if similarity > 0.8 {
                Some(GscMatch {
                    query: item.query.clone(),
                    clicks: item.clicks,
                    impressions: item.impressions,
                    ctr: item.ctr,
                    position: item.position,
                    similarity_score: similarity,
                    source_url: item.url.clone(),
                })
            } else {
                None
            }
        })
        .collect();

    // Get total matches BEFORE using matches
    let total_matches = matches.len();

    // Get top queries
    let top_queries: Vec<String> = matches.iter().take(5).map(|m| m.query.clone()).collect();

    // Calculate confidence score
    let confidence_score = if !matches.is_empty() {
        let avg_similarity: f32 =
            matches.iter().map(|m| m.similarity_score).sum::<f32>() / matches.len() as f32;
        avg_similarity
    } else {
        0.0
    };

    let total_clicks: f32 = matches.iter().map(|m| m.clicks as f32).sum();
    let total_impressions: f32 = matches.iter().map(|m| m.impressions as f32).sum();

    let avg_ctr = if total_impressions > 0.0 {
        (total_clicks / total_impressions) * 100.0
    } else {
        0.0
    };

    let avg_position = if !matches.is_empty() {
        matches.iter().map(|m| m.position).sum::<f32>() / matches.len() as f32
    } else {
        0.0
    };

    Ok(GscQueryMatch {
        url: url.to_string(),
        matches,       // This moves matches into the struct
        total_matches, // Use the pre-calculated value
        confidence_score,
        top_queries,
        total_clicks: total_clicks as u32,
        total_impressions: total_impressions as u32,
        avg_ctr,
        avg_position,
    })
}

fn normalize_url(url_str: &str) -> String {
    let mut normalized_path = String::new();

    if let Ok(url) = url::Url::parse(url_str) {
        // If it's a valid absolute URL, take its path and query
        normalized_path = url.path().to_string();
        if let Some(query) = url.query() {
            normalized_path.push('?');
            normalized_path.push_str(query);
        }
    } else {
        // If it's not a valid absolute URL, assume it's already a path-like string
        normalized_path = url_str.to_string();
    }

    // Ensure path starts with '/'
    if !normalized_path.starts_with('/') {
        normalized_path.insert(0, '/');
    }

    // Remove trailing slash if present, unless it's just "/"
    if normalized_path.len() > 1 && normalized_path.ends_with('/') {
        normalized_path.pop();
    }

    // Convert to lowercase for case-insensitive comparison
    normalized_path.to_lowercase()
}

fn calculate_url_similarity(gsc_url: &str, target_url: &str) -> f32 {
    let gsc_norm = normalize_url(gsc_url);
    let target_norm = normalize_url(target_url);

    tracing::info!("Normalized GSC URL: {}", gsc_norm);
    tracing::info!("Normalized Target URL: {}", target_norm);
    tracing::error!("Target URL: {}", target_url);
    tracing::debug!("GSC URL: {}", gsc_url);

    jaro_winkler(&gsc_norm, &target_norm) as f32
}
