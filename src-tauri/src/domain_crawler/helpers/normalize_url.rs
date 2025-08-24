// Normalize URLs to reduce duplicates
pub fn normalize_url(url: &str) -> String {
    let mut normalized = url.to_lowercase();

    // Remove trailing slash
    if normalized.ends_with('/') && normalized.len() > 1 {
        normalized.pop();
    }

    // Remove common tracking parameters
    let tracking_params = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "fbclid",
        "gclid",
    ];
    for param in &tracking_params {
        if let Some(pos) = normalized.find(&format!("{}=", param)) {
            let before = &normalized[..pos];
            if let Some(after_pos) = normalized[pos..].find('&') {
                let after = &normalized[pos + after_pos..];
                normalized = format!(
                    "{}{}",
                    before.trim_end_matches('?').trim_end_matches('&'),
                    after
                );
            } else {
                normalized = before
                    .trim_end_matches('?')
                    .trim_end_matches('&')
                    .to_string();
            }
        }
    }

    normalized
}
