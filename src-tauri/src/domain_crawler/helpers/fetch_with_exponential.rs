use std::time::Duration;

use reqwest::Client;
use tokio::time::{sleep, Instant};

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
        match client.get(url).send().await {
            Ok(response) => {
                let duration = start.elapsed().as_secs_f64();
                if response.status() == reqwest::StatusCode::TOO_MANY_REQUESTS {
                    if attempt >= settings.max_retries {
                        return Ok((response, duration));
                    }
                    let delay = std::cmp::min(
                        settings.max_delay,
                        settings.base_delay * 2u64.pow(attempt as u32),
                    );
                    sleep(Duration::from_millis(delay)).await;
                    attempt += 1;
                    continue;
                }
                return Ok((response, duration));
            }
            Err(e) => {
                if attempt >= settings.max_retries {
                    return Err(e);
                }
                let delay = std::cmp::min(
                    settings.max_delay,
                    settings.base_delay * 2u64.pow(attempt as u32),
                );
                sleep(Duration::from_millis(delay)).await;
                attempt += 1;
            }
        }
    }
}
