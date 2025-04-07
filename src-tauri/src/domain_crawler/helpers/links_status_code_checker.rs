use super::anchor_links::InternalExternalLinks;
use futures::future::join_all;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{Mutex, Semaphore};
use tokio::time::timeout;
use url::Url;

// Configuration constants
const REQUEST_TIMEOUT: Duration = Duration::from_secs(10);
const MAX_RETRIES: u32 = 2;
const INITIAL_TASK_CAPACITY: usize = 100;
const MAX_CONCURRENT_REQUESTS: usize = 100;

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
    // Initialize HTTP client with optimized settings
    let client = Arc::new(
        Client::builder()
            .timeout(Duration::from_secs(15))
            .connect_timeout(Duration::from_secs(5))
            .pool_idle_timeout(Duration::from_secs(60))
            .pool_max_idle_per_host(20)
            .user_agent(format!(
                "{}/{}",
                env!("CARGO_PKG_NAME"),
                env!("CARGO_PKG_VERSION")
            ))
            .redirect(reqwest::redirect::Policy::limited(5))
            .build()
            .expect("Failed to create HTTP client"),
    );

    let semaphore = Arc::new(Semaphore::new(MAX_CONCURRENT_REQUESTS));
    let base_url_arc = Arc::new(base_url.clone());
    let page_arc = Arc::new(page);
    let seen_urls = Arc::new(Mutex::new(HashSet::with_capacity(INITIAL_TASK_CAPACITY)));

    let mut tasks = Vec::with_capacity(INITIAL_TASK_CAPACITY);

    if let Some(links_data) = links {
        // Prepare all links first
        let all_links = links_data
            .internal
            .links
            .into_iter()
            .zip(links_data.internal.anchors.into_iter())
            .map(|(link, anchor)| (link, anchor, true))
            .chain(
                links_data
                    .external
                    .links
                    .into_iter()
                    .zip(links_data.external.anchors.into_iter())
                    .map(|(link, anchor)| (link, anchor, false)),
            );

        // Process each link
        for (link, anchor, is_internal) in all_links {
            // Clone necessary shared resources for this task
            let client = Arc::clone(&client);
            let semaphore = Arc::clone(&semaphore);
            let base_url = Arc::clone(&base_url_arc);
            let page = page_arc.as_str().to_string();
            let seen_urls = Arc::clone(&seen_urls);

            tasks.push(tokio::spawn(async move {
                // Resolve URL with error handling
                let full_url = match if is_internal {
                    base_url.join(&link)
                } else {
                    Url::parse(&link)
                } {
                    Ok(u) => u,
                    Err(e) => {
                        eprintln!("Skipping invalid URL '{}' on page '{}': {}", link, page, e);
                        return None;
                    }
                };

                let full_url_str = full_url.to_string();

                // Check for duplicates with thread-safe access
                {
                    let mut seen = seen_urls.lock().await;
                    if !seen.insert(full_url_str.clone()) {
                        return None;
                    }
                }

                // Prepare task data with minimal cloning
                let relative_path = is_internal.then(|| link);
                let anchor_text = Some(anchor);

                // Retry logic for transient failures
                let mut last_error = None;
                for _ in 0..MAX_RETRIES {
                    let permit = match semaphore.acquire().await {
                        Ok(p) => p,
                        Err(e) => {
                            eprintln!("Semaphore acquire failed: {}", e);
                            break;
                        }
                    };

                    match timeout(
                        REQUEST_TIMEOUT,
                        check_link_status(
                            &client,
                            &full_url_str,
                            Arc::clone(&base_url),
                            relative_path.clone(),
                            anchor_text.clone(),
                        ),
                    )
                    .await
                    {
                        Ok(result) => {
                            drop(permit);
                            return Some((result, is_internal));
                        }
                        Err(_) => {
                            last_error = Some("Request timed out".to_string());
                            continue;
                        }
                    }
                }

                // Return error if all retries failed
                Some((
                    LinkStatus {
                        base_url: (*base_url).clone(),
                        url: full_url_str,
                        relative_path,
                        status: None,
                        error: last_error,
                        anchor_text,
                    },
                    is_internal,
                ))
            }));
        }
    }

    // Collect and process results
    let results = join_all(tasks).await;
    let mut internal_statuses = Vec::new();
    let mut external_statuses = Vec::new();

    for result in results {
        match result {
            Ok(Some((status, true))) => internal_statuses.push(status),
            Ok(Some((status, false))) => external_statuses.push(status),
            Ok(None) => {} // Skipped URL
            Err(e) => eprintln!("Task failed: {}", e),
        }
    }

    LinkCheckResults {
        page: (*page_arc).clone(),
        base_url: (*base_url_arc).clone(),
        internal: internal_statuses,
        external: external_statuses,
    }
}

async fn check_link_status(
    client: &Client,
    url: &str,
    base_url_arc: Arc<Url>,
    relative_path: Option<String>,
    anchor_text: Option<String>,
) -> LinkStatus {
    match client.head(url).send().await {
        Ok(response) => LinkStatus {
            base_url: (*base_url_arc).clone(),
            url: url.to_string(),
            relative_path,
            status: Some(response.status().as_u16()),
            error: None,
            anchor_text,
        },
        Err(e) => LinkStatus {
            base_url: (*base_url_arc).clone(),
            url: url.to_string(),
            relative_path,
            status: None,
            error: Some(format!("Request error: {}", e)),
            anchor_text,
        },
    }
}

#[allow(dead_code)]
fn is_internal(url_to_check: &str, base_url: &Url) -> bool {
    Url::parse(url_to_check)
        .map(|parsed_url| {
            parsed_url.scheme() == base_url.scheme() && parsed_url.domain() == base_url.domain()
        })
        .unwrap_or(false)
}
