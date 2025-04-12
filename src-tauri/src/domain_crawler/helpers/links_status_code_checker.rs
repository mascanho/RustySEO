use futures::future::join_all;
use rand::seq::SliceRandom;
use reqwest::{
    header::{HeaderMap, ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, CONNECTION},
    Client, Url,
};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{Mutex, Semaphore};
use tokio::task::JoinHandle;
use tokio::time::timeout;

use crate::{
    domain_crawler::{helpers::anchor_links::InternalExternalLinks, user_agents},
    settings::settings::Settings,
};

// Constants
const MAX_CONCURRENT_REQUESTS: usize = 10;
const INITIAL_TASK_CAPACITY: usize = 100;
const MAX_RETRIES: usize = 3;
const REQUEST_TIMEOUT: Duration = Duration::from_secs(15);
const RETRY_DELAY: Duration = Duration::from_millis(500);

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
    links: Option<InternalExternalLinks>,
    base_url: &Url,
    page: String,
    settings: &Settings,
) -> LinkCheckResults {
    let user_agents = user_agents::agents();
    let client = build_client(&user_agents);
    let client = Arc::new(client);

    let semaphore = Arc::new(Semaphore::new(settings.links_max_concurrent_requests));
    let base_url_arc = Arc::new(base_url.clone());
    let page_arc = Arc::new(page);
    let seen_urls = Arc::new(Mutex::new(HashSet::with_capacity(INITIAL_TASK_CAPACITY)));

    let mut tasks: Vec<JoinHandle<Option<(LinkStatus, bool)>>> =
        Vec::with_capacity(INITIAL_TASK_CAPACITY);

    if let Some(links_data) = links {
        for (link, anchor, is_internal) in prepare_links(links_data) {
            spawn_link_check_task(
                &mut tasks,
                client.clone(),
                semaphore.clone(),
                base_url_arc.clone(),
                page_arc.clone(),
                seen_urls.clone(),
                link,
                anchor,
                is_internal,
            );
        }
    }

    process_results(join_all(tasks).await, page_arc, base_url_arc)
}

fn build_client(user_agents: &[String]) -> Client {
    Client::builder()
        .timeout(Duration::from_secs(15))
        .connect_timeout(Duration::from_secs(5))
        .pool_idle_timeout(Duration::from_secs(60))
        .pool_max_idle_per_host(20)
        .user_agent(
            user_agents
                .choose(&mut rand::thread_rng())
                .expect("User agents list should not be empty"),
        )
        .redirect(reqwest::redirect::Policy::limited(5))
        .default_headers(default_headers())
        .danger_accept_invalid_certs(false)
        .build()
        .expect("Failed to create HTTP client")
}

fn default_headers() -> HeaderMap {
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
}

fn prepare_links(
    links_data: InternalExternalLinks,
) -> impl Iterator<Item = (String, String, bool)> {
    links_data
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
        )
}

fn spawn_link_check_task(
    tasks: &mut Vec<JoinHandle<Option<(LinkStatus, bool)>>>,
    client: Arc<Client>,
    semaphore: Arc<Semaphore>,
    base_url: Arc<Url>,
    page: Arc<String>,
    seen_urls: Arc<Mutex<HashSet<String>>>,
    link: String,
    anchor: String,
    is_internal: bool,
) {
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
                    tokio::time::sleep(RETRY_DELAY).await;
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

fn process_results(
    results: Vec<Result<Option<(LinkStatus, bool)>, tokio::task::JoinError>>,
    page_arc: Arc<String>,
    base_url_arc: Arc<Url>,
) -> LinkCheckResults {
    let (mut internal_statuses, mut external_statuses) = (Vec::new(), Vec::new());

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
        return invalid_url_status(base_url_arc, url, relative_path, anchor_text, e);
    }

    match try_head_then_get(client, url).await {
        Ok(response) => {
            handle_success_response(response, base_url_arc, url, relative_path, anchor_text)
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

async fn try_head_then_get(client: &Client, url: &str) -> Result<reqwest::Response, String> {
    // Try HEAD request first
    match client.head(url).send().await {
        Ok(response) => Ok(response),
        Err(head_err) => {
            // Fallback to GET if HEAD fails
            match client.get(url).send().await {
                Ok(response) => Ok(response),
                Err(get_err) => Err(classify_error(&head_err, &get_err)),
            }
        }
    }
}

fn classify_error(head_err: &reqwest::Error, get_err: &reqwest::Error) -> String {
    if head_err.is_connect() || get_err.is_connect() {
        "Connection failed".to_string()
    } else if head_err.is_timeout() || get_err.is_timeout() {
        "Timeout occurred".to_string()
    } else if head_err.is_request() || get_err.is_request() {
        "Invalid request".to_string()
    } else if head_err.is_body() || head_err.is_decode() || get_err.is_body() || get_err.is_decode()
    {
        "Response body error".to_string()
    } else {
        format!("Request error: {}", get_err)
    }
}

fn handle_success_response(
    response: reqwest::Response,
    base_url_arc: Arc<Url>,
    url: &str,
    relative_path: Option<String>,
    anchor_text: Option<String>,
) -> LinkStatus {
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

fn invalid_url_status(
    base_url_arc: Arc<Url>,
    url: &str,
    relative_path: Option<String>,
    anchor_text: Option<String>,
    error: url::ParseError,
) -> LinkStatus {
    LinkStatus {
        base_url: (*base_url_arc).clone(),
        url: url.to_string(),
        relative_path,
        status: None,
        error: Some(format!("Invalid URL format: {}", error)),
        anchor_text,
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
