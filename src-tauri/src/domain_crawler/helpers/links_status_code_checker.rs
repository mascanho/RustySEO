use futures::future::join_all;
use rand::Rng;
use reqwest::{
    header::{HeaderMap, ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, CONNECTION},
    Client, Url,
};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{Mutex, Semaphore};
use tokio::time::timeout;

// Import the correct type from your anchor_links module
use crate::domain_crawler::helpers::anchor_links::InternalExternalLinks;

// Constants
const MAX_CONCURRENT_REQUESTS: usize = 10;
const INITIAL_TASK_CAPACITY: usize = 100;
const MAX_RETRIES: usize = 3;
const REQUEST_TIMEOUT: Duration = Duration::from_secs(15);

// Your existing result types

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LinkStatus {
    pub base_url: Url,
    pub url: String,
    pub relative_path: Option<String>,
    pub status: Option<u16>,
    pub error: Option<String>,
    pub anchor_text: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LinkCheckResults {
    pub page: String,
    pub base_url: Url,
    pub internal: Vec<LinkStatus>,
    pub external: Vec<LinkStatus>,
}

pub async fn get_links_status_code(
    links: Option<InternalExternalLinks>, // Using the correct imported type
    base_url: &Url,
    page: String,
) -> LinkCheckResults {
    // Updated user agents (2024 versions)
    let user_agents = vec![
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0",
    ];

    let client = Arc::new(
        Client::builder()
            .timeout(Duration::from_secs(15))
            .connect_timeout(Duration::from_secs(5))
            .pool_idle_timeout(Duration::from_secs(60))
            .pool_max_idle_per_host(20)
            .user_agent(user_agents[rand::thread_rng().gen_range(0..user_agents.len())])
            .redirect(reqwest::redirect::Policy::limited(5))
            .default_headers({
                let mut headers = HeaderMap::new();
                headers.insert(
                    ACCEPT,
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
                        .parse()
                        .unwrap(),
                );
                headers.insert(ACCEPT_LANGUAGE, "en-US,en;q=0.5".parse().unwrap());
                headers.insert(ACCEPT_ENCODING, "gzip, deflate, br".parse().unwrap());
                headers.insert(CONNECTION, "keep-alive".parse().unwrap());
                headers
            })
            .danger_accept_invalid_certs(false)
            .build()
            .expect("Failed to create HTTP client"),
    );

    let semaphore = Arc::new(Semaphore::new(MAX_CONCURRENT_REQUESTS));
    let base_url_arc = Arc::new(base_url.clone());
    let page_arc = Arc::new(page);
    let seen_urls = Arc::new(Mutex::new(HashSet::with_capacity(INITIAL_TASK_CAPACITY)));

    let mut tasks = Vec::with_capacity(INITIAL_TASK_CAPACITY);

    if let Some(links_data) = links {
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

        for (link, anchor, is_internal) in all_links {
            let client = Arc::clone(&client);
            let semaphore = Arc::clone(&semaphore);
            let base_url = Arc::clone(&base_url_arc);
            let page = page_arc.as_str().to_string();
            let seen_urls = Arc::clone(&seen_urls);

            tasks.push(tokio::spawn(async move {
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

                {
                    let mut seen = seen_urls.lock().await;
                    if !seen.insert(full_url_str.clone()) {
                        return None;
                    }
                }

                let relative_path = is_internal.then(|| link);
                let anchor_text = Some(anchor);

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
                            tokio::time::sleep(Duration::from_millis(500)).await;
                            continue;
                        }
                    }
                }

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

    let results = join_all(tasks).await;
    let mut internal_statuses = Vec::new();
    let mut external_statuses = Vec::new();

    for result in results {
        match result {
            Ok(Some((status, true))) => internal_statuses.push(status),
            Ok(Some((status, false))) => external_statuses.push(status),
            Ok(None) => {}
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
    if let Err(e) = Url::parse(url) {
        return LinkStatus {
            base_url: (*base_url_arc).clone(),
            url: url.to_string(),
            relative_path,
            status: None,
            error: Some(format!("Invalid URL format: {}", e)),
            anchor_text,
        };
    }

    let response = match client.head(url).send().await {
        Ok(res) => Ok(res),
        Err(head_err) => match client.get(url).send().await {
            Ok(res) => Ok(res),
            Err(get_err) => {
                let error_details = if head_err.is_connect() {
                    "Connection failed".to_string()
                } else if head_err.is_timeout() {
                    "Timeout occurred".to_string()
                } else if head_err.is_request() {
                    "Invalid request".to_string()
                } else if head_err.is_body() || head_err.is_decode() {
                    "Response body error".to_string()
                } else {
                    format!("Request error: {}", get_err)
                };

                Err(error_details)
            }
        },
    };

    match response {
        Ok(response) => {
            let status = response.status();
            LinkStatus {
                base_url: (*base_url_arc).clone(),
                url: url.to_string(),
                relative_path,
                status: Some(status.as_u16()),
                error: if status.is_client_error() || status.is_server_error() {
                    Some(format!("HTTP Error: {}", status))
                } else {
                    None
                },
                anchor_text,
            }
        }
        Err(e) => LinkStatus {
            base_url: (*base_url_arc).clone(),
            url: url.to_string(),
            relative_path,
            status: None,
            error: Some(e),
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
