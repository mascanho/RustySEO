use anyhow::Error;
use serde::{Deserialize, Serialize};

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
    println!("Received {} GSC items for URL: {}", data.len(), url);

    // Process the actual data
    let matches: Vec<GscMatch> = data
        .iter()
        .filter_map(|item| {
            // Check if this GSC item is relevant to the target URL
            let similarity = calculate_url_similarity(&item.url, url);

            if similarity > 0.3 {
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

    Ok(GscQueryMatch {
        url: url.to_string(),
        matches,       // This moves matches into the struct
        total_matches, // Use the pre-calculated value
        confidence_score,
        top_queries,
    })
}
fn calculate_url_similarity(gsc_url: &str, target_url: &str) -> f32 {
    // Simple URL similarity calculation
    // You can implement more sophisticated logic here
    let gsc_lower = gsc_url.to_lowercase();
    let target_lower = target_url.to_lowercase();

    if gsc_lower == target_lower {
        return 1.0;
    }

    if gsc_lower.contains(&target_lower) || target_lower.contains(&gsc_lower) {
        return 0.8;
    }

    // Check for partial matches
    let gsc_parts: Vec<&str> = gsc_lower.split('/').collect();
    let target_parts: Vec<&str> = target_lower.split('/').collect();

    let common_parts = gsc_parts
        .iter()
        .filter(|&part| target_parts.contains(part))
        .count();

    let total_parts = gsc_parts.len().max(target_parts.len());

    if total_parts > 0 {
        common_parts as f32 / total_parts as f32
    } else {
        0.0
    }
}
