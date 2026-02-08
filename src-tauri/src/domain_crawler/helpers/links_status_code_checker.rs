use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use std::time::{Duration, Instant};

use futures::{stream, StreamExt};
use rand::seq::IndexedRandom;
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
use crate::settings::settings::Settings;

#[derive(Debug, Clone)]
pub struct LinkCheckConfig {
    pub concurrent_requests: usize,
    pub min_delay_ms: u64,
    pub max_delay_ms: u64,
    pub max_retries: usize,
    pub request_timeout_secs: u64,
    pub jitter_factor: f32,
    pub max_requests_per_domain: usize,
    pub initial_task_capacity: usize,
    pub retry_delay_ms: u64,
    pub connection_timeout_secs: u64,
    pub pool_idle_timeout_secs: u64,
    pub pool_max_idle_per_host: usize,
}

impl From<&Settings> for LinkCheckConfig {
    fn from(settings: &Settings) -> Self {
        Self {
            concurrent_requests: settings.links_max_concurrent_requests,
            min_delay_ms: settings.links_retry_delay,
            max_delay_ms: settings.links_retry_delay * 2,
            max_retries: settings.links_max_retries,
            request_timeout_secs: settings.links_request_timeout,
            jitter_factor: settings.links_jitter_factor,
            max_requests_per_domain: settings.max_urls_per_domain,
            initial_task_capacity: settings.links_initial_task_capacity,
            retry_delay_ms: settings.links_retry_delay,
            connection_timeout_secs: settings.client_connect_timeout,
            pool_idle_timeout_secs: settings.links_pool_idle_timeout,
            pool_max_idle_per_host: settings.links_max_idle_per_host,
        }
    }
}

impl LinkCheckConfig {
    pub fn from_settings(settings: &Settings) -> Self {
        Self::from(settings)
    }
}

pub struct SharedLinkChecker {
    client: Arc<Client>,
    domain_tracker: Arc<DomainTracker>,
    semaphore: Arc<Semaphore>,
    pub config: LinkCheckConfig,
}

impl SharedLinkChecker {
    pub fn new(settings: &Settings) -> Self {
        let config = LinkCheckConfig::from_settings(settings);
        let client = build_client(&config);
        SharedLinkChecker {
            client: Arc::new(client),
            domain_tracker: Arc::new(DomainTracker::new(&config)),
            semaphore: Arc::new(Semaphore::new(config.concurrent_requests)),
            config,
        }
    }

    pub async fn check_links(
        &self,
        links: Option<InternalExternalLinks>,
        base_url: &Url,
        page: String,
    ) -> LinkCheckResults {
        let base_url_arc = Arc::new(base_url.clone());
        let page_arc = Arc::new(page);
        let seen_urls = Arc::new(Mutex::new(HashSet::with_capacity(
            self.config.initial_task_capacity,
        )));

        let mut results = Vec::new();

        if let Some(links_data) = links {
            let links_iter = prepare_links(links_data);
            
            let mut stream = stream::iter(links_iter)
                .map(|(link, anchor, rel, title, target, is_internal)| {
                    let client = self.client.clone();
                    let semaphore = self.semaphore.clone();
                    let base_url_arc = base_url_arc.clone();
                    let page_arc = page_arc.clone();
                    let seen_urls = seen_urls.clone();
                    let domain_tracker = self.domain_tracker.clone();
                    let config = self.config.clone();

                    async move {
                        process_single_link(
                            client,
                            semaphore,
                            base_url_arc,
                            page_arc,
                            seen_urls,
                            domain_tracker,
                            link,
                            anchor,
                            rel,
                            title,
                            target,
                            is_internal,
                            config,
                        )
                        .await
                    }
                })
                .buffer_unordered(self.config.concurrent_requests);

            while let Some(result) = stream.next().await {
                if let Some(res) = result {
                    results.push(res);
                }
            }
        }

        process_results(results, page_arc, base_url_arc)
    }
}

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

struct DomainTracker {
    last_request: Mutex<HashMap<String, Instant>>,
    delays: Mutex<HashMap<String, Duration>>,
    request_counts: Mutex<HashMap<String, usize>>,
    config: LinkCheckConfig,
}

impl DomainTracker {
    fn new(config: &LinkCheckConfig) -> Self {
        DomainTracker {
            last_request: Mutex::new(HashMap::new()),
            delays: Mutex::new(HashMap::new()),
            request_counts: Mutex::new(HashMap::new()),
            config: config.clone(),
        }
    }

    async fn get_delay_for(&self, domain: &str) -> Duration {
        let delays = self.delays.lock().await;
        delays
            .get(domain)
            .copied()
            .unwrap_or(Duration::from_millis(self.config.min_delay_ms))
    }

    async fn update_delay_for(&self, domain: &str, response: &reqwest::Response) {
        let mut delays = self.delays.lock().await;
        if response.status() == 429 {
            // Increase delay for this domain
            let current = delays
                .entry(domain.to_string())
                .or_insert(Duration::from_millis(self.config.min_delay_ms));
            *current = (*current * 2).min(Duration::from_secs(5));
        } else if response.status().is_success() {
            // Gradually decrease delay for well-behaved domains
            if let Some(delay) = delays.get_mut(domain) {
                *delay = (*delay / 2).max(Duration::from_millis(self.config.retry_delay_ms));
            }
        }
    }

    async fn should_throttle(&self, domain: &str) -> bool {
        let mut counts = self.request_counts.lock().await;
        let count = counts.entry(domain.to_string()).or_insert(0);
        *count += 1;
        *count > self.config.max_requests_per_domain
    }

    async fn record_request(&self, domain: &str) {
        let mut last_request = self.last_request.lock().await;
        last_request.insert(domain.to_string(), Instant::now());
    }
}

pub async fn get_links_status_code(
    links: Option<InternalExternalLinks>,
    base_url: &Url,
    page: String,
    config: LinkCheckConfig,
) -> LinkCheckResults {
    let settings = Settings::default(); // Fallback
    let checker = SharedLinkChecker::new(&settings);
    checker.check_links(links, base_url, page).await
}

pub async fn get_links_status_code_from_settings(
    links: Option<InternalExternalLinks>,
    base_url: &Url,
    page: String,
    settings: &Settings,
) -> LinkCheckResults {
    let checker = SharedLinkChecker::new(settings);
    checker.check_links(links, base_url, page).await
}

fn build_client(config: &LinkCheckConfig) -> Client {
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
        .timeout(Duration::from_secs(config.request_timeout_secs))
        .connect_timeout(Duration::from_secs(config.connection_timeout_secs))
        .pool_idle_timeout(Duration::from_secs(config.pool_idle_timeout_secs))
        .pool_max_idle_per_host(config.pool_max_idle_per_host)
        .user_agent(user_agents::agents().choose(&mut rand::rng()).unwrap())
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

async fn process_single_link(
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
    config: LinkCheckConfig,
) -> Option<(LinkStatus, bool)> {
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

    let relative_path = is_internal.then(|| link.clone());
    let anchor_text = Some(anchor.clone());

    // Check if we should throttle this domain
    if domain_tracker.should_throttle(&domain).await {
        return Some((
            LinkStatus {
                base_url: (*base_url).clone(),
                url: full_url_str,
                relative_path,
                status: None,
                error: Some("Throttled: Max requests per domain reached".to_string()),
                anchor_text,
                rel,
                title,
                target,
            },
            is_internal,
        ));
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
        &config,
    )
    .await;

    domain_tracker.record_request(&domain).await;

    Some((result, is_internal))
}

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
    config: &LinkCheckConfig,
) -> LinkStatus {
    let mut attempt = 0;
    let mut last_error = None;

    loop {
        // Get domain-specific delay
        let delay = domain_tracker.get_delay_for(domain).await;
        if delay.as_millis() > 0 {
            sleep(delay).await;
        }

        let permit = match Semaphore::acquire_owned(semaphore.clone()).await {
            Ok(p) => p,
            Err(_) => {
                last_error = Some("Semaphore acquire failed".to_string());
                break;
            }
        };

        match timeout(
            Duration::from_secs(config.request_timeout_secs),
            try_head_then_get(client, url),
        )
        .await
        {
            Ok(Ok(response)) => {
                domain_tracker.update_delay_for(domain, &response).await;
                drop(permit);
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

        attempt += 1;
        if attempt >= config.max_retries {
            break;
        }

        // Exponential backoff with jitter
        let base_delay = config.retry_delay_ms * 2u64.pow(attempt as u32 - 1);
        let jitter =
            (base_delay as f32 * config.jitter_factor * rand::random_range(-1.0..1.0)) as i64;
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
    results: Vec<(LinkStatus, bool)>,
    page_arc: Arc<String>,
    base_url_arc: Arc<Url>,
) -> LinkCheckResults {
    let (mut internal_statuses, mut external_statuses) = (Vec::new(), Vec::new());

    for (status, is_internal) in results {
        if is_internal {
            internal_statuses.push(status);
        } else {
            external_statuses.push(status);
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
        Ok(response) => Ok(response),
        Err(_head_err) => {
            // Fallback to GET if HEAD fails
            match client.get(url).send().await {
                Ok(response) => Ok(response),
                Err(get_err) => Err(get_err),
            }
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
            let base_domain = base_url.domain().unwrap_or("");
            let url_domain = parsed_url.domain().unwrap_or("");
            url_domain.ends_with(base_domain)
        })
        .unwrap_or(false)
}
