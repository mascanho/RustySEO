use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use std::time::{Duration, Instant};

use futures::future::join_all;
use rand::seq::SliceRandom;
use rand::Rng;
use reqwest::{
    header::{
        HeaderMap, ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, CACHE_CONTROL, CONNECTION, DNT,
        UPGRADE_INSECURE_REQUESTS,
    },
    Client, Url,
};
use serde::{Deserialize, Serialize};
use tokio::sync::{Mutex, Semaphore};
use tokio::task::{JoinError, JoinHandle};
use tokio::time::{sleep, timeout};

use crate::domain_crawler::{helpers::anchor_links::InternalExternalLinks, user_agents};

// Constants configuration
const MAX_CONCURRENT_REQUESTS: usize = 10; // Increased slightly
const MIN_DELAY_MS: u64 = 500; // Decreased for faster but still safe crawling
const MAX_DELAY_MS: u64 = 5000; // Increased to handle aggressive rate limiting
const MAX_RETRIES: usize = 3;
const REQUEST_TIMEOUT_SECS: u64 = 15;
const JITTER_FACTOR: f32 = 0.3;
const MAX_REQUESTS_PER_DOMAIN: usize = 50;
const INITIAL_TASK_CAPACITY: usize = 100;
const CONNECTION_TIMEOUT_SECS: u64 = 5;
const POOL_IDLE_TIMEOUT_SECS: u64 = 60;
const POOL_MAX_IDLE_PER_HOST: usize = 10;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LinkStatus {
    pub base_url: Url,
    pub url: String,
    pub relative_path: Option<String>,
    pub status: Option<u16>,
    pub error: Option<String>,
    pub anchor_text: Option<String>,
    pub rel: Option<String>,
    pub title: Option<String>,
    pub target: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LinkCheckResults {
    pub page: String,
    pub base_url: Url,
    pub internal: Vec<LinkStatus>,
    pub external: Vec<LinkStatus>,
}

// New DomainState struct
struct DomainState {
    last_request: Instant,
    delay: Duration,
    request_count: usize,
}

impl Default for DomainState {
    fn default() -> Self {
        Self {
            // Set last_request in the past to allow the first request to be immediate
            last_request: Instant::now()
                .checked_sub(Duration::from_secs(60))
                .unwrap_or_else(Instant::now),
            delay: Duration::from_millis(MIN_DELAY_MS),
            request_count: 0,
        }
    }
}

// Rewritten DomainTracker
struct DomainTracker {
    domains: Mutex<HashMap<String, DomainState>>,
}

impl DomainTracker {
    fn new() -> Self {
        DomainTracker {
            domains: Mutex::new(HashMap::new()),
        }
    }

    async fn wait_for_domain(&self, domain: &str) {
        let mut domains = self.domains.lock().await;
        let state = domains.entry(domain.to_string()).or_default();

        let elapsed = state.last_request.elapsed();
        if elapsed < state.delay {
            sleep(state.delay - elapsed).await;
        }
        // Update last request time after waiting
        state.last_request = Instant::now();
    }

    async fn update_delay_for(&self, domain: &str, response: &reqwest::Response) {
        let mut domains = self.domains.lock().await;
        let state = domains.entry(domain.to_string()).or_default();

        if response.status() == 429 {
            // Increase delay exponentially on "Too Many Requests"
            state.delay = (state.delay * 2).min(Duration::from_millis(MAX_DELAY_MS));
        } else if response.status().is_success() {
            // Gradually decrease delay for well-behaved domains
            state.delay = (state.delay / 2).max(Duration::from_millis(MIN_DELAY_MS));
        }
    }

    async fn should_throttle(&self, domain: &str) -> bool {
        let mut domains = self.domains.lock().await;
        let state = domains.entry(domain.to_string()).or_default();
        state.request_count += 1;
        state.request_count > MAX_REQUESTS_PER_DOMAIN
    }
}


pub async fn get_links_status_code(
    links: Option<InternalExternalLinks>,
    base_url: &Url,
    page: String,
) -> LinkCheckResults {
    let client = build_client();
    let client = Arc::new(client);
    let domain_tracker = Arc::new(DomainTracker::new()); // Using the new tracker

    let semaphore = Arc::new(Semaphore::new(MAX_CONCURRENT_REQUESTS));
    let base_url_arc = Arc::new(base_url.clone());
    let page_arc = Arc::new(page);
    let seen_urls = Arc::new(Mutex::new(HashSet::with_capacity(INITIAL_TASK_CAPACITY)));

    let mut tasks: Vec<JoinHandle<Option<(LinkStatus, bool)>>> =
        Vec::with_capacity(INITIAL_TASK_CAPACITY);

    if let Some(links_data) = links {
        for (link, anchor, rel, title, target, is_internal) in prepare_links(links_data) {
            spawn_link_check_task(
                &mut tasks,
                client.clone(),
                semaphore.clone(),
                base_url_arc.clone(),
                page_arc.clone(),
                seen_urls.clone(),
                domain_tracker.clone(),
                link,
                anchor,
                rel,
                title,
                target,
                is_internal,
            );
        }
    }

    process_results(join_all(tasks).await, page_arc, base_url_arc)
}

fn build_client() -> Client {
    let mut headers = HeaderMap::new();
    headers.insert(
        ACCEPT,
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
            .parse()
            .unwrap(),
    );
    headers.insert(ACCEPT_LANGUAGE, "en-US,en;q=0.9".parse().unwrap());
    headers.insert(ACCEPT_ENCODING, "gzip, deflate, br".parse().unwrap());
    headers.insert(CONNECTION, "keep-alive".parse().unwrap());
    headers.insert(CACHE_CONTROL, "no-cache".parse().unwrap());
    headers.insert(DNT, "1".parse().unwrap());
    headers.insert(UPGRADE_INSECURE_REQUESTS, "1".parse().unwrap());

    Client::builder()
        .timeout(Duration::from_secs(REQUEST_TIMEOUT_SECS))
        .connect_timeout(Duration::from_secs(CONNECTION_TIMEOUT_SECS))
        .pool_idle_timeout(Duration::from_secs(POOL_IDLE_TIMEOUT_SECS))
        .pool_max_idle_per_host(POOL_MAX_IDLE_PER_HOST)
        .user_agent(
            user_agents::agents()
                .choose(&mut rand::thread_rng())
                .unwrap(),
        )
        .redirect(reqwest::redirect::Policy::limited(5))
        .default_headers(headers)
        .danger_accept_invalid_certs(false)
        .build()
        .expect("Failed to create HTTP client")
}

fn prepare_links(
    links_data: InternalExternalLinks,
) -> impl Iterator<
    Item = (
        String,
        String,
        Option<String>,
        Option<String>,
        Option<String>,
        bool,
    ),
> {
    links_data
        .internal
        .links
        .into_iter()
        .zip(links_data.internal.anchors.into_iter())
        .zip(links_data.internal.rels.into_iter())
        .zip(links_data.internal.titles.into_iter())
        .zip(links_data.internal.targets.into_iter())
        .map(|((((link, anchor), rel), title), target)| (link, anchor, rel, title, target, true))
        .chain(
            links_data
                .external
                .links
                .into_iter()
                .zip(links_data.external.anchors.into_iter())
                .zip(links_data.external.rels.into_iter())
                .zip(links_data.external.titles.into_iter())
                .zip(links_data.external.targets.into_iter())
                .map(|((((link, anchor), rel), title), target)| {
                    (link, anchor, rel, title, target, false)
                }),
        )
}

fn spawn_link_check_task(
    tasks: &mut Vec<JoinHandle<Option<(LinkStatus, bool)>>>,
    client: Arc<Client>,
    semaphore: Arc<Semaphore>,
    base_url: Arc<Url>,
    page: Arc<String>,
    seen_urls: Arc<Mutex<HashSet<String>>>,
    domain_tracker: Arc<DomainTracker>,
    link: String,
    anchor: String,
    rel: Option<String>,
    title: Option<String>,
    target: Option<String>,
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
        let domain = full_url.domain().unwrap_or("").to_string();

        {
            let mut seen = seen_urls.lock().await;
            if !seen.insert(full_url_str.clone()) {
                return None;
            }
        }

        if domain_tracker.should_throttle(&domain).await {
            return None;
        }

        let relative_path = is_internal.then(|| link);
        let anchor_text = Some(anchor);

        let result = fetch_with_retry(
            &client,
            &full_url_str,
            &domain,
            &domain_tracker,
            Arc::clone(&base_url),
            relative_path.clone(),
            anchor_text.clone(),
            rel,
            title,
            target,
            Arc::clone(&semaphore),
        )
        .await;

        Some((result, is_internal))
    }));
}

// Updated fetch_with_retry
async fn fetch_with_retry(
    client: &Client,
    url: &str,
    domain: &str,
    domain_tracker: &DomainTracker,
    base_url: Arc<Url>,
    relative_path: Option<String>,
    anchor_text: Option<String>,
    rel: Option<String>,
    title: Option<String>,
    target: Option<String>,
    semaphore: Arc<Semaphore>,
) -> LinkStatus {
    let mut attempt = 0;
    let mut last_error = None;

    loop {
        // Wait for the domain-specific delay before acquiring a global semaphore permit
        domain_tracker.wait_for_domain(domain).await;

        let permit = match Semaphore::acquire_owned(semaphore.clone()).await {
            Ok(p) => p,
            Err(_) => {
                last_error = Some("Semaphore acquire failed".to_string());
                break;
            }
        };

        match timeout(
            Duration::from_secs(REQUEST_TIMEOUT_SECS),
            try_head_then_get(client, url),
        )
        .await
        {
            Ok(Ok(response)) => {
                domain_tracker.update_delay_for(domain, &response).await;
                drop(permit); // Release semaphore permit
                return handle_success_response(
                    response,
                    base_url,
                    url,
                    relative_path,
                    anchor_text,
                    rel,
                    title,
                    target,
                );
            }
            Ok(Err(e)) => {
                last_error = Some(e.to_string());
            }
            Err(_) => {
                last_error = Some("Request timeout".to_string());
            }
        }

        // Drop permit if not already dropped
        drop(permit);

        attempt += 1;
        if attempt >= MAX_RETRIES {
            break;
        }

        // Exponential backoff with jitter for retries
        let base_delay = MIN_DELAY_MS * 2u64.pow(attempt as u32);
        let jitter =
            (base_delay as f32 * JITTER_FACTOR * rand::thread_rng().gen_range(-1.0..1.0)) as i64;
        let delay = (base_delay as i64 + jitter).max(0) as u64;
        sleep(Duration::from_millis(delay)).await;
    }

    LinkStatus {
        base_url: (*base_url).clone(),
        url: url.to_string(),
        relative_path,
        status: None,
        error: last_error,
        anchor_text,
        rel,
        title,
        target,
    }
}


fn process_results(
    results: Vec<Result<Option<(LinkStatus, bool)>, JoinError>>,
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

async fn try_head_then_get(
    client: &Client,
    url: &str,
) -> Result<reqwest::Response, reqwest::Error> {
    // Try HEAD request first
    match client.head(url).send().await {
        Ok(response) if response.status().is_success() => Ok(response),
        _ => {
            // Fallback to GET if HEAD fails or returns a non-success status
            client.get(url).send().await
        }
    }
}

fn handle_success_response(
    response: reqwest::Response,
    base_url: Arc<Url>,
    url: &str,
    relative_path: Option<String>,
    anchor_text: Option<String>,
    rel: Option<String>,
    title: Option<String>,
    target: Option<String>,
) -> LinkStatus {
    let status = response.status();
    LinkStatus {
        base_url: (*base_url).clone(),
        url: url.to_string(),
        relative_path,
        status: Some(status.as_u16()),
        error: if status.is_client_error() || status.is_server_error() {
            Some(format!("HTTP Error: {}", status))
        } else {
            None
        },
        anchor_text,
        rel,
        title,
        target,
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
