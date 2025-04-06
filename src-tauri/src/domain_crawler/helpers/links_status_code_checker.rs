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
    pub base_url: Url,                 // Keep Url type as per original struct
    pub url: String,                   // The checked URL (absolute)
    pub relative_path: Option<String>, // Original relative path for internal links
    pub status: Option<u16>,
    pub error: Option<String>,
    pub anchor_text: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinkCheckResults {
    pub page: String,
    pub base_url: Url, // Keep Url type as per original struct
    pub internal: Vec<LinkStatus>,
    pub external: Vec<LinkStatus>,
}

pub async fn get_links_status_code(
    links: Option<InternalExternalLinks>,
    base_url: &Url,
    page: String, // Owned page string
) -> LinkCheckResults {
    // --- Resource Initialization ---
    // Create shared HTTP client with appropriate timeouts. Arc allows sharing across tasks.
    // Consider making timeouts configurable if this function is used in diverse environments.
    let client = Arc::new(
        Client::builder()
            .timeout(Duration::from_secs(15)) // Overall request timeout
            .connect_timeout(Duration::from_secs(5)) // Connection specific timeout
            .pool_idle_timeout(Duration::from_secs(60)) // Keep connections alive longer
            .pool_max_idle_per_host(10) // Allow more idle connections per host
            .user_agent(concat!(
                env!("CARGO_PKG_NAME"),
                "/",
                env!("CARGO_PKG_VERSION")
            )) // Good practice: identify client
            .redirect(reqwest::redirect::Policy::limited(5)) // Follow limited redirects
            .build()
            .expect("Failed to create HTTP client"),
    );

    // Limit concurrent requests to avoid overwhelming the local system or remote servers.
    // 200 might still be high; adjust based on system resources and target server tolerance.
    let semaphore = Arc::new(Semaphore::new(200)); // Reduced concurrency slightly as a safer default

    // Use Arc for base_url and page to avoid cloning them repeatedly for each task.
    let base_url_arc = Arc::new(base_url.clone());
    let page_arc = Arc::new(page); // page is now shared via Arc

    // --- Task Creation ---
    let mut tasks = Vec::new();
    let mut seen_urls = HashSet::new(); // Tracks absolute URLs to avoid duplicate checks

    if let Some(links_data) = links {
        // Combine internal and external links into a single iterator for processing.
        // Include the 'is_internal' flag and original relative path directly.
        let internal_links = links_data
            .internal
            .links
            .into_iter() // Consume the vectors to avoid cloning strings inside the loop if possible
            .zip(links_data.internal.anchors.into_iter())
            .map(|(link, anchor)| (link.clone(), anchor.clone(), true)); // Clone here once if needed, or pass ownership if InternalExternalLinks is consumed

        let external_links = links_data
            .external
            .links
            .into_iter()
            .zip(links_data.external.anchors.into_iter())
            .map(|(link, anchor)| (link.clone(), anchor.clone(), false)); // Clone here once if needed

        let all_links = internal_links.chain(external_links);

        for (link_str, anchor_text, is_internal) in all_links {
            // Resolve the relative link to an absolute URL if necessary.
            let full_url_result = if is_internal {
                // base_url_arc holds the Arc<Url>, deref to get &Url for join
                base_url_arc.join(&link_str)
            } else {
                Url::parse(&link_str)
            };

            let full_url = match full_url_result {
                Ok(u) => u,
                Err(e) => {
                    // Log problematic URLs but continue processing others.
                    // Consider collecting these errors instead of just printing.
                    eprintln!(
                        "Skipping invalid URL '{}' on page '{}': {}",
                        link_str,
                        page_arc.as_str(), // Access page string via Arc
                        e
                    );
                    continue; // Skip this link
                }
            };

            let full_url_str = full_url.to_string();

            // Check if this absolute URL has already been scheduled for checking.
            // Use entry API for efficiency.
            if !seen_urls.insert(full_url_str.clone()) {
                continue; // Skip duplicate URL
            }

            // --- Prepare data for the asynchronous task ---
            // Clone Arcs (cheap) and necessary owned data (link_str, anchor_text).
            let client_task = Arc::clone(&client);
            let semaphore_task = Arc::clone(&semaphore);
            let base_url_task = Arc::clone(&base_url_arc);
            // page_arc is not needed in check_link_status anymore
            // full_url_str is already an owned String
            let relative_path_task = if is_internal { Some(link_str) } else { None }; // Store original relative path if internal
            let anchor_text_task = Some(anchor_text); // Assume anchor text is always present per original logic

            // Spawn a task to check this link's status concurrently.
            tasks.push(tokio::spawn(async move {
                // Acquire semaphore permit, limits concurrency. RAII ensures release.
                let _permit = semaphore_task
                    .acquire()
                    .await
                    .expect("Semaphore acquire failed"); // Consider error handling instead of expect

                // Perform the actual HTTP check.
                let status_result = check_link_status(
                    &client_task,
                    &full_url_str, // Pass the absolute URL string
                    base_url_task, // Pass the Arc<Url>
                    relative_path_task,
                    anchor_text_task,
                )
                .await;

                // Return the result along with the is_internal flag to avoid re-calculating later.
                (status_result, is_internal)
            }));
        }
    }

    // --- Result Collection and Processing ---
    // Wait for all spawned tasks to complete.
    let results = join_all(tasks).await;

    // Separate results into internal and external link statuses.
    let mut internal_statuses = Vec::new();
    let mut external_statuses = Vec::new();

    for result in results {
        match result {
            Ok((status, is_internal_res)) => {
                // Use the is_internal flag returned by the task.
                if is_internal_res {
                    internal_statuses.push(status);
                } else {
                    external_statuses.push(status);
                }
            }
            Err(e) => {
                // Log errors from tasks that panicked or were cancelled.
                eprintln!("Link checking task failed: {}", e);
                // Consider collecting these errors as well.
            }
        }
    }

    // Return the aggregated results.
    LinkCheckResults {
        page: (*page_arc).clone(), // Clone the String from the Arc for the final result
        base_url: (*base_url_arc).clone(), // Clone the Url from the Arc for the final result
        internal: internal_statuses,
        external: external_statuses,
    }
}

// Optimized check_link_status function
async fn check_link_status(
    client: &Client,
    url: &str,                     // The absolute URL to check
    base_url_arc: Arc<Url>,        // Use Arc<Url> directly
    relative_path: Option<String>, // Original relative path for internal links
    anchor_text: Option<String>,
) -> LinkStatus {
    // Use a timeout for the request operation itself.
    // The client timeout acts as an overall deadline, this adds a specific one for the HEAD request.
    // Consider if nested timeouts are necessary or if client.timeout is sufficient.
    let request_timeout = Duration::from_secs(10);

    match timeout(request_timeout, client.head(url).send()).await {
        // Outer Ok: timeout did not elapse
        // Inner Ok: Request succeeded (got a response, possibly error status code)
        Ok(Ok(response)) => LinkStatus {
            // Clone the Url from the Arc for the LinkStatus struct
            base_url: (*base_url_arc).clone(),
            url: url.to_string(),
            relative_path,
            status: Some(response.status().as_u16()),
            error: None, // No network/request error, status code indicates link health
            anchor_text,
        },
        // Outer Ok: timeout did not elapse
        // Inner Err: Request failed (network error, DNS error, connection refused, etc.)
        Ok(Err(e)) => LinkStatus {
            base_url: (*base_url_arc).clone(),
            url: url.to_string(),
            relative_path,
            status: None, // No status code available
            error: Some(format!("Request error: {}", e)),
            anchor_text,
        },
        // Outer Err: timeout elapsed
        Err(_) => LinkStatus {
            base_url: (*base_url_arc).clone(),
            url: url.to_string(),
            relative_path,
            status: None,
            error: Some(format!(
                "Request timed out after {} seconds",
                request_timeout.as_secs()
            )),
            anchor_text,
        },
    }
}

// This function is no longer needed in the main path, as the 'is_internal'
// flag is determined once and passed through the task.
// Kept here for reference or if needed elsewhere, but can be removed if unused.
#[allow(dead_code)]
fn is_internal(url_to_check: &str, base_url: &Url) -> bool {
    match Url::parse(url_to_check) {
        Ok(parsed_url) => {
            // Compare scheme and domain. Consider comparing port too if relevant.
            parsed_url.scheme() == base_url.scheme() && parsed_url.domain() == base_url.domain()
            // Add port comparison if needed: && parsed_url.port_or_known_default() == base_url.port_or_known_default()
        }
        Err(_) => false, // If parsing fails, treat as not internal (or handle error differently)
    }
}
