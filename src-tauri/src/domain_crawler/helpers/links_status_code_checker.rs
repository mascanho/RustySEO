use super::anchor_links::InternalExternalLinks;
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
    pub status: Option<u16>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinkCheckResults {
    pub page: String, // Changed from &str to String for proper ownership
    pub base_url: Url,
    pub internal: Vec<LinkStatus>,
    pub external: Vec<LinkStatus>,
}

pub async fn get_links_status_code(
    links: Option<InternalExternalLinks>,
    base_url: &Url,
    page: String, // Changed to owned String
) -> LinkCheckResults {
    let client = Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .expect("Failed to create HTTP client");

    let semaphore = Arc::new(Semaphore::new(50));
    let mut tasks = vec![];
    let mut seen_urls = HashSet::new();

    if let Some(links) = links {
        // Process internal links
        for link in links.internal.links {
            let full_url = match base_url.join(&link) {
                Ok(u) => u.to_string(),
                Err(e) => {
                    eprintln!("Failed to join URL {}: {}", link, e);
                    continue;
                }
            };

            if !seen_urls.insert(full_url.clone()) {
                continue;
            }

            let client = client.clone();
            let semaphore = semaphore.clone();
            let base_url = base_url.clone();
            let page = page.clone(); // Clone the page string for each task

            tasks.push(tokio::spawn(async move {
                let _permit = semaphore.acquire().await.unwrap();
                check_link_status(&client, &full_url, &base_url, &page).await
            }));
        }

        // Process external links
        for link in links.external.links {
            if !seen_urls.insert(link.clone()) {
                continue;
            }

            let client = client.clone();
            let semaphore = semaphore.clone();
            let base_url = base_url.clone();
            let page = page.clone(); // Clone the page string for each task

            tasks.push(tokio::spawn(async move {
                let _permit = semaphore.acquire().await.unwrap();
                check_link_status(&client, &link, &base_url, &page).await
            }));
        }
    }

    let (mut internal, mut external) = (Vec::new(), Vec::new());

    for task in tasks {
        match task.await {
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
        page, // Now using the owned String
        base_url: base_url.clone(),
        internal,
        external,
    }
}

async fn check_link_status(client: &Client, url: &str, base_url: &Url, page: &str) -> LinkStatus {
    match timeout(Duration::from_secs(10), client.head(url).send()).await {
        Ok(Ok(response)) => LinkStatus {
            base_url: base_url.clone(),
            url: url.to_string(),
            status: Some(response.status().as_u16()),
            error: None,
        },
        Ok(Err(e)) => LinkStatus {
            base_url: base_url.clone(),
            url: url.to_string(),
            status: None,
            error: Some(format!("Request failed: {}", e)),
        },
        Err(_) => LinkStatus {
            base_url: base_url.clone(),
            url: url.to_string(),
            status: None,
            error: Some("Request timed out".to_string()),
        },
    }
}

fn is_internal(url: &str, base_url: &Url) -> bool {
    match Url::parse(url) {
        Ok(parsed_url) => parsed_url.domain() == base_url.domain(),
        Err(_) => false,
    }
}
