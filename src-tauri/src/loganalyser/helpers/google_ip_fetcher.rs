use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct GoogleIpRanges {
    pub prefixes: Vec<Prefix>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Prefix {
    #[serde(rename = "ipv4Prefix")]
    pub ipv4_prefix: Option<String>,
    #[serde(rename = "ipv6Prefix")]
    pub ipv6_prefix: Option<String>,
}

pub async fn get_google_ip_ranges() -> Result<Vec<String>, String> {
    let url = "https://developers.google.com/static/search/apis/ipranges/googlebot.json";

    let client = Client::new();
    let response = client.get(url).send().await.map_err(|e| e.to_string())?;

    let data: GoogleIpRanges = response.json().await.map_err(|e| e.to_string())?;

    //println!("Google IP Ranges: {:?}", &data);

    let vec = data
        .prefixes
        .into_iter()
        .filter_map(|prefix| prefix.ipv4_prefix.or(prefix.ipv6_prefix))
        .collect();

    Ok(vec)
}
