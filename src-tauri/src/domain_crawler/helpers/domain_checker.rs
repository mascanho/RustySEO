use url::Url;

pub fn url_check(url: &str) -> String {
    if url.starts_with("https://") || url.starts_with("http://") {
        url.to_string()
    } else {
        format!("https://{}", url)
    }
}
