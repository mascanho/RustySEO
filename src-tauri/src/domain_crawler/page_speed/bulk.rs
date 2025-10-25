use crate::{
    domain_crawler::page_speed::model::{LighthouseResult, PsiResponse},
    Settings,
};
use futures::future::try_join_all;
use reqwest::Client;
use serde_json::Value;
use url::Url;

// Add this at the top of your file
use lazy_static::lazy_static;
use tokio::time::{sleep, Duration};

pub enum PageSpeedStrategy {
    Mobile,
    Desktop,
}

const STRATEGIES: &[PageSpeedStrategy] = &[PageSpeedStrategy::Mobile, PageSpeedStrategy::Desktop];

// Initialize the HTTP client once
lazy_static! {
    static ref HTTP_CLIENT: Client = Client::new();
}

async fn fetch_psi_with_retry(
    url: &str,
    strategy_str: &str,
    api_key: &str,
    max_retries: u32,
) -> Result<Value, String> {
    let api_url = format!(
        "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={}&strategy={}&key={}",
        url, strategy_str, api_key
    );

    for attempt in 0..max_retries {
        let response = HTTP_CLIENT
            .get(&api_url)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        let status = response.status();

        // Handle rate limiting (HTTP 429)
        if status.as_u16() == 429 {
            if attempt < max_retries - 1 {
                let delay = Duration::from_secs(2u64.pow(attempt + 1)); // Exponential backoff: 2s, 4s, 8s
                eprintln!(
                    "Rate limited for {} ({}). Retrying in {:?}...",
                    url, strategy_str, delay
                );
                sleep(delay).await;
                continue;
            } else {
                return Err(format!(
                    "Rate limited after {} attempts for {} ({})",
                    max_retries, url, strategy_str
                ));
            }
        }

        // Handle other non-success status codes
        if !status.is_success() {
            if attempt < max_retries - 1 {
                let delay = Duration::from_millis(500 * (attempt as u64 + 1));
                eprintln!(
                    "Request failed with status {} for {} ({}). Retrying in {:?}...",
                    status, url, strategy_str, delay
                );
                sleep(delay).await;
                continue;
            } else {
                return Err(format!(
                    "Request failed with status {} after {} attempts",
                    status, max_retries
                ));
            }
        }

        let response_body = response
            .bytes()
            .await
            .map_err(|e| format!("Failed to read response body: {}", e))?;

        let value: Value = serde_json::from_slice(&response_body)
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        if let Some(error) = value.get("error") {
            // Check if it's a quota/rate limit error in the response body
            let error_str = error.to_string();
            if error_str.contains("rateLimitExceeded") || error_str.contains("quotaExceeded") {
                if attempt < max_retries - 1 {
                    let delay = Duration::from_secs(2u64.pow(attempt + 1));
                    eprintln!(
                        "API quota/rate limit error for {} ({}). Retrying in {:?}...",
                        url, strategy_str, delay
                    );
                    sleep(delay).await;
                    continue;
                } else {
                    return Err(format!(
                        "API quota/rate limit exceeded after {} attempts: {}",
                        max_retries, error
                    ));
                }
            }
            return Err(format!("API error: {}", error));
        }

        return value
            .get("lighthouseResult")
            .cloned()
            .ok_or("No lighthouseResult in response".to_string());
    }

    Err("Max retries exceeded".to_string())
}

pub async fn fetch_psi_bulk(url: Url, settings: &Settings) -> Result<Vec<Value>, String> {
    if !settings.page_speed_bulk {
        return Ok(vec![]);
    }

    let api_key = settings
        .page_speed_bulk_api_key
        .as_ref()
        .and_then(|inner| inner.as_deref())
        .ok_or("No PSI API key configured".to_string())?;

    let max_retries = 3;
    let mut results = Vec::new();

    // Make requests sequentially with a small delay to avoid rate limiting
    for strategy in STRATEGIES {
        let strategy_str = match strategy {
            PageSpeedStrategy::Mobile => "mobile",
            PageSpeedStrategy::Desktop => "desktop",
        };

        let result = tokio::time::timeout(
            Duration::from_secs(60),
            fetch_psi_with_retry(&url.to_string(), strategy_str, api_key, max_retries),
        )
        .await
        .map_err(|_| format!("PSI request timed out for {} ({})", url, strategy_str))??;

        results.push(result);

        // Add a small delay between requests to avoid rate limiting
        if results.len() < STRATEGIES.len() {
            sleep(Duration::from_millis(500)).await;
        }
    }

    Ok(results)
}
