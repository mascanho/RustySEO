use anyhow::Error;
use serde::{Deserialize, Serialize};
use tracing::{debug, error, info, warn};
use urlencoding::decode;

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
    let trimmed = url_str.trim().to_lowercase();

    let mut path_and_query = if let Ok(parsed_url) = url::Url::parse(&trimmed) {
        // If it's a valid absolute URL, take its path and query
        let path = parsed_url.path().to_string();
        let decoded_path = decode(&path).map(|d| d.into_owned()).unwrap_or(path);

        if let Some(query) = parsed_url.query() {
            let decoded_query = decode(query)
                .map(|d| d.into_owned())
                .unwrap_or(query.to_string());
            format!("{}?{}", decoded_path, decoded_query)
        } else {
            decoded_path
        }
    } else {
        // If it's not a valid absolute URL, decode first then handle domain
        let decoded = decode(&trimmed).map(|d| d.into_owned()).unwrap_or(trimmed);

        if let Some(slash_pos) = decoded.find('/') {
            let prefix = &decoded[..slash_pos];
            if prefix.contains('.') && !prefix.contains(':') {
                decoded[slash_pos..].to_string()
            } else {
                decoded.to_string()
            }
        } else if decoded.contains('.') && !decoded.contains('/') {
            "/".to_string()
        } else {
            decoded.to_string()
        }
    };

    // Ensure path starts with '/'
    if !path_and_query.starts_with('/') {
        path_and_query.insert(0, '/');
    }

    // Remove trailing slash if present, unless it's just "/"
    if path_and_query.len() > 1 && path_and_query.ends_with('/') {
        path_and_query.pop();
    }

    path_and_query
}

fn calculate_url_similarity(gsc_url: &str, target_url: &str) -> f32 {
    let gsc_norm = normalize_url(gsc_url);
    let target_norm = normalize_url(target_url);

    tracing::info!("Normalized GSC URL: {}", gsc_norm);
    tracing::info!("Normalized Target URL: {}", target_norm);

    if gsc_norm == target_norm {
        1.0
    } else {
        0.0
    }
}
