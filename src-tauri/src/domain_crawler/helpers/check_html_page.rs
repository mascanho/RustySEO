use scraper::{Html, Selector};

pub async fn is_html_page(body: &str, content_type: Option<&str>) -> bool {
    let body_len = body.len();
    
    // If body is extremely small, it's likely an error page or empty response
    if body_len < 10 {
        return false;
    }

    let is_html_header = if let Some(ct) = content_type {
        let ct_lower = ct.to_lowercase();
        ct_lower.contains("text/html") 
            || ct_lower.contains("application/xhtml+xml")
            || ct_lower.contains("application/xml")
            || ct_lower.contains("text/xml")
            || ct_lower.contains("text/plain") // Some servers serve HTML as text/plain
    } else {
        false
    };

    // CHECK THE RESPONSE BODY FOR HTML-LIKE CONTENT
    let is_html_body = {
        let body_lower = body.to_lowercase();
        // Look for common structural tags anywhere in the body
        body_lower.contains("<html") 
            || body_lower.contains("<body") 
            || body_lower.contains("<div") 
            || body_lower.contains("<p") 
            || body_lower.contains("<a ")
            || body_lower.contains("<script")
            || body_lower.contains("<title")
            || body_lower.contains("<!doctype html")
    };

    // If we have an HTML header, we trust it unless the body is clearly binary (not used here)
    // If we don't have an HTML header, we only trust it if we see tags.
    is_html_header || is_html_body
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_is_html_page() {
        // Valid header, valid body
        assert!(is_html_page("<html><body></body></html>", Some("text/html")).await);

        // Valid header, invalid body (should pass now)
        assert!(is_html_page("not really html", Some("text/html")).await);

        // Invalid header, valid body (should pass now)
        assert!(is_html_page("<html><body></body></html>", Some("text/plain")).await);
        assert!(is_html_page("<html><body></body></html>", None).await);

        // Invalid header, invalid body
        assert!(!is_html_page("not html", Some("text/plain")).await);
        assert!(!is_html_page("not html", None).await);
    }
}
