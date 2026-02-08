use once_cell::sync::Lazy;
use scraper::{Html, Selector};
use url::Url;
use std::collections::HashSet;

static LINK_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("a[href]").unwrap());

/// Extracts and normalizes links from HTML
pub fn extract_links(document: &Html, resolve_url: &Url, scope_url: &Url) -> HashSet<Url> {
    let mut unique_urls = HashSet::new();

    for element in document.select(&LINK_SELECTOR) {
        if let Some(href) = element.value().attr("href") {
            if let Some(url) = process_link(resolve_url, scope_url, href) {
                unique_urls.insert(url);
            }
        }
    }

    unique_urls
}


/// Process a single link
fn process_link(resolve_url: &Url, scope_url: &Url, href: &str) -> Option<Url> {
    // Skip problematic hrefs early
    if href.is_empty() || href.starts_with('#') || href.starts_with("javascript:") {
        return None;
    }

    // Build URL using resolve_url (current page)
    let url = build_full_url(resolve_url, href).ok()?;

    // Validate using scope_url (root domain)
    validate_and_normalize_url(scope_url, &url)
}

/// Build URL with better relative path handling
fn build_full_url(base_url: &Url, href: &str) -> Result<Url, url::ParseError> {
    // Standardize URL joining
    base_url.join(href)
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

/// Improved domain checking: allows same domain, subdomains, and the naked domain
fn is_same_or_subdomain(url_domain: &str, base_domain: &str) -> bool {
    let url_domain = url_domain.to_lowercase();
    let base_domain = base_domain.to_lowercase();

    if url_domain == base_domain {
        return true;
    }

    // Strip 'www.' to get the root-like domain
    let url_root = url_domain.strip_prefix("www.").unwrap_or(&url_domain);
    let base_root = base_domain.strip_prefix("www.").unwrap_or(&base_domain);

    if url_root == base_root {
        return true;
    }

    // Allow subdomains of either root
    // e.g., if base is 'example.com', allow 'shop.example.com'
    // e.g., if base is 'www.example.com', allow 'shop.example.com'
    // Check for dot before the root to ensure it's a true subdomain
    // e.g. "shop.example.com" ends with ".example.com"
    (url_domain.ends_with(base_root) && url_domain.len() > base_root.len() && url_domain.as_bytes()[url_domain.len() - base_root.len() - 1] == b'.')
        || (base_domain.ends_with(url_root) && base_domain.len() > url_root.len() && base_domain.as_bytes()[base_domain.len() - url_root.len() - 1] == b'.')
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
