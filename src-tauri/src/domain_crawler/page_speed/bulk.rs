use crate::{domain_crawler::page_speed::model::PsiResponse, Settings};
use futures::future::try_join_all;
use lazy_static::lazy_static;
use rand::Rng;
use reqwest::{Client, StatusCode, Url};
use serde_json::Value;
use std::time::Duration;
use thiserror::Error;
use tokio::time::sleep;

#[derive(Error, Debug)]
pub enum PsiError {
    #[error("No PSI API key configured")]
    NoApiKey,
    #[error("Request failed: {0}")]
    Request(#[from] reqwest::Error),
    #[error("Failed to parse JSON response: {0}")]
    JsonParse(#[from] serde_json::Error),
    #[error("API error: {0}")]
    Api(String),
    #[error("No lighthouseResult in response")]
    NoLighthouseResult,
    #[error("PSI request timed out after {0:?}")]
    Timeout(Duration),
    #[error("Request failed after {0} retries")]
    RetriesExceeded(usize),
}

pub enum PageSpeedStrategy {
    Mobile,
    Desktop,
}

const STRATEGIES: &[PageSpeedStrategy] = &[PageSpeedStrategy::Mobile, PageSpeedStrategy::Desktop];
const MAX_RETRIES: usize = 3;
const INITIAL_BACKOFF_MS: u64 = 1000;

lazy_static! {
    static ref HTTP_CLIENT: Client = Client::builder()
        .timeout(Duration::from_secs(45))
        .build()
        .expect("Failed to build HTTP client");
}

async fn fetch_psi_for_strategy(
    url: &Url,
    strategy: &PageSpeedStrategy,
    api_key: &str,
) -> Result<Value, PsiError> {
    let strategy_str = match strategy {
        PageSpeedStrategy::Mobile => "mobile",
        PageSpeedStrategy::Desktop => "desktop",
    };

    let api_url = format!(
        "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={}&strategy={}&key={}",
        url,
        strategy_str,
        api_key
    );

    let mut attempt = 0;
    loop {
        let response_result = HTTP_CLIENT.get(&api_url).send().await;

        match response_result {
            Ok(response) => {
                let status = response.status();
                if status.is_success() {
                    let value: Value = response.json().await?;
                    if let Some(error) = value.get("error") {
                        return Err(PsiError::Api(error.to_string()));
                    }
                    return value
                        .get("lighthouseResult")
                        .cloned()
                        .ok_or(PsiError::NoLighthouseResult);
                } else if status == StatusCode::TOO_MANY_REQUESTS && attempt < MAX_RETRIES {
                    let backoff_ms = INITIAL_BACKOFF_MS * 2u64.pow(attempt as u32);
                    let jitter = rand::thread_rng().gen_range(0..=100);
                    sleep(Duration::from_millis(backoff_ms + jitter)).await;
                    attempt += 1;
                } else {
                    let text = response.text().await.unwrap_or_default();
                    return Err(PsiError::Api(format!(
                        "API returned non-success status: {} - {}",
                        status,
                        text
                    )));
                }
            }
            Err(e) => {
                if attempt >= MAX_RETRIES {
                    return Err(e.into());
                }
                attempt += 1;
            }
        }
    }
}

pub async fn fetch_psi_bulk(url: Url, settings: &Settings) -> Result<Vec<Value>, PsiError> {
    if !settings.page_speed_bulk {
        return Ok(vec![]);
    }

    let api_key = settings
        .page_speed_bulk_api_key
        .as_ref()
        .and_then(|inner| inner.as_deref())
        .ok_or(PsiError::NoApiKey)?;

    let futures = STRATEGIES
        .iter()
        .map(|strategy| fetch_psi_for_strategy(&url, strategy, api_key));

    let timeout_duration = Duration::from_secs(60);
    let results = match tokio::time::timeout(timeout_duration, try_join_all(futures)).await {
        Ok(Ok(results)) => Ok(results),
        Ok(Err(e)) => Err(e),
        Err(_) => Err(PsiError::Timeout(timeout_duration)),
    }?;

    Ok(results)
}
