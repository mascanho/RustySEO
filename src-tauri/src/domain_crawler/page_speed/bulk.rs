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

pub async fn fetch_psi_bulk(url: Url, settings: &Settings) -> Result<Vec<Value>, String> {
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

        let value: Value = serde_json::from_str(&response_body)
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        if value.get("error").is_some() {
            return Err(format!("API error: {}", value.get("error").unwrap()));
        }

        // Extract lighthouseResult directly as Value
        let lighthouse_result = value
            .get("lighthouseResult")
            .ok_or("No lighthouseResult in response".to_string())?
            .clone();
        results.push(lighthouse_result);
    }

    Ok(results)
}
