use super::anchor_links::InternalExternalLinks;
use futures::future::join_all;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Semaphore;
use tokio::time::timeout;
use url::Url;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinkStatus {
    pub base_url: Url,
    pub url: String,
    pub relative_path: Option<String>,
    pub status: Option<u16>,
    pub error: Option<String>,
    pub anchor_text: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinkCheckResults {
    pub page: String,
    pub base_url: Url,
    pub internal: Vec<LinkStatus>,
    pub external: Vec<LinkStatus>,
}

pub async fn get_links_status_code(
    links: Option<InternalExternalLinks>,
    base_url: &Url,
    page: String,
) -> LinkCheckResults {
    // Create shared resources
    let client = Arc::new(
        Client::builder()
            .timeout(Duration::from_secs(10))
            .pool_idle_timeout(Duration::from_secs(30))
            .build()
            .expect("Failed to create HTTP client"),
    );

    // Limit concurrent requests to avoid overwhelming the system
    let semaphore = Arc::new(Semaphore::new(200));
    let mut tasks = Vec::new();
    let mut seen_urls = HashSet::new();

    if let Some(links) = links {
        // Process links in batches
        let all_links = links
            .internal
            .links
            .iter()
            .zip(links.internal.anchors.iter())
            .map(|(l, a)| (l, a, true))
            .chain(
                links
                    .external
                    .links
                    .iter()
                    .zip(links.external.anchors.iter())
                    .map(|(l, a)| (l, a, false)),
            );

        for (link, anchor, is_internal) in all_links {
            let full_url = if is_internal {
                match base_url.join(link) {
                    Ok(u) => u,
                    Err(e) => {
                        eprintln!("Failed to join URL {}: {}", link, e);
                        continue;
                    }
                }
            } else {
                match Url::parse(link) {
                    Ok(u) => u,
                    Err(e) => {
                        eprintln!("Failed to parse URL {}: {}", link, e);
                        continue;
                    }
                }
            };

            // Skip duplicate URLs
            if !seen_urls.insert(full_url.to_string()) {
                continue;
            }

            // Prepare task parameters
            let client = Arc::clone(&client);
            let semaphore = Arc::clone(&semaphore);
            let base_url = base_url.clone();
            let page = page.clone();
            let link = link.clone();
            let anchor = anchor.clone();

            // Spawn task for each link check
            tasks.push(tokio::spawn(async move {
                let _permit = semaphore.acquire().await.expect("Semaphore acquire failed");
                check_link_status(
                    &client,
                    &full_url.to_string(),
                    &base_url,
                    &page,
                    if is_internal { Some(link) } else { None },
                    Some(anchor),
                )
                .await
            }));
        }
    }

    // Process all results concurrently
    let results = join_all(tasks).await;

    // Separate internal and external links
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
    match timeout(Duration::from_secs(10), client.head(url).send()).await {
        Ok(Ok(response)) => LinkStatus {
            base_url: base_url.clone(),
            url: url.to_string(),
            relative_path,
            status: Some(response.status().as_u16()),
            error: None,
            anchor_text,
        },
        Ok(Err(e)) => LinkStatus {
            base_url: base_url.clone(),
            url: url.to_string(),
            relative_path,
            status: None,
            error: Some(format!("Request failed: {}", e)),
            anchor_text,
        },
        Err(_) => LinkStatus {
            base_url: base_url.clone(),
            url: url.to_string(),
            relative_path,
            status: None,
            error: Some("Request timed out".to_string()),
            anchor_text,
        },
    }
}

fn is_internal(url: &str, base_url: &Url) -> bool {
    match Url::parse(url) {
        Ok(parsed_url) => parsed_url.domain() == base_url.domain(),
        Err(_) => false,
    }
}
