use scraper::{Html, Selector};
use std::collections::BTreeMap;
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
                        eprintln!("Skipping invalid URL: {}", url);
                        None
                    }
                }
                Err(e) => {
                    eprintln!("Failed to build URL from {}: {}", href, e);
                    None
                }
            }
        })
        .filter(|next_url| {
            // Filter by domain: ensure the link belongs to the same domain or subdomain
            let base_domain = base_url.domain().unwrap_or("");
            let next_domain = next_url.domain().unwrap_or("");
            if !next_domain.ends_with(base_domain) {
                eprintln!("Skipping external URL: {}", next_url);
                false
            } else {
                true
            }
        })
        .collect()
}

/// Builds a full URL from a base URL and a relative or absolute href
fn build_full_url(base_url: &Url, href: &str) -> Result<Url, url::ParseError> {
    // Handle relative URLs (e.g., "/about", "about", "../page", "./about")
    if href.starts_with('/')
        || href.starts_with("./")
        || href.starts_with("../")
        || !href.contains("://")
    {
        base_url.join(href)
    } else {
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

    // Normalize the URL by removing trailing slashes, fragment identifiers, and normalizing query parameters
    let mut normalized_url = url.clone();
    normalized_url.set_path(url.path().trim_end_matches('/'));
    normalized_url.set_fragment(None); // Remove fragment identifier
    normalize_query_params(&mut normalized_url); // Normalize query parameters

    Some(normalized_url)
}

/// Normalizes query parameters by sorting and deduplicating them
fn normalize_query_params(url: &mut Url) {
    let query_pairs: BTreeMap<String, String> = url.query_pairs().into_owned().collect();
    let query: String = query_pairs
        .iter()
        .map(|(k, v)| format!("{}={}", k, v))
        .collect::<Vec<_>>()
        .join("&");
    url.set_query(Some(&query));
}
