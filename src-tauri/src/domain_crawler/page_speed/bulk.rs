use crate::{
    domain_crawler::page_speed::model::{LighthouseResult, PsiResponse},
    Settings,
};
use reqwest::Client;
use serde_json::Value;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{sleep, timeout, Duration, Instant};
use url::Url;

use lazy_static::lazy_static;

pub enum PageSpeedStrategy {
    Mobile,
    Desktop,
}

const STRATEGIES: &[PageSpeedStrategy] = &[PageSpeedStrategy::Mobile, PageSpeedStrategy::Desktop];

// Circuit breaker to track rate limit state
struct CircuitBreaker {
    consecutive_failures: u32,
    last_failure_time: Option<Instant>,
    backoff_until: Option<Instant>,
}

impl CircuitBreaker {
    fn new() -> Self {
        Self {
            consecutive_failures: 0,
            last_failure_time: None,
            backoff_until: None,
        }
    }

    fn is_open(&self) -> bool {
        if let Some(backoff_until) = self.backoff_until {
            if Instant::now() < backoff_until {
                return true;
            }
        }
        false
    }

    fn record_success(&mut self) {
        self.consecutive_failures = 0;
        self.last_failure_time = None;
        self.backoff_until = None;
    }

    fn record_failure(&mut self) {
        self.consecutive_failures += 1;
        self.last_failure_time = Some(Instant::now());

        // Progressive backoff: 5s, 10s, 20s, 30s, 60s
        let backoff_secs = match self.consecutive_failures {
            1..=2 => 5,
            3..=4 => 10,
            5..=6 => 20,
            7..=8 => 30,
            _ => 60,
        };

        self.backoff_until = Some(Instant::now() + Duration::from_secs(backoff_secs));
    }

    fn should_skip(&self) -> bool {
        self.is_open() || self.consecutive_failures >= 10
    }
}

lazy_static! {
    static ref HTTP_CLIENT: Client = Client::builder()
        .timeout(Duration::from_secs(45))
        .connect_timeout(Duration::from_secs(10))
        .build()
        .expect("Failed to create HTTP client");
    static ref CIRCUIT_BREAKER: Arc<Mutex<CircuitBreaker>> =
        Arc::new(Mutex::new(CircuitBreaker::new()));
}

async fn fetch_psi_with_retry(
    url: &str,
    strategy_str: &str,
    api_key: &str,
    max_retries: u32,
) -> Result<Value, String> {
    // Check circuit breaker first
    {
        let breaker = CIRCUIT_BREAKER.lock().await;
        if breaker.should_skip() {
            let wait_time = if let Some(backoff_until) = breaker.backoff_until {
                let remaining = backoff_until.saturating_duration_since(Instant::now());
                format!("{:.1}s", remaining.as_secs_f32())
            } else {
                "unknown".to_string()
            };
            return Err(format!(
                "Circuit breaker open (too many failures), waiting {}",
                wait_time
            ));
        }
    }

    let api_url = format!(
        "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={}&strategy={}&key={}",
        url, strategy_str, api_key
    );

    let mut last_error = String::new();

    for attempt in 0..max_retries {
        let response = match HTTP_CLIENT.get(&api_url).send().await {
            Ok(resp) => resp,
            Err(e) => {
                last_error = format!("Request failed: {}", e);
                if attempt < max_retries - 1 {
                    sleep(Duration::from_millis(1000 * (attempt as u64 + 1))).await;
                    continue;
                }
                return Err(last_error);
            }
        };

        let status = response.status();

        // Handle rate limiting (HTTP 429)
        if status.as_u16() == 429 {
            let mut breaker = CIRCUIT_BREAKER.lock().await;
            breaker.record_failure();
            drop(breaker);

            if attempt < max_retries - 1 {
                let delay = Duration::from_secs(3u64.pow(attempt + 1)); // 3s, 9s, 27s
                eprintln!(
                    "Rate limited for {} ({}), retry {}/{} in {:?}",
                    url,
                    strategy_str,
                    attempt + 1,
                    max_retries,
                    delay
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
            last_error = format!("HTTP {}", status);
            if attempt < max_retries - 1 {
                sleep(Duration::from_millis(1500 * (attempt as u64 + 1))).await;
                continue;
            }
            return Err(format!(
                "Request failed with status {} after {} attempts",
                status, max_retries
            ));
        }

        let response_body = match response.bytes().await {
            Ok(body) => body,
            Err(e) => {
                last_error = format!("Failed to read response: {}", e);
                if attempt < max_retries - 1 {
                    sleep(Duration::from_millis(1000)).await;
                    continue;
                }
                return Err(last_error);
            }
        };

        let value: Value = match serde_json::from_slice(&response_body) {
            Ok(v) => v,
            Err(e) => {
                last_error = format!("Failed to parse JSON: {}", e);
                if attempt < max_retries - 1 {
                    sleep(Duration::from_millis(1000)).await;
                    continue;
                }
                return Err(last_error);
            }
        };

        // Check for API errors
        if let Some(error) = value.get("error") {
            let error_str = error.to_string();
            if error_str.contains("rateLimitExceeded") || error_str.contains("quotaExceeded") {
                let mut breaker = CIRCUIT_BREAKER.lock().await;
                breaker.record_failure();
                drop(breaker);

                if attempt < max_retries - 1 {
                    let delay = Duration::from_secs(3u64.pow(attempt + 1));
                    eprintln!(
                        "API quota error for {} ({}), retry {}/{} in {:?}",
                        url,
                        strategy_str,
                        attempt + 1,
                        max_retries,
                        delay
                    );
                    sleep(delay).await;
                    continue;
                }
                return Err(format!("API quota exceeded: {}", error));
            }
            return Err(format!("API error: {}", error));
        }

        // Success! Update circuit breaker
        {
            let mut breaker = CIRCUIT_BREAKER.lock().await;
            breaker.record_success();
        }

        return value
            .get("lighthouseResult")
            .cloned()
            .ok_or_else(|| "No lighthouseResult in response".to_string());
    }

    Err(format!("Max retries exceeded: {}", last_error))
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

    // Check if circuit breaker is open
    {
        let breaker = CIRCUIT_BREAKER.lock().await;
        if breaker.should_skip() {
            eprintln!("Skipping PSI for {} - circuit breaker open", url);
            return Ok(vec![]); // Return empty instead of error
        }
    }

    let max_retries = 3;
    let mut results = Vec::new();
    let mut errors = Vec::new();

    // Fetch both strategies sequentially with delay
    for strategy in STRATEGIES {
        let strategy_str = match strategy {
            PageSpeedStrategy::Mobile => "mobile",
            PageSpeedStrategy::Desktop => "desktop",
        };

        let result = timeout(
            Duration::from_secs(90), // Longer timeout to allow for retries
            fetch_psi_with_retry(&url.to_string(), strategy_str, api_key, max_retries),
        )
        .await;

        match result {
            Ok(Ok(value)) => {
                results.push(value);
            }
            Ok(Err(e)) => {
                eprintln!("PSI fetch failed for {} ({}): {}", url, strategy_str, e);
                errors.push(format!("{}: {}", strategy_str, e));
            }
            Err(_) => {
                eprintln!("PSI fetch timed out for {} ({})", url, strategy_str);
                errors.push(format!("{}: timeout", strategy_str));
            }
        }

        // Small delay between strategies
        if results.len() + errors.len() < STRATEGIES.len() {
            sleep(Duration::from_millis(800)).await;
        }
    }

    // Return whatever results we got (even if partial)
    if !results.is_empty() {
        if !errors.is_empty() {
            eprintln!("Partial PSI success for {}: {:?}", url, errors);
        }
        Ok(results)
    } else if !errors.is_empty() {
        // All failed but return empty vec to not block crawl
        eprintln!("All PSI strategies failed for {}: {:?}", url, errors);
        Ok(vec![])
    } else {
        Ok(vec![])
    }
}

/// Reset the circuit breaker (useful for testing or manual intervention)
pub async fn reset_circuit_breaker() {
    let mut breaker = CIRCUIT_BREAKER.lock().await;
    *breaker = CircuitBreaker::new();
    eprintln!("PSI circuit breaker reset");
}

/// Get current circuit breaker status
pub async fn get_circuit_breaker_status() -> String {
    let breaker = CIRCUIT_BREAKER.lock().await;
    if breaker.should_skip() {
        format!(
            "OPEN (failures: {}, backoff until: {:?})",
            breaker.consecutive_failures,
            breaker
                .backoff_until
                .map(|t| t.saturating_duration_since(Instant::now()))
        )
    } else if breaker.consecutive_failures > 0 {
        format!("HALF-OPEN (failures: {})", breaker.consecutive_failures)
    } else {
        "CLOSED (healthy)".to_string()
    }
}
