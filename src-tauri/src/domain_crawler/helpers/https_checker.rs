use tauri::Url as tauriUrl;
use url::Url;

pub fn valid_https(url: &tauriUrl) -> bool {
    if let Ok(url) = Url::parse(&url.to_string()) {
        url.scheme() == "https"
    } else {
        false
    }
}
