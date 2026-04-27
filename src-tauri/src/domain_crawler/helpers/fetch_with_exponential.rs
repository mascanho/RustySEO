use std::time::Duration;
use reqwest::Client;
use tokio::time::{sleep, Instant};
use rand::seq::IndexedRandom;

use crate::settings::settings::Settings;

// Fetch URL with exponential backoff
pub async fn fetch_with_exponential_backoff(
    client: &Client,
    url: &str,
    settings: &Settings,
) -> Result<(reqwest::Response, f64), reqwest::Error> {
    let mut attempt = 0;
    loop {
        let start = Instant::now();
        
        let request_builder = client.get(url);

        match request_builder.send().await {
            Ok(response) => {
                let duration = start.elapsed().as_secs_f64();
                let status = response.status();

                if status == reqwest::StatusCode::TOO_MANY_REQUESTS 
                    || status == reqwest::StatusCode::SERVICE_UNAVAILABLE 
                    || status == reqwest::StatusCode::FORBIDDEN {
                    if attempt >= settings.max_retries {
                        return Ok((response, duration));
                    }

                    // Respect Retry-After header if present
                    let retry_after = response.headers()
                        .get(reqwest::header::RETRY_AFTER)
                        .and_then(|v| v.to_str().ok())
                        .and_then(|s| {
                            // Can be either seconds or a HTTP date
                            s.parse::<u64>().ok().map(|secs| Duration::from_secs(secs))
                            // Handle date parsing if needed, but seconds is most common for 429
                        });

                    let delay = if let Some(ra_duration) = retry_after {
                        // Respect server's Retry-After but enforce a floor
                        ra_duration.max(Duration::from_secs(2))
                    } else {
                        // Exponential backoff: base * 2^attempt, with a minimum floor of 2s
                        // Use saturating_mul to avoid overflow
                        let effective_base = settings.base_delay.max(1000); // At least 1s base
                        let backoff = effective_base.saturating_mul(2u64.saturating_pow(attempt as u32));
                        let capped = std::cmp::min(settings.max_delay.max(10000), backoff);
                        Duration::from_millis(capped.max(2000)) // Never less than 2s for 429
                    };

                    tracing::warn!("Rate limited ({}). Retrying in {:?} (Attempt {})", status, delay, attempt + 1);
                    sleep(delay).await;
                    attempt += 1;
                    continue;
                }
                return Ok((response, duration));
            }
            Err(e) => {
                if attempt >= settings.max_retries {
                    return Err(e);
                }
                let delay = Duration::from_millis(std::cmp::min(
                    settings.max_delay,
                    settings.base_delay * 2u64.pow(attempt as u32),
                ));
                tracing::warn!("Request error: {}. Retrying in {:?} (Attempt {})", e, delay, attempt + 1);
                sleep(delay).await;
                attempt += 1;
            }
        }
    }
}
