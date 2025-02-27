use scraper::{Html, Selector};
use url::Url;

/// Extracts links from the HTML content using the `scraper` crate
pub fn extract_links(html: &str, base_url: &Url) -> Vec<Url> {
    let document = Html::parse_document(html);
    let selector = Selector::parse("a[href]").unwrap(); // Select all <a> tags with an href attribute

    document
        .select(&selector)
        .filter_map(|element| {
            // Get the href attribute value
            let href = element.value().attr("href")?;

            // Build a full URL from the base URL and the href
            match build_full_url(base_url, href) {
                Ok(url) => {
                    // Validate and normalize the URL
                    if let Some(valid_url) = validate_and_normalize_url(base_url, &url) {
                        Some(valid_url)
                    } else {
                        // eprintln!("Skipping invalid URL: {}", url);
                        None
                    }
                }
                Err(e) => {
                    eprintln!("Failed to build URL from {}: {}", href, e);
                    None
                }
            }
        })
        .filter(|next_url: &Url| {
            // Filter by domain: ensure the link belongs to the same domain or subdomain
            let base_domain = base_url.domain().unwrap_or("");
            let next_domain = next_url.domain().unwrap_or("");
            next_domain.ends_with(base_domain)
        })
        .collect()
}

/// Builds a full URL from a base URL and a relative or absolute href
fn build_full_url(base_url: &Url, href: &str) -> Result<Url, url::ParseError> {
    // Handle relative URLs (e.g., "/about", "about", "../page")
    if href.starts_with('/') || !href.contains("://") {
        // Resolve relative URLs using the base URL
        base_url.join(href)
    } else {
        // Parse absolute URLs directly
        Url::parse(href)
    }
}

/// Validates and normalizes a URL
fn validate_and_normalize_url(base_url: &Url, url: &Url) -> Option<Url> {
    // Ensure the URL has a valid domain
    if url.domain().is_none() {
        return None; // Skip URLs without a domain
    }

    // Ensure the URL belongs to the same domain or subdomain as the base URL
    let base_domain = base_url.domain().unwrap_or("");
    let url_domain = url.domain().unwrap_or("");
    if !url_domain.ends_with(base_domain) {
        return None; // Skip URLs from external domains
    }

    // Normalize the URL by removing trailing slashes and fragment identifiers
    let mut normalized_url = url.clone();
    normalized_url.set_path(url.path().trim_end_matches('/'));
    normalized_url.set_fragment(None); // Remove fragment identifier

    Some(normalized_url)
}
