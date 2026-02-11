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
        
        let mut request_builder = client.get(url);

        // Add some common headers to look more like a browser
        request_builder = request_builder
            .header(reqwest::header::ACCEPT, "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7")
            .header(reqwest::header::ACCEPT_LANGUAGE, "en-US,en;q=0.9")
            .header(reqwest::header::UPGRADE_INSECURE_REQUESTS, "1")
            .header(reqwest::header::CACHE_CONTROL, "max-age=0");

        match request_builder.send().await {
            Ok(response) => {
                let duration = start.elapsed().as_secs_f64();
                let status = response.status();

                if status == reqwest::StatusCode::TOO_MANY_REQUESTS || status == reqwest::StatusCode::SERVICE_UNAVAILABLE {
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
                        ra_duration
                    } else {
                        Duration::from_millis(std::cmp::min(
                            settings.max_delay,
                            settings.base_delay * 2u64.pow(attempt as u32),
                        ))
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
