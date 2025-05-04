use crate::{
    domain_crawler::page_speed::model::{LighthouseResult, PsiResponse},
    Settings,
};
use reqwest::Client;
use serde_json::Value;
use url::Url;

use super::model::Crawler;

pub enum PageSpeedStrategy {
    Mobile,
    Desktop,
}

const STRATEGY: &[PageSpeedStrategy] = &[PageSpeedStrategy::Mobile, PageSpeedStrategy::Desktop];

pub async fn fetch_psi_bulk(
    url: Url,
    settings: &Settings,
) -> Result<Vec<LighthouseResult>, String> {
    println!("Calling the GPSI with url: {}", &url);
    println!("Using Key: {:#?}", settings.page_speed_bulk_api_key);

    let client = Client::new();
    let mut results = Vec::new();

    let api_key = settings
        .page_speed_bulk_api_key
        .as_ref()
        .and_then(|inner| inner.as_deref())
        .ok_or("No PSI API key configured".to_string())?;

    for strategy in STRATEGY {
        let api_url = format!(
            "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={}&strategy={}&key={}",
            url.to_string(),
            match strategy {
                PageSpeedStrategy::Mobile => "mobile",
                PageSpeedStrategy::Desktop => "desktop",
            },
            api_key
        );

        let response = client
            .get(&api_url)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        let response_body = response
            .text()
            .await
            .map_err(|e| format!("Failed to read response body: {}", e))?;
        println!("Response body: {}", response_body);

        if let Ok(error_response) = serde_json::from_str::<Value>(&response_body) {
            if error_response.get("error").is_some() {
                return Err(format!(
                    "API error: {}",
                    error_response.get("error").unwrap()
                ));
            }
        }

        let psi_response: PsiResponse = serde_json::from_str(&response_body)
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        results.push(psi_response.lighthouse_result);
    }

    Ok(results)
}
