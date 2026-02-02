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

// Much more conservative circuit breaker
struct CircuitBreaker {
    consecutive_failures: u32,
    last_failure_time: Option<Instant>,
    backoff_until: Option<Instant>,
    total_requests: u32,
    successful_requests: u32,
    last_request_time: Option<Instant>,
}

impl CircuitBreaker {
    fn new() -> Self {
        Self {
            consecutive_failures: 0,
            last_failure_time: None,
            backoff_until: None,
            total_requests: 0,
            successful_requests: 0,
            last_request_time: None,
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
        self.total_requests += 1;
        self.successful_requests += 1;
        self.last_request_time = Some(Instant::now());
    }

    fn record_failure(&mut self) {
        self.consecutive_failures += 1;
        self.total_requests += 1;
        self.last_failure_time = Some(Instant::now());

        // Much more conservative backoff - only backoff after multiple failures
        if self.consecutive_failures >= 3 {
            let backoff_secs = match self.consecutive_failures {
                3 => 5,   // 5 seconds
                4 => 10,  // 10 seconds
                5 => 30,  // 30 seconds
                6 => 60,  // 1 minute
                7 => 300, // 5 minutes
                _ => 600, // 10 minutes
            };
            self.backoff_until = Some(Instant::now() + Duration::from_secs(backoff_secs));
        }
    }

    fn should_skip(&self) -> bool {
        // Only skip if we have significant consecutive failures AND backoff is active
        self.is_open() && self.consecutive_failures >= 10
    }

    fn success_rate(&self) -> f64 {
        if self.total_requests == 0 {
            1.0
        } else {
            self.successful_requests as f64 / self.total_requests as f64
        }
    }

    // Enforce minimum delay between requests to avoid rate limiting
    async fn enforce_rate_limit(&self) {
        if let Some(last_request) = self.last_request_time {
            let elapsed = last_request.elapsed();
            // PSI API has limits - enforce at least 500ms between requests
            if elapsed < Duration::from_millis(500) {
                sleep(Duration::from_millis(500) - elapsed).await;
            }
        }
    }
}

lazy_static! {
    static ref HTTP_CLIENT: Client = Client::builder()
        .timeout(Duration::from_secs(30))
        .connect_timeout(Duration::from_secs(10))
        .pool_idle_timeout(Duration::from_secs(30))
        .build()
        .expect("Failed to create HTTP client");
    static ref CIRCUIT_BREAKER: Arc<Mutex<CircuitBreaker>> =
        Arc::new(Mutex::new(CircuitBreaker::new()));
}

// Validation function to check if a URL should be analyzed with PSI
fn should_analyze_with_psi(url: &Url) -> bool {
    // Skip non-HTTP/HTTPS URLs
    if url.scheme() != "http" && url.scheme() != "https" {
        return false;
    }

    // Get the path
    let path = url.path();

    // Check if it's a homepage/root
    if path.is_empty() || path == "/" {
        return true;
    }

    // Skip common non-content paths (Blacklist)
    let skip_patterns = [
        "/login",
        "/signup",
        "/register",
        "/logout",
        "/admin",
        "/dashboard",
        "/account",
        "/cart",
        "/checkout",
        "/api/",
        "/webhook/",
        "/oauth/",
        "/auth/",
        "/search",
        "/wp-admin",
        "/wp-login",
        "/wp-json",
        "/graphql",
        "/socket.io",
        "/_next/",
        "/static/",
        "/assets/",
        "/cdn/",
        "/media/",
        "/uploads/",
        "/private/",
        "/secure/",
        "/member/",
        "/user/",
        "/profile/",
        "/settings/",
        "/billing/",
        "/payment/",
        "/invoice/",
        "/order/",
        "/ajax/",
        "/rpc/",
        "/ws/",
        "/wss/",
        "/websocket/",
    ];

    for pattern in skip_patterns.iter() {
        if path.starts_with(pattern) {
            return false;
        }
    }

    // Skip file extensions that aren't typical web pages
    let invalid_extensions = [
        ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".ico", ".webp", ".mp4", ".mp3", ".avi",
        ".mov", ".wav", ".flac", ".ogg", ".webm", ".zip", ".tar", ".gz", ".rar", ".7z", ".bz2",
        ".exe", ".dmg", ".pkg", ".msi", ".deb", ".rpm", ".doc", ".docx", ".xls", ".xlsx", ".ppt",
        ".pptx", ".txt", ".rtf", ".csv", ".json", ".xml", ".yml", ".yaml", ".js", ".css", ".map",
        ".woff", ".woff2", ".ttf", ".eot", ".sql", ".db", ".sqlite", ".mdb", ".psd", ".ai", ".eps",
        ".indd", ".iso", ".bin", ".dmg", ".img",
    ];

    for ext in invalid_extensions.iter() {
        if path.to_lowercase().ends_with(ext) {
            return false;
        }
    }

    // Skip URLs with query parameters that indicate non-content pages
    if let Some(query) = url.query() {
        let query_lower = query.to_lowercase();
        let skip_queries = [
            "logout",
            "action=logout",
            "action=delete",
            "action=edit",
            "download=",
            "format=json",
            "format=xml",
            "api_key=",
            "token=",
            "auth=",
            "password=",
            "secret=",
            "key=",
            "callback=",
            "redirect=",
            "return=",
            "next=",
            "ajax=",
            "rpc=",
            "method=",
            "cmd=",
            "command=",
            "file=",
            "attachment=",
            "stream=",
            "export=",
            "print=",
            "pdf=",
            "csv=",
            "excel=",
        ];

        for skip_query in skip_queries.iter() {
            if query_lower.contains(skip_query) {
                return false;
            }
        }

        // Skip URLs with session/token parameters (common in authenticated areas)
        if query_lower.contains("session")
            || query_lower.contains("token")
            || query_lower.contains("auth")
            || query_lower.contains("oauth")
            || query_lower.contains("jwt")
        {
            return false;
        }
    }

    // Skip URLs with fragments that might indicate non-content
    if let Some(fragment) = url.fragment() {
        let fragment_lower = fragment.to_lowercase();
        if fragment_lower.contains("comment")
            || fragment_lower.contains("reply")
            || fragment_lower.starts_with("modal")
            || fragment_lower.starts_with("popup")
        {
            return false;
        }
    }

    // Default to true for any other URL, assuming the caller has already filtered non-HTML content
    true
}

async fn fetch_psi_with_retry(
    url: &str,
    strategy_str: &str,
    api_key: &str,
    max_retries: u32,
) -> Result<Value, String> {
    // Enforce rate limiting between requests
    {
        let breaker = CIRCUIT_BREAKER.lock().await;
        breaker.enforce_rate_limit().await;
    }

    // Check circuit breaker - much more lenient now
    {
        let breaker = CIRCUIT_BREAKER.lock().await;
        if breaker.should_skip() && breaker.success_rate() < 0.3 {
            let wait_time = if let Some(backoff_until) = breaker.backoff_until {
                let remaining = backoff_until.saturating_duration_since(Instant::now());
                format!("{:.1}s", remaining.as_secs_f32())
            } else {
                "unknown".to_string()
            };
            return Err(format!(
                "Circuit breaker open ({} failures, {:.1}% success), waiting {}",
                breaker.consecutive_failures,
                breaker.success_rate() * 100.0,
                wait_time
            ));
        }
    }

    // Validate URL before making API call
    match Url::parse(url) {
        Ok(parsed_url) => {
            if !should_analyze_with_psi(&parsed_url) {
                return Err(format!(
                    "Skipping PSI for {} - not a valid content page",
                    url
                ));
            }
        }
        Err(e) => {
            return Err(format!("Invalid URL format for {}: {}", url, e));
        }
    }

    // Properly encode the URL for the API call
    let encoded_url = urlencoding::encode(url);
    let api_url = format!(
        "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={}&strategy={}&key={}&category=performance&category=accessibility&category=best-practices&category=seo&category=pwa",
        encoded_url, strategy_str, api_key
    );

    let mut last_error = String::new();
    let mut last_status = Option::<u16>::None;

    for attempt in 0..=max_retries {
        // Add delay between retries (except first attempt)
        if attempt > 0 {
            let delay = Duration::from_secs(3u64 * attempt as u64); // 3s, 6s, 9s
            eprintln!(
                "Retrying {} ({}) in {:?} (attempt {}/{})",
                url, strategy_str, delay, attempt, max_retries
            );
            sleep(delay).await;
        }

        let response = match HTTP_CLIENT.get(&api_url).send().await {
            Ok(resp) => resp,
            Err(e) => {
                last_error = format!("Request failed: {}", e);
                last_status = None;
                if attempt == max_retries {
                    let mut breaker = CIRCUIT_BREAKER.lock().await;
                    breaker.record_failure();
                }
                continue;
            }
        };

        let status = response.status();
        last_status = Some(status.as_u16());

        // Handle rate limiting and quota errors
        if status.as_u16() == 429 || status.as_u16() == 403 {
            let response_text = response.text().await.unwrap_or_default();

            eprintln!(
                "Rate limit/quota error for {} ({}): HTTP {} - {}",
                url, strategy_str, status, response_text
            );

            if attempt < max_retries {
                // For rate limits, use exponential backoff
                let delay = Duration::from_secs(5u64 * (attempt as u64 + 1));
                eprintln!("Waiting {:?} before retry", delay);
                sleep(delay).await;
                continue;
            } else {
                let mut breaker = CIRCUIT_BREAKER.lock().await;
                breaker.record_failure();
                return Err(format!(
                    "API quota/rate limit exceeded after {} attempts",
                    max_retries
                ));
            }
        }

        // Handle other non-success status codes
        if !status.is_success() {
            let response_text = response.text().await.unwrap_or_default();
            last_error = format!("HTTP {} - {}", status, response_text);

            if attempt < max_retries {
                // For other errors, retry with delay
                sleep(Duration::from_secs(2)).await;
                continue;
            } else {
                let mut breaker = CIRCUIT_BREAKER.lock().await;
                breaker.record_failure();
                return Err(format!(
                    "Request failed with status {} after {} attempts: {}",
                    status, max_retries, last_error
                ));
            }
        }

        let response_body = match response.bytes().await {
            Ok(body) => body,
            Err(e) => {
                last_error = format!("Failed to read response: {}", e);
                if attempt < max_retries {
                    continue;
                } else {
                    let mut breaker = CIRCUIT_BREAKER.lock().await;
                    breaker.record_failure();
                    return Err(last_error);
                }
            }
        };

        let value: Value = match serde_json::from_slice(&response_body) {
            Ok(v) => v,
            Err(e) => {
                last_error = format!("Failed to parse JSON: {}", e);
                if attempt < max_retries {
                    continue;
                } else {
                    let mut breaker = CIRCUIT_BREAKER.lock().await;
                    breaker.record_failure();
                    return Err(last_error);
                }
            }
        };

        // Check for API errors in response body
        if let Some(error) = value.get("error") {
            let error_message = error
                .get("message")
                .and_then(|m| m.as_str())
                .unwrap_or("Unknown API error");

            if error_message.contains("rateLimitExceeded")
                || error_message.contains("quotaExceeded")
                || error_message.contains("dailyLimitExceeded")
                || error_message.contains("userRateLimitExceeded")
            {
                eprintln!(
                    "API quota error for {} ({}): {}",
                    url, strategy_str, error_message
                );

                if attempt < max_retries {
                    let delay = Duration::from_secs(10u64 * (attempt as u64 + 1));
                    eprintln!("Waiting {:?} before retry", delay);
                    sleep(delay).await;
                    continue;
                } else {
                    let mut breaker = CIRCUIT_BREAKER.lock().await;
                    breaker.record_failure();
                    return Err(format!("API quota exceeded: {}", error_message));
                }
            }

            // For non-quota errors, don't retry immediately
            let mut breaker = CIRCUIT_BREAKER.lock().await;
            breaker.record_failure();
            return Err(format!("API error: {}", error_message));
        }

        // Check if we actually got lighthouse results
        if !value.get("lighthouseResult").is_some() {
            last_error = "No lighthouseResult in response".to_string();
            if attempt < max_retries {
                continue;
            } else {
                let mut breaker = CIRCUIT_BREAKER.lock().await;
                breaker.record_failure();
                return Err(last_error);
            }
        }

        // Success! Update circuit breaker
        {
            let mut breaker = CIRCUIT_BREAKER.lock().await;
            breaker.record_success();
        }

        return Ok(value);
    }

    // If we get here, all retries failed
    {
        let mut breaker = CIRCUIT_BREAKER.lock().await;
        breaker.record_failure();
    }

    Err(format!(
        "Max retries exceeded for {} ({}): {}",
        url, strategy_str, last_error
    ))
}

pub async fn fetch_psi_bulk(url: Url, settings: &Settings) -> Result<Vec<Value>, String> {
    if !settings.page_speed_bulk {
        return Ok(vec![]);
    }

    // Validate URL before making API request
    if !should_analyze_with_psi(&url) {
        eprintln!("Skipping PSI for {} - not a valid content page", url);
        return Ok(vec![]);
    }

    let api_key = settings
        .page_speed_bulk_api_key
        .as_ref()
        .and_then(|inner| inner.as_deref())
        .ok_or("No PSI API key configured".to_string())?;

    // Very lenient circuit breaker check
    {
        let breaker = CIRCUIT_BREAKER.lock().await;
        if breaker.should_skip() && breaker.success_rate() < 0.1 {
            eprintln!(
                "Skipping PSI for {} - circuit breaker open (success rate: {:.1}%)",
                url,
                breaker.success_rate() * 100.0
            );
            return Ok(vec![]);
        }
    }

    let max_retries = 3; // Retry a few times to handle API flakesg API
    let mut results = Vec::new();
    let mut errors = Vec::new();

    // Fetch both strategies sequentially with significant delay between them
    for strategy in STRATEGIES {
        let strategy_str = match strategy {
            PageSpeedStrategy::Mobile => "mobile",
            PageSpeedStrategy::Desktop => "desktop",
        };

        // Significant delay between strategies (2 seconds)
        if !results.is_empty() || !errors.is_empty() {
            sleep(Duration::from_secs(2)).await;
        }

        let result = timeout(
            Duration::from_secs(45),
            fetch_psi_with_retry(&url.to_string(), strategy_str, api_key, max_retries),
        )
        .await;

        match result {
            Ok(Ok(value)) => {
                if let Some(lighthouse_result) = value.get("lighthouseResult") {
                    results.push(lighthouse_result.clone());
                    tracing::info!(
                        "Successfully fetched PSI data for {} ({})",
                        url,
                        strategy_str,
                    );
                } else {
                    errors.push(format!("{}: no lighthouse result", strategy_str));
                }
            }
            Ok(Err(e)) => {
                tracing::error!("PSI fetch failed for {} ({}): {}", url, strategy_str, e);
                errors.push(format!("{}: {}", strategy_str, e));
            }
            Err(_) => {
                eprintln!("PSI fetch timed out for {} ({})", url, strategy_str);
                errors.push(format!("{}: timeout", strategy_str));
            }
        }
    }

    // Return whatever results we got (even if partial)
    if !results.is_empty() {
        tracing::error!(
            "PSI completed for {}: {} successes, {} errors",
            url,
            results.len(),
            errors.len()
        );
        Ok(results)
    } else {
        // All failed but return empty vec to not block crawl
        tracing::error!("All PSI strategies failed for {}: {:?}", url, errors);
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
    let success_rate = breaker.success_rate();

    if breaker.should_skip() {
        format!(
            "OPEN (failures: {}, success rate: {:.1}%, backoff: {:?})",
            breaker.consecutive_failures,
            success_rate * 100.0,
            breaker
                .backoff_until
                .map(|t| t.saturating_duration_since(Instant::now()))
        )
    } else if breaker.consecutive_failures > 0 {
        format!(
            "HALF-OPEN (failures: {}, success rate: {:.1}%)",
            breaker.consecutive_failures,
            success_rate * 100.0
        )
    } else {
        format!(
            "CLOSED (healthy, success rate: {:.1}%)",
            success_rate * 100.0
        )
    }
}

/// Get URL validation statistics (optional, for debugging/monitoring)
pub fn get_url_validation_debug_info(url: &Url) -> String {
    let mut info = vec![];

    // Check scheme
    if url.scheme() != "http" && url.scheme() != "https" {
        info.push(format!("Invalid scheme: {}", url.scheme()));
    }

    // Check path patterns
    let path = url.path();
    let skip_patterns = [
        "/login",
        "/signup",
        "/register",
        "/logout",
        "/admin",
        "/dashboard",
        "/account",
        "/cart",
        "/checkout",
        "/api/",
        "/webhook/",
        "/oauth/",
        "/auth/",
        "/search",
    ];

    for pattern in skip_patterns.iter() {
        if path.starts_with(pattern) {
            info.push(format!("Matches skip pattern: {}", pattern));
        }
    }

    // Check file extensions
    let invalid_extensions = [
        ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".ico", ".mp4", ".mp3", ".avi", ".mov",
        ".zip", ".tar", ".gz", ".exe", ".dmg", ".pkg", ".doc", ".docx", ".xls", ".xlsx", ".ppt",
        ".pptx", ".txt", ".rtf", ".csv",
    ];

    for ext in invalid_extensions.iter() {
        if path.to_lowercase().ends_with(ext) {
            info.push(format!("Invalid file extension: {}", ext));
        }
    }

    // Check query parameters
    if let Some(query) = url.query() {
        let query_lower = query.to_lowercase();
        let skip_queries = [
            "logout",
            "action=logout",
            "action=delete",
            "action=edit",
            "download=",
            "format=json",
            "format=xml",
            "api_key=",
            "token=",
            "auth=",
            "password=",
            "secret=",
        ];

        for skip_query in skip_queries.iter() {
            if query_lower.contains(skip_query) {
                info.push(format!("Contains skip query: {}", skip_query));
            }
        }
    }

    if info.is_empty() {
        "URL is valid for PSI analysis".to_string()
    } else {
        format!("URL validation failed: {}", info.join(", "))
    }
}
