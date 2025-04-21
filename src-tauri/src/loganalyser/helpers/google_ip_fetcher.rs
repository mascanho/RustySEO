use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct GoogleIpRanges {
    pub prefixes: Vec<Prefix>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Prefix {
    pub ipv4Prefix: Option<String>,
    pub ipv6Prefix: Option<String>,
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
        .filter_map(|prefix| prefix.ipv4Prefix.or(prefix.ipv6Prefix))
        .collect();

    Ok(vec)
}
