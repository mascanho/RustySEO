// tests/crawler_url_coverage.rs

#[cfg(test)]
mod tests {
    use crate::domain_crawler::helpers::anchor_links::extract_internal_external_links;
    use crate::domain_crawler::helpers::links_selector::extract_links;
    use url::Url;

    const BASE_URL: &str = "https://example.com";

    #[test]
    fn test_crawler_url_extraction() {
        let html = r#"<html>
            <body>
                <a href=\"/relative\">Relative Link</a>
                <a href=\"https://example.com/absolute\">Absolute Link</a>
                <a href=\"https://google.com/external\">External Link</a>
                <a href=\"#fragment\">Fragment Only</a>
            </body>
        </html>"#;
        let base = Url::parse(BASE_URL).unwrap();
        // Test links_selector (raw URLs)
        let links = extract_links(html, &base);
        assert_eq!(links.len(), 3); // fragment-only should be skipped by validation
        // Test anchor_links for internal/external classification
        let result = extract_internal_external_links(html, &base).expect("should parse");
        assert_eq!(result.internal.links.len(), 2);
        assert_eq!(result.external.links.len(), 1);
        // Ensure URLs are normalized (no trailing slash)
        for url in result.internal.links.iter().chain(result.external.links.iter()) {
            assert!(!url.ends_with('/'));
        }
    }
}
