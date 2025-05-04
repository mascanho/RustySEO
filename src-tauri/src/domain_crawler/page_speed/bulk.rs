use crate::{
    domain_crawler::page_speed::model::{LighthouseResult, PsiResponse},
    Settings,
};
use futures::future::try_join_all;
use reqwest::Client;
use serde_json::Value;
use url::Url;

pub enum PageSpeedStrategy {
    Mobile,
    Desktop,
}

const STRATEGIES: &[PageSpeedStrategy] = &[PageSpeedStrategy::Mobile, PageSpeedStrategy::Desktop];

pub async fn fetch_psi_bulk(url: Url, settings: &Settings) -> Result<Vec<Value>, String> {
    let client = Client::new();

    println!("The Page Speed is: {}", settings.page_speed_bulk);

    let api_key = settings
        .page_speed_bulk_api_key
        .as_ref()
        .and_then(|inner| inner.as_deref())
        .ok_or("No PSI API key configured".to_string())?;

    // Create a vector of futures for mobile and desktop requests
    let futures = STRATEGIES.iter().map(|strategy| {
        let client = client.clone();
        let url = url.clone();
        let api_key = api_key.to_string();
        async move {
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

            Ok(lighthouse_result)
        }
    });

    // Run all futures concurrently and collect results
    let results = try_join_all(futures)
        .await
        .map_err(|e| format!("Failed to fetch PSI results: {}", e))?;

    Ok(results)
}
