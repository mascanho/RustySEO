use super::anchor_links::InternalExternalLinks;
use futures::future::join_all;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::sync::Arc;
use std::time::Duration;
use tokio::fs;
use tokio::sync::Semaphore;
use tokio::time::{sleep, timeout};
use url::Url;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinkStatus {
    pub base_url: Url,
    pub url: String,
    pub relative_path: Option<String>,
    pub status: Option<u16>,
    pub error: Option<String>,
    pub anchor_text: Option<String>,
    pub retries: u8,
    pub checked_at: Option<String>, // ISO 8601 timestamp
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinkCheckResults {
    pub page: String,
    pub base_url: Url,
    pub internal: Vec<LinkStatus>,
    pub external: Vec<LinkStatus>,
    pub generated_at: String, // ISO 8601 timestamp
}

impl LinkCheckResults {
    pub async fn save_to_file(&self, filename: &str) -> std::io::Result<()> {
        let serialized = serde_json::to_string_pretty(self)?;
        fs::write(filename, serialized).await
    }

    pub async fn load_from_file(filename: &str) -> std::io::Result<Self> {
        let contents = fs::read_to_string(filename).await?;
        let results: LinkCheckResults = serde_json::from_str(&contents)?;
        Ok(results)
    }
}

pub async fn get_links_status_code(
    links: Option<InternalExternalLinks>,
    base_url: &Url,
    page: String,
) -> LinkCheckResults {
    let client = Arc::new(
        Client::builder()
            .timeout(Duration::from_secs(15))
            .pool_idle_timeout(Duration::from_secs(30))
            .user_agent("Mozilla/5.0 (compatible; LinkChecker/1.0)")
            .build()
            .expect("Failed to create HTTP client"),
    );

    let semaphore = Arc::new(Semaphore::new(20));
    let mut tasks = Vec::new();
    let mut seen_urls = HashSet::new();

    if let Some(links) = links {
        // Process internal links
        for (link, anchor) in links
            .internal
            .links
            .iter()
            .zip(links.internal.anchors.iter())
        {
            let full_url = match base_url.join(link) {
                Ok(u) => u,
                Err(e) => {
                    eprintln!("Failed to join URL {}: {}", link, e);
                    continue;
                }
            };

            if !seen_urls.insert(full_url.to_string()) {
                continue;
            }

            let client = Arc::clone(&client);
            let semaphore = Arc::clone(&semaphore);
            let base_url = base_url.clone();
            let page = page.clone();
            let link = link.clone();
            let anchor = anchor.clone();

            tasks.push(tokio::spawn(async move {
                let _permit = semaphore.acquire().await.expect("Semaphore acquire failed");
                check_link_with_retries(
                    &client,
                    &full_url.to_string(),
                    &base_url,
                    &page,
                    Some(link),
                    Some(anchor),
                    3,
                )
                .await
            }));
        }

        // Process external links with domain-based rate limiting
        let mut domains = HashSet::new();
        for (link, anchor) in links
            .external
            .links
            .iter()
            .zip(links.external.anchors.iter())
        {
            if !seen_urls.insert(link.clone()) {
                continue;
            }

            let domain = match Url::parse(link) {
                Ok(url) => url.host_str().map(|h| h.to_string()),
                Err(_) => None,
            };

            if let Some(domain) = &domain {
                if !domains.insert(domain.clone()) {
                    sleep(Duration::from_millis(500)).await;
                }
            }

            let client = Arc::clone(&client);
            let semaphore = Arc::clone(&semaphore);
            let base_url = base_url.clone();
            let page = page.clone();
            let link = link.clone();
            let anchor = anchor.clone();

            tasks.push(tokio::spawn(async move {
                let _permit = semaphore.acquire().await.expect("Semaphore acquire failed");
                check_link_with_retries(&client, &link, &base_url, &page, None, Some(anchor), 3)
                    .await
            }));
        }
    }

    let results = join_all(tasks).await;
    let (mut internal, mut external) = (Vec::new(), Vec::new());

    for result in results {
        match result {
            Ok(status) => {
                if is_internal(&status.url, &status.base_url) {
                    internal.push(status);
                } else {
                    external.push(status);
                }
            }
            Err(e) => eprintln!("Task failed: {}", e),
        }
    }

    LinkCheckResults {
        page,
        base_url: base_url.clone(),
        internal,
        external,
        generated_at: chrono::Local::now().to_rfc3339(),
    }
}

async fn check_link_with_retries(
    client: &Client,
    url: &str,
    base_url: &Url,
    page: &str,
    relative_path: Option<String>,
    anchor_text: Option<String>,
    max_retries: u8,
) -> LinkStatus {
    let mut retries = 0;
    let mut last_error = None;

    while retries <= max_retries {
        let result = check_link_status(
            client,
            url,
            base_url,
            page,
            relative_path.clone(),
            anchor_text.clone(),
        )
        .await;

        match result.status {
            Some(429) => {
                let delay = Duration::from_millis(500 * u64::from(2u8.pow(retries as u32)));
                sleep(delay).await;
                retries += 1;
                last_error = Some(format!("Rate limited (retry {}/{})", retries, max_retries));
                continue;
            }
            Some(status) if status >= 500 && status < 600 && retries < max_retries => {
                sleep(Duration::from_millis(500)).await;
                retries += 1;
                last_error = Some(format!("Server error (retry {}/{})", retries, max_retries));
                continue;
            }
            _ => {
                return LinkStatus {
                    retries,
                    checked_at: Some(chrono::Local::now().to_rfc3339()),
                    ..result
                };
            }
        }
    }

    LinkStatus {
        base_url: base_url.clone(),
        url: url.to_string(),
        relative_path,
        status: None,
        error: last_error.or_else(|| Some("Max retries exceeded".to_string())),
        anchor_text,
        retries,
        checked_at: Some(chrono::Local::now().to_rfc3339()),
    }
}

async fn check_link_status(
    client: &Client,
    url: &str,
    base_url: &Url,
    page: &str,
    relative_path: Option<String>,
    anchor_text: Option<String>,
) -> LinkStatus {
    match timeout(Duration::from_secs(15), client.head(url).send()).await {
        Ok(Ok(response)) => LinkStatus {
            base_url: base_url.clone(),
            url: url.to_string(),
            relative_path,
            status: Some(response.status().as_u16()),
            error: None,
            anchor_text,
            retries: 0,
            checked_at: None,
        },
        Ok(Err(e)) => LinkStatus {
            base_url: base_url.clone(),
            url: url.to_string(),
            relative_path,
            status: None,
            error: Some(format!("Request failed: {}", e)),
            anchor_text,
            retries: 0,
            checked_at: None,
        },
        Err(_) => LinkStatus {
            base_url: base_url.clone(),
            url: url.to_string(),
            relative_path,
            status: None,
            error: Some("Request timed out".to_string()),
            anchor_text,
            retries: 0,
            checked_at: None,
        },
    }
}

fn is_internal(url: &str, base_url: &Url) -> bool {
    match Url::parse(url) {
        Ok(parsed_url) => parsed_url.domain() == base_url.domain(),
        Err(_) => false,
    }
}
