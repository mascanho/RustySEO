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
                Ok(url) => Some(url),
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
