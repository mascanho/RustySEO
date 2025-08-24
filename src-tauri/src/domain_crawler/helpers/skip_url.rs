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
        if url_lower.contains(pattern) {
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
