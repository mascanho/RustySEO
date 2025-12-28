use reqwest;
use serde_json::json;
use std::time::Duration;

pub async fn add_user() -> Result<(), String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))  // Set a 10-second timeout
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let settings = match crate::settings::settings::load_settings().await {
        Ok(s) => s,
        Err(e) => return Err(format!("Failed to load settings: {}", e)),
    };

    let response = match client
        .post("https://api.rustyseo.com/users")
        .header("Content-Type", "application/json")
        .json(&json!({
            "user": settings.rustyid
        }))
        .send()
        .await
    {
        Ok(resp) => resp,
        Err(e) => {
            if e.is_timeout() {
                return Err("Connection timed out after 10 seconds".to_string());
            } else if e.is_connect() {
                return Err("Failed to connect to server".to_string());
            }
            return Err(format!("Request failed: {}", e));
        }
    };

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unable to read error response".to_string());
        return Err(format!("Server error ({}): {}", status, error_text));
    }

    println!("Successfully added user with ID: {}", settings.rustyid);
    Ok(())
}
