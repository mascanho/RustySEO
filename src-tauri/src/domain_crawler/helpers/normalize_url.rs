use url::Url;

/// Normalize URLs to reduce duplicates
pub fn normalize_url(url_str: &str) -> String {
    let Ok(mut url) = Url::parse(url_str) else {
        return url_str.to_lowercase();
    };

    // 1. Remove fragments
    url.set_fragment(None);

    // 2. Normalize path: remove trailing slash, double slashes, and ./
    let mut path = url.path().to_string();
    if path.len() > 1 && path.ends_with('/') {
        path = path.trim_end_matches('/').to_string();
    }
    
    let cleaned_path = path
        .replace("//", "/")
        .replace("/./", "/");
    
    url.set_path(&cleaned_path);

    // 3. Remove common tracking parameters
    let tracking_params = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "fbclid",
        "gclid",
        "msclkid",
    ];

    let query_params: Vec<(String, String)> = url
        .query_pairs()
        .filter(|(name, _)| !tracking_params.contains(&name.to_lowercase().as_str()))
        .map(|(k, v)| (k.into_owned(), v.into_owned()))
        .collect();

    if query_params.is_empty() {
        url.set_query(None);
    } else {
        let mut new_query = String::new();
        for (i, (k, v)) in query_params.iter().enumerate() {
            if i > 0 {
                new_query.push('&');
            }
            new_query.push_str(k);
            new_query.push('=');
            new_query.push_str(v);
        }
        url.set_query(Some(&new_query));
    }

    // 4. Convert to lowercase domain (Url::parse already does this mostly, but ensure string consistency)
    url.to_string().trim_end_matches('?').to_string()
}
