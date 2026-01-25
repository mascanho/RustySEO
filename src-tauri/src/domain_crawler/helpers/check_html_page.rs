use scraper::{Html, Selector};

pub async fn is_html_page(body: &str, content_type: Option<&str>) -> bool {
    // Check the content-type header for HTML MIME types
    if let Some(ct) = content_type {
        let ct_lower = ct.to_lowercase();
        // Explicitly reject non-html types
        if ct_lower.contains("json")
            || ct_lower.contains("xml")
            || ct_lower.contains("image")
            || ct_lower.contains("pdf")
            || ct_lower.contains("css")
            || ct_lower.contains("javascript")
            || ct_lower.contains("text/plain")
            || ct_lower.contains("application/")
        {
            // If it's one of these, but also claims to be html? Unlikely.
            // But strict check: if it is explicitly text/html, we accept it.
            if !ct_lower.contains("text/html") {
                return false;
            }
        }
    }

    let is_html_header = content_type
        .map(|content_type| content_type.to_lowercase().contains("text/html"))
        .unwrap_or(false);

    // CHECK THE RESPONSE BODY FOR HTML-LIKE CONTENT
    let is_html_body = {
        let document = Html::parse_document(body);
        let selectors = [
            Selector::parse("html").ok(),
            Selector::parse("head").ok(),
            Selector::parse("body").ok(),
        ];

        // If any of the selectors find a match, consider it HTML
        selectors.iter().any(|selector| {
            selector
                .as_ref()
                .map_or(false, |s| document.select(s).next().is_some())
        })
    };

    // CONSIDER THE PAGE HTML IF EITHER THE HEADER OR BODY SUGGEST IT
    // Relaxed check to avoid discarding pages with missing headers or partial bodies
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
