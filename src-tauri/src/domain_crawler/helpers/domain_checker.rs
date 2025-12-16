use url::Url;

/// Normalizes a URL string:
/// - Ensures a scheme (defaults to https)
/// - Parses and removes fragment identifiers
/// - Removes trailing slashes from the path (except root)
pub fn url_check(url: &str) -> String {
    // Ensure scheme
    let with_scheme = if url.starts_with("https://") || url.starts_with("http://") {
        url.to_string()
    } else {
        format!("https://{}", url)
    };
    // Parse and normalize
    match Url::parse(&with_scheme) {
        Ok(mut parsed) => {
            // Remove fragment
            parsed.set_fragment(None);
            // Normalize path: remove trailing slash unless root
            let path_str = parsed.path().trim_end_matches('/').to_string();
            parsed.set_path(if path_str.is_empty() { "/" } else { path_str.as_str() });
            parsed.to_string()
        }
        Err(_) => with_scheme,
    }
}
