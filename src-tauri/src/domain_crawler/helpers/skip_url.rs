pub fn should_skip_url(url: &str) -> bool {
    // Skip fragments
    if url.contains('#') {
        return true;
    }

    // Skip common problematic patterns (made less restrictive)
    let skip_patterns = [
        "login",
        "logout",
        "signin",
        "admin",
        "dashboard",
        "cart",
        "checkout",
        "payment",
        "javascript:",
        "mailto:",
        "tel:",
        "wp-admin",
        "wp-login",
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".svg",
        ".ico",
        ".css",
        ".js",
        ".xml",
        ".txt",
        ".zip",
        ".pdf",
    ];

    let url_lower = url.to_lowercase();
    for pattern in &skip_patterns {
        // Check if the pattern is a path segment (surrounded by /) or a query parameter
        if url_lower.contains(&format!("/{}", pattern)) 
            || url_lower.contains(&format!("{}?", pattern))
            || url_lower.contains(&format!("={}", pattern))
            || url_lower.ends_with(pattern) 
            // Keep original check for file extensions and protocols
            || (pattern.starts_with('.') && url_lower.contains(pattern))
            || (pattern.ends_with(':') && url_lower.contains(pattern))
        {
            return true;
        }
    }

    // Skip URLs with too many query parameters (made less restrictive)
    if url.matches('&').count() > 8 {
        return true;
    }

    // Skip very long URLs (made less restrictive)
    if url.len() > 500 {
        return true;
    }

    false
}
