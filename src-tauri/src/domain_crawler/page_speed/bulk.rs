use crate::{
    domain_crawler::page_speed::model::{LighthouseResult, PsiResponse},
    Settings,
};
use futures::future::try_join_all;
use reqwest::Client;
use serde_json::Value;
use url::Url;

// Add this at the top of your file
use lazy_static::lazy_static;

pub enum PageSpeedStrategy {
    Mobile,
    Desktop,
}

const STRATEGIES: &[PageSpeedStrategy] = &[PageSpeedStrategy::Mobile, PageSpeedStrategy::Desktop];

// Initialize the HTTP client once
lazy_static! {
    static ref HTTP_CLIENT: Client = Client::new();
}

pub async fn fetch_psi_bulk(url: Url, settings: &Settings) -> Result<Vec<Value>, String> {
    if !settings.page_speed_bulk {
        return Ok(vec![]);
    }

    let api_key = settings
        .page_speed_bulk_api_key
        .as_ref()
        .and_then(|inner| inner.as_deref())
        .ok_or("No PSI API key configured".to_string())?;

    let futures = STRATEGIES.iter().map(|strategy| {
        let url = url.clone();
        async move {
            let strategy_str = match strategy {
                PageSpeedStrategy::Mobile => "mobile",
                PageSpeedStrategy::Desktop => "desktop",
            };

            let api_url = format!(
                "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={}&strategy={}&key={}",
                url.to_string(),
                strategy_str,
                api_key
            );

            let response = HTTP_CLIENT
                .get(&api_url)
                .send()
                .await
                .map_err(|e| format!("Request failed: {}", e))?;

            let response_body = response
                .bytes()
                .await
                .map_err(|e| format!("Failed to read response body: {}", e))?;

            let value: Value = serde_json::from_slice(&response_body)
                .map_err(|e| format!("Failed to parse response: {}", e))?;

            if let Some(error) = value.get("error") {
                return Err(format!("API error: {}", error));
            }

            value
                .get("lighthouseResult")
                .cloned()
                .ok_or("No lighthouseResult in response".to_string())
        }
    });

    let results =
        match tokio::time::timeout(std::time::Duration::from_secs(30), try_join_all(futures)).await
        {
            Ok(Ok(results)) => Ok(results),
            Ok(Err(e)) => Err(format!("Failed to fetch PSI results: {}", e)),
            Err(_) => Err("PSI request timed out".to_string()),
        }?;

    Ok(results)
}
