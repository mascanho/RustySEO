use reqwest;
use serde::Serialize;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::time::sleep;

#[derive(Serialize, Clone, Debug)]
pub struct UrlCheckResult {
    url: String,
    status: Option<u16>,
    error: Option<String>,
    timestamp: u64,
    response_time_ms: Option<u64>,
}

// Always check once, let frontend handle polling
pub async fn http_check(urls: Vec<String>, interval: u64) -> Vec<UrlCheckResult> {
    let mut results = Vec::new();

    for url in urls {
        if interval > 0 && !results.is_empty() {
            sleep(Duration::from_secs(interval)).await;
        }

        let start_time = SystemTime::now();
        let timestamp = start_time
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;

        match reqwest::get(&url).await {
            Ok(response) => {
                let status = response.status();
                let end_time = SystemTime::now();
                let response_time_ms = end_time
                    .duration_since(start_time)
                    .unwrap_or_default()
                    .as_millis() as u64;

                results.push(UrlCheckResult {
                    url: url.clone(),
                    status: Some(status.as_u16()),
                    error: None,
                    timestamp,
                    response_time_ms: Some(response_time_ms),
                });
            }
            Err(err) => {
                let end_time = SystemTime::now();
                let response_time_ms = end_time
                    .duration_since(start_time)
                    .unwrap_or_default()
                    .as_millis() as u64;

                results.push(UrlCheckResult {
                    url: url.clone(),
                    status: None,
                    error: Some(err.to_string()),
                    timestamp,
                    response_time_ms: Some(response_time_ms),
                });
            }
        }
    }

    dbg!(&results);
    results
}

#[tauri::command]
pub async fn check_url(urls: Vec<String>, interval: u64) -> Vec<UrlCheckResult> {
    http_check(urls, interval).await
}
