use scraper::{Html, Selector};
use url::Url;
use std::collections::HashSet;

/// Extracts and normalizes links from HTML
pub fn extract_links(html: &str, base_url: &Url) -> HashSet<Url> {
    let document = Html::parse_document(html);
    let selector = Selector::parse("a[href]").unwrap();

    let mut unique_urls = HashSet::new();

    for element in document.select(&selector) {
        if let Some(href) = element.value().attr("href") {
            if let Some(url) = process_link(base_url, href) {
                unique_urls.insert(url);
            }
        }
    }

    unique_urls
}

/// Process a single link
fn process_link(base_url: &Url, href: &str) -> Option<Url> {
    // Skip problematic hrefs early
    if href.is_empty() || href.starts_with('#') || href.starts_with("javascript:") {
        return None;
    }

    // Build URL
    let url = build_full_url(base_url, href).ok()?;

    // Validate and normalize
    validate_and_normalize_url(base_url, &url)
}

/// Build URL with better relative path handling
fn build_full_url(base_url: &Url, href: &str) -> Result<Url, url::ParseError> {
    // Handle common cases
    match href {
        // Absolute URLs
        s if s.starts_with("http://") || s.starts_with("https://") => {
            Url::parse(s)
        }
        // Root-relative URLs
        s if s.starts_with('/') => {
            let mut new_url = base_url.clone();
            new_url.set_path(s);
            Ok(new_url)
        }
        // Protocol-relative URLs (//example.com/path)
        s if s.starts_with("//") => {
            let mut new_url = base_url.clone();
            let full = format!("{}:{}", base_url.scheme(), s);
            Url::parse(&full)
        }
        // Everything else is relative
        _ => base_url.join(href),
    }
}

/// Validate and normalize with PROPER domain checking
fn validate_and_normalize_url(base_url: &Url, url: &Url) -> Option<Url> {
    // Must be http/https
    if url.scheme() != "http" && url.scheme() != "https" {
        return None;
    }

    // Must have domain
    let base_domain = base_url.domain()?;
    let url_domain = url.domain()?;

    // SECURE domain check (not just ends_with!)
    if !is_same_or_subdomain(url_domain, base_domain) {
        return None;
    }

    // Normalize
    let mut normalized = url.clone();

    // Remove fragment and query
    normalized.set_fragment(None);
    // normalized.set_query(None); // Optional: remove query params

    // Handle path normalization
    normalize_path(&mut normalized);

    Some(normalized)
}

/// Proper domain checking
fn is_same_or_subdomain(url_domain: &str, base_domain: &str) -> bool {
    if url_domain == base_domain {
        return true;
    }

    // Check if url_domain is a subdomain of base_domain
    // Properly handles cases like: api.example.com is subdomain of example.com
    // But NOT: evil-example.com
    url_domain.ends_with(&format!(".{}", base_domain))
}

/// Comprehensive path normalization
fn normalize_path(url: &mut Url) {
    let path = url.path();

    // Remove trailing slash unless it's root
    let new_path = if path == "/" {
        "/".to_string()
    } else {
        path.trim_end_matches('/').to_string()
    };

    // Also handle multiple slashes and ./
    let cleaned_path = new_path
        .replace("//", "/")  // Remove double slashes
        .replace("/./", "/"); // Remove ./

    url.set_path(&cleaned_path);
}
