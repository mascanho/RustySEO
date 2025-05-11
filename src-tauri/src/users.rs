use reqwest;
use serde_json::json;
use uuid::Uuid;

pub async fn add_user() -> Result<(), String> {
    let client = reqwest::Client::new();
    let settings = crate::settings::settings::load_settings().await?;

    let response = client
        .post("https://server.rustyseo.com/users") // Match your curl URL
        .header("Content-Type", "application/json")
        .json(&json!({
            "user": settings.rustyid  // UUID will auto-serialize to string
        }))
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !&response.status().is_success() {
        return Err(format!(
            "Server error ({}): {}",
            response.status(),
            response.text().await.unwrap_or_default()
        ));
    }

    println!("Successfully added user with ID: {}", settings.rustyid);
    Ok(())
}
