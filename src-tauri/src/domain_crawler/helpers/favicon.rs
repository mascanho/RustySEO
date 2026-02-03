use url::Url;
use reqwest::Client;

pub async fn get_favicon(url: &Url) -> Result<String, String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client.get(url.as_str()).send().await.map_err(|e| {
        format!("Failed to fetch URL: {}", e)
    })?;

    let html = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response text: {}", e))?;

    // Try different favicon link formats with more robust matching
    let patterns = [
        "<link rel=\"icon\"",
        "<link rel='icon'",
        "<link rel=icon",
        "<link rel=\"shortcut icon\"",
        "<link rel='shortcut icon'",
    ];

    for pattern in &patterns {
        if let Some(part) = html.split(pattern).nth(1) {
            // Find href within this part
            if let Some(href_start) = part.find("href=") {
                let after_href = &part[href_start + 5..];
                let quote = after_href.chars().next().unwrap_or('"');
                let end_index = if quote == '"' || quote == '\'' {
                    after_href[1..].find(quote).map(|i| i + 1)
                } else {
                    after_href.find(' ')
                };

                if let Some(end) = end_index {
                    let mut favicon_path = if quote == '"' || quote == '\'' {
                        &after_href[1..end]
                    } else {
                        &after_href[..end]
                    };
                    
                    favicon_path = favicon_path.trim();

                    if !favicon_path.is_empty() {
                        if let Ok(full_url) = url.join(favicon_path) {
                            return Ok(full_url.to_string());
                        }
                    }
                }
            }
        }
    }

    // Try common favicon locations if none found in HTML
    let common_paths = ["/favicon.ico", "/favicon.png", "/apple-touch-icon.png"];
    for path in &common_paths {
        if let Ok(favicon_url) = url.join(path) {
            if let Ok(res) = client.head(favicon_url.clone()).send().await {
                if res.status().is_success() {
                    return Ok(favicon_url.to_string());
                }
            }
        }
    }

    Err("No favicon found".to_string())
}
