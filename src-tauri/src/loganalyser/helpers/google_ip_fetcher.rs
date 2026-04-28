use reqwest::blocking::Client as BlockingClient;
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GoogleIpRanges {
    pub creation_time: Option<String>,
    pub prefixes: Vec<Prefix>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Prefix {
    pub ipv4_prefix: Option<String>,
    pub ipv6_prefix: Option<String>,
}

pub async fn get_google_ip_ranges() -> Result<Vec<String>, String> {
    let url = "https://developers.google.com/static/crawling/ipranges/common-crawlers.json";

    let client = Client::builder()
        .user_agent("RustySEO/1.0")
        .build()
        .map_err(|e| e.to_string())?;
    let response = client.get(url).send().await.map_err(|e| e.to_string())?;

    let data: GoogleIpRanges = response.json().await.map_err(|e| e.to_string())?;

    let vec = data
        .prefixes
        .into_iter()
        .filter_map(|prefix| prefix.ipv4_prefix.or(prefix.ipv6_prefix))
        .collect();

    Ok(vec)
}

/// Synchronous version for pre-loading
pub fn get_google_ip_ranges_sync() -> Result<Vec<String>, String> {
    let url = "https://developers.google.com/static/crawling/ipranges/common-crawlers.json";

    let client = BlockingClient::builder()
        .user_agent("RustySEO/1.0")
        .build()
        .map_err(|e| e.to_string())?;
    let response = client.get(url).send().map_err(|e| e.to_string())?;

    let data: GoogleIpRanges = response.json().map_err(|e| e.to_string())?;

    let vec = data
        .prefixes
        .into_iter()
        .filter_map(|prefix| prefix.ipv4_prefix.or(prefix.ipv6_prefix))
        .collect();

    Ok(vec)
}
