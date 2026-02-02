//! URL processing logic for the domain crawler

use colored::*;
use reqwest::Client;
use scraper::Html;
use std::io::Write;
use std::sync::Arc;
use std::time::Instant;
use tauri::Emitter;
use tokio::sync::{Mutex, Semaphore};
use tokio::task;
use tokio::time::{sleep, Duration};
use url::Url;

use crate::domain_crawler::extractors::html::{perform_extraction, update_cache};
use crate::domain_crawler::helpers::cookies;
use crate::domain_crawler::helpers::extract_url_pattern::extract_url_pattern;
use crate::domain_crawler::helpers::fetch_with_exponential::fetch_with_exponential_backoff;
use crate::domain_crawler::helpers::https_checker::valid_https;
use crate::domain_crawler::helpers::normalize_url::normalize_url;
use crate::domain_crawler::helpers::skip_url::should_skip_url;
use crate::domain_crawler::helpers::{headless_fetch, opengraph, url_depth};
use crate::domain_crawler::models::Extractor;
use crate::settings;
use crate::settings::settings::Settings;

use super::constants::{MAX_DEPTH, MAX_URLS_PER_DOMAIN};
use super::helpers::canonical_selector::get_canonical;
use super::helpers::cross_origin::analyze_cross_origin_security;
use super::helpers::flesch_reader::get_flesch_score;
use super::helpers::hreflang_selector::select_hreflang;
use super::helpers::html_size_calculator::calculate_html_size;
use super::helpers::keyword_selector::extract_keywords;
use super::helpers::language_selector::detect_language;
use super::helpers::links_status_code_checker::get_links_status_code_from_settings;
use super::helpers::meta_robots_selector::{get_meta_robots, MetaRobots};
use super::helpers::text_ratio::{get_text_ratio, TextRatio};
use super::helpers::{
    alt_tags, anchor_links, check_html_page, css_selector, headings_selector, iframe_selector,
    images_selector, indexability, javascript_selector, links_selector, mobile_checker, ngrams,
    page_description, schema_selector, title_selector, word_count::get_word_count,
};
use super::models::DomainCrawlResults;
use super::page_speed::bulk::fetch_psi_bulk;
use super::state::{CrawlResultData, CrawlerState, FailedUrl, ProgressData};

/// Process a single URL and extract all relevant data
pub async fn process_url(
    url: Url,
    depth: usize,
    client: &Client,
    base_url: &Url,
    state: Arc<Mutex<CrawlerState>>,
    app_handle: &tauri::AppHandle,
    settings: &Settings,
    js_semaphore: Arc<Semaphore>,
) -> Result<DomainCrawlResults, String> {
    let mut current_url = url.clone();
    let mut redirect_chain = Vec::new();
    let mut redirect_count = 0;
    let mut had_redirect = false;
    let mut redirection_type = None;
    let mut final_response = None;
    let mut total_time = 0.0;

    // Follow redirects manually to track the chain
    while redirect_count < 10 {
        let response_result = tokio::time::timeout(
            Duration::from_secs(30),
            fetch_with_exponential_backoff(client, current_url.as_str(), settings),
        )
        .await;

        match response_result {
            Ok(Ok((response, time))) => {
                total_time += time;
                let status = response.status();
                let status_code = status.as_u16();

                redirect_chain.push(crate::domain_crawler::models::RedirectHop {
                    url: current_url.to_string(),
                    status_code,
                });

                if status.is_redirection() {
                    had_redirect = true;
                    if redirection_type.is_none() {
                        redirection_type = Some(format!("{} Redirect", status_code));
                    }

                    if let Some(location) = response.headers().get("location") {
                        if let Ok(location_str) = location.to_str() {
                            match current_url.join(location_str) {
                                Ok(next_url) => {
                                    // Check for infinite loops
                                    if redirect_chain
                                        .iter()
                                        .any(|hop| hop.url == next_url.to_string())
                                    {
                                        final_response = Some(response);
                                        break;
                                    }
                                    current_url = next_url;
                                    redirect_count += 1;
                                    continue;
                                }
                                Err(_) => {
                                    final_response = Some(response);
                                    break;
                                }
                            }
                        }
                    }
                }
                final_response = Some(response);
                break;
            }
            Ok(Err(e)) => {
                let mut state = state.lock().await;
                state.failed_urls.insert(FailedUrl {
                    url: url.to_string(),
                    error: e.to_string(),
                    retries: 0,
                    depth,
                    timestamp: Instant::now(),
                });
                state.pending_urls.remove(url.as_str());
                return Err(format!("Failed to fetch {}: {}", url, e));
            }
            Err(_) => {
                let mut state = state.lock().await;
                state.failed_urls.insert(FailedUrl {
                    url: url.to_string(),
                    error: "Timeout fetching".to_string(),
                    retries: 0,
                    depth,
                    timestamp: Instant::now(),
                });
                state.pending_urls.remove(url.as_str());
                return Err(format!("Timeout fetching {}", url));
            }
        }
    }

    let response = final_response.ok_or_else(|| "Failed to get response".to_string())?;
    let response_time = total_time;

    let final_url = response.url().clone();
    let status_code = response.status().as_u16();

    let redirect_url = if had_redirect {
        Some(final_url.to_string())
    } else {
        None
    };

    // Log redirects occasionally for debugging (sampled to avoid performance hit)
    if had_redirect && rand::random_range(0..50) == 0 {
        // ~2% sampling rate
        println!(
            "Redirect: {} -> {} (status: {}, hops: {})",
            url, final_url, status_code, redirect_count
        );
    }

    // check if the url is https or not
    let https = valid_https(&final_url);

    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|h| h.to_str().ok())
        .map(String::from);

    let headers = response
        .headers()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
        .collect::<Vec<_>>();

    let mut cookies_data = cookies::extract_cookies(&response);

    if response.headers().contains_key("cf-ray")
        || response.headers().contains_key("x-cdn")
        || response.headers().contains_key("x-cache")
    {
        sleep(Duration::from_secs(2)).await;
    }

    let mut body = match response.text().await {
        Ok(body) => body,
        Err(e) => {
            let mut state = state.lock().await;
            state.failed_urls.insert(FailedUrl {
                url: url.to_string(),
                error: e.to_string(),
                retries: 0,
                depth,
                timestamp: Instant::now(),
            });
            return Err(format!("Failed to read response body: {}", e));
        }
    };

    // If Javascript Rendering is enabled and content is HTML, re-fetch via Headless Chrome
    if settings.javascript_rendering
        && check_html_page::is_html_page(&body, content_type.as_deref()).await
    {
        let js_url = final_url.to_string();
        let js_semaphore_clone = js_semaphore.clone();

        // Use a separate task for blocking IO of headless chrome, protected by semaphore
        let js_fetch_future = async move {
            // Acquire permit asynchronously
            let _permit = js_semaphore_clone
                .acquire()
                .await
                .map_err(|e| e.to_string())?;

            // Run blocking Chrome operation
            task::spawn_blocking(move || headless_fetch::fetch_js_body(&js_url))
                .await
                .map_err(|e| e.to_string())?
        };

        match js_fetch_future.await {
            Ok((js_body, js_cookies)) => {
                body = js_body;
                // Merge JS cookies with existing cookies
                // We use a HashSet (implicitly by iterating) or just append and dedup?
                // Simple append is fine, the frontend can handle duplicates or we can dedup here if needed.
                // Let's dedup by name if possible, but "cookie=value" strings are opaque here.
                // Just appending is safer to avoid losing data.
                cookies_data.extend(js_cookies);

                // Deduplicate cookies
                cookies_data.sort();
                cookies_data.dedup();
            }
            Err(e) => {
                println!(
                    "Failed to render JS for {}: {}. Falling back to static content.",
                    final_url, e
                );
            }
        }
    }

    let mut pdf_files: Vec<String> = Vec::new();
    if !check_html_page::is_html_page(&body, content_type.as_deref()).await {
        pdf_files.push(url.to_string());

        let mut state = state.lock().await;
        state.crawled_urls += 1;
        state.visited.insert(url.to_string());
        state.pending_urls.remove(url.as_str());
        state.last_activity = Instant::now();
        return Ok(DomainCrawlResults {
            url: final_url.to_string(),
            status_code,
            pdf_files,
            original_url: url.to_string(), // Store original URL
            redirect_url,                  // Store redirect URL if any
            had_redirect,                  // Boolean flag for easy filtering
            redirection_type,              // Type of redirect
            redirect_chain: Some(redirect_chain.clone()), // Full redirect chain
            redirect_count,                // Number of hops
            content_length: body.len(),
            page_size: calculate_html_size(Some(body.len())),
            ..Default::default()
        });
    }

    // Update the custom HTML extractor cache before parsing
    let _ = update_cache().await;

    // Perform all synchronous extractions in a scoped block to ensure `document` (non-Send)
    // is dropped before any `.await` points.
    let (
        title,
        description,
        headings,
        javascript_data,
        image_urls_for_fetch,
        internal_external_links,
        indexability_data,
        alt_tags_data,
        schema_data,
        css_data,
        iframe_data,
        word_count_val,
        mobile_val,
        canonicals_val,
        meta_robots_val,
        text_ratio_val,
        keywords_val,
        hreflangs_val,
        language_val,
        flesch_val,
        html_extractor_val,
        cross_origin_data,
        links_for_crawler,
        _ngrams_data,
    ) = {
        let document = Html::parse_document(&body);

        (
            title_selector::extract_title(&document),
            page_description::extract_page_description(&document).unwrap_or_default(),
            headings_selector::headings_selector(&document),
            if settings.javascript_rendering {
                javascript_selector::extract_javascript(&document, &final_url)
            } else {
                javascript_selector::JavaScript::default()
            },
            images_selector::extract_image_urls_and_alts(&document, &final_url),
            anchor_links::extract_internal_external_links(&document, &final_url, base_url),
            indexability::extract_indexability(&document),
            alt_tags::get_alt_tags(&document),
            schema_selector::get_schema(&document),
            css_selector::extract_css(&document, &final_url),
            iframe_selector::extract_iframe(&document),
            get_word_count(&document),
            mobile_checker::is_mobile(&document),
            get_canonical(&document).map(|c| c.canonicals),
            get_meta_robots(&document).unwrap_or(MetaRobots {
                meta_robots: Vec::new(),
            }),
            get_text_ratio(&document),
            extract_keywords(&document, &settings.stop_words),
            select_hreflang(&document),
            detect_language(&document),
            get_flesch_score(&document),
            perform_extraction(&document),
            analyze_cross_origin_security(&document, &final_url),
            links_selector::extract_links(&document, &final_url, base_url),
            if settings.extract_ngrams {
                ngrams::check_ngrams(&body, 2, url.as_str()).unwrap_or_default()
            } else {
                Vec::new()
            },
        )
    }; // `document` is dropped here

    let settings_clone = settings.clone();
    // Now perform asynchronous checks
    let check_links_status_code = get_links_status_code_from_settings(
        internal_external_links.clone(),
        base_url,
        final_url.to_string(),
        &settings_clone,
    )
    .await;

    let images_details = images_selector::fetch_image_details(image_urls_for_fetch).await;

    // Start PSI fetch as a separate task
    let psi_future = if settings.page_speed_bulk {
        let url_clone = final_url.clone();
        Some(tokio::spawn(async move {
            fetch_psi_bulk(url_clone, &settings_clone).await
        }))
    } else {
        None
    };

    // Do all other processing while PSI is fetching
    let psi_results = match psi_future {
        Some(fut) => fut.await.map_err(|e| e.to_string())?, // Handle task join error
        None => Ok(Vec::new()),                             // No PSI requested
    };

    // GETS THE SPECIFIC URL DEPTH
    let url_depth = url_depth::calculate_url_depth(&url);

    // PARSES THE OPENGRAPH DATA
    let opengraph_data = opengraph::parse_opengraph(&body);

    // PARSES THE COOKIE DATA

    let result = DomainCrawlResults {
        url: final_url.to_string(),
        original_url: url.to_string(),
        redirect_url,
        had_redirect,
        redirection_type,
        redirect_chain: Some(redirect_chain),
        redirect_count,
        title,
        description,
        headings,
        javascript: javascript_data,
        images: images_details,
        status_code,
        anchor_links: internal_external_links,
        inoutlinks_status_codes: check_links_status_code,
        indexability: indexability_data,
        alt_tags: alt_tags_data,
        schema: schema_data,
        css: css_data,
        iframe: iframe_data,
        word_count: word_count_val,
        response_time: Some(response_time),
        mobile: mobile_val,
        canonicals: canonicals_val,
        meta_robots: meta_robots_val,
        opengraph: opengraph_data,
        content_type: content_type.unwrap_or_else(|| "Unknown".to_string()),
        content_length: body.len(),
        text_ratio: Some(vec![text_ratio_val.and_then(|mut v| v.pop()).unwrap_or(
            TextRatio {
                html_length: 0,
                text_length: 0,
                text_ratio: 0.0,
            },
        )]),
        redirection: None,
        keywords: keywords_val,
        page_size: calculate_html_size(Some(body.len())),
        hreflangs: hreflangs_val,
        language: language_val,
        flesch: flesch_val,
        psi_results,
        extractor: Extractor {
            html: html_extractor_val,
            css: false,
            regex: false,
        },
        headers,
        pdf_files,
        https,
        cross_origin: cross_origin_data,
        status: Some(status_code),
        url_depth: Some(url_depth),
        cookies: Ok(cookies_data),
    };

    // Update state and emit progress
    update_state_and_emit_progress(&state, &url, depth, &result, links_for_crawler, app_handle)
        .await;

    Ok(result)
}

/// Update crawler state and emit progress after processing a URL
async fn update_state_and_emit_progress(
    state: &Arc<Mutex<CrawlerState>>,
    url: &Url,
    depth: usize,
    result: &DomainCrawlResults,
    links_for_crawler: std::collections::HashSet<Url>,
    app_handle: &tauri::AppHandle,
) {
    let mut state = state.lock().await;
    state.crawled_urls += 1;
    state.visited.insert(url.to_string());
    state.pending_urls.remove(url.as_str());
    state.last_activity = Instant::now();
    state.active_tasks = state.active_tasks.saturating_sub(1);
    let settings = settings::settings::load_settings()
        .await
        .unwrap_or_default();

    // Only process links if we haven't reached limits and depth allows
    if depth < settings.max_depth && state.total_urls < settings.max_urls_per_domain {
        let links = links_for_crawler;
        let links_found = links.len();
        if links_found > 0 && state.crawled_urls % 100 == 0 {
            println!("Found {} links on {} at depth {}", links_found, url, depth);
        }
        for link in links {
            let link_str = link.as_str();

            // Enhanced URL filtering
            if should_skip_url(link_str) {
                continue;
            }

            // Normalize URL to avoid duplicates
            let normalized_url = normalize_url(link_str);
            let url_pattern = extract_url_pattern(&normalized_url);

            // More sophisticated pattern checking to reduce over-deduplication
            let pattern_count = state
                .url_patterns
                .iter()
                .filter(|p| *p == &url_pattern)
                .count();

            let should_skip_pattern = if state.url_patterns.len() > 5000 {
                // Only skip if we've seen this exact pattern many times
                pattern_count > 10
            } else if state.url_patterns.len() > 1000 {
                // Be more selective about pattern matching
                pattern_count > 5
            } else {
                // Allow all patterns until we have a reasonable collection
                pattern_count > 20
            };

            if should_skip_pattern {
                if state.crawled_urls % 200 == 0 {
                    println!(
                        "Skipping URL due to pattern: {} (pattern: {})",
                        link_str, url_pattern
                    );
                }
                continue;
            }

            if !state.visited.contains(link_str)
                && !state.queue.iter().any(|(q_url, _)| q_url == &link)
                && !state.pending_urls.contains_key(link_str)
                && state.total_urls < settings.max_urls_per_domain
            {
                // Only increment total_urls when we actually add a new URL
                let queue_length_before = state.queue.len();
                state.queue.push_back((link.clone(), depth + 1));

                // Only increment if we successfully added to queue
                if state.queue.len() > queue_length_before {
                    state.total_urls += 1;
                    state
                        .pending_urls
                        .insert(link_str.to_string(), Instant::now());
                    state.url_patterns.insert(url_pattern);
                }
            }
        }
    }

    // Calculate progress - use a stable approach for dynamic crawling
    let completed_urls = state.crawled_urls + state.failed_urls.len();
    let total_discovered = state.total_urls;
    let active_pending = state.pending_urls.len() + state.active_tasks;

    // For progress calculation, consider both completed and in-progress work
    let progress_denominator = total_discovered + active_pending;
    let percentage = if progress_denominator > 0 {
        let base_progress = (completed_urls as f32 / progress_denominator as f32) * 100.0;
        // Cap at 95% during active crawling, only show 100% when truly complete
        if active_pending > 0 {
            base_progress.min(95.0)
        } else {
            base_progress.min(100.0)
        }
    } else {
        0.0
    };

    // Ensure we never send invalid data that could cause NaN in frontend
    let safe_total_discovered = std::cmp::max(total_discovered, 1);
    let safe_completed_urls = completed_urls;

    let progress = ProgressData {
        total_urls: safe_total_discovered,
        crawled_urls: safe_completed_urls,
        failed_urls: state.failed_urls.iter().map(|f| f.url.clone()).collect(),
        percentage,
        failed_urls_count: state.failed_urls.len(),
        discovered_urls: safe_total_discovered,
        robots_blocked: None,
    };

    // Debug logging for troubleshooting NaN issues
    if total_discovered == 0 || percentage.is_nan() {
        println!(
            "WARNING: Potential invalid progress data - total_discovered: {}, completed_urls: {}, percentage: {}",
            total_discovered, completed_urls, percentage
        );
    }

    // Log progress every 50 URLs for better tracking
    if state.crawled_urls % 50 == 0 || (active_pending == 0 && completed_urls > 0) {
        println!(
            "Progress: {}/{} URLs completed ({:.1}%), {} succeeded, {} failed, {} pending, {} active",
            completed_urls,
            total_discovered,
            percentage,
            state.crawled_urls,
            state.failed_urls.len(),
            state.pending_urls.len(),
            state.active_tasks
        );
    }

    // Only emit progress update if we have valid data
    if safe_total_discovered > 0 && !percentage.is_nan() {
        if let Err(err) = app_handle.emit("progress_update", progress) {
            eprintln!("Failed to emit progress update: {}", err);
        }
    } else {
        println!(
            "Skipping invalid progress update: total_discovered={}, percentage={}",
            safe_total_discovered, percentage
        );
    }

    let result_data = CrawlResultData {
        result: result.clone(),
    };
    if let Err(err) = app_handle.emit("crawl_result", result_data) {
        eprintln!("Failed to emit crawl result: {}", err);
    }

    print!(
        "\r{}: {:.2}% {}",
        "Progress".green().bold(),
        percentage,
        "complete".green().bold()
    );
    std::io::stdout().flush().unwrap();

    // Enhanced periodic status logging
    if state.crawled_urls % 50 == 0 {
        println!(
            "Status - Crawled: {}, Pending: {}, Queue: {}, Failed: {}, Patterns: {}",
            state.crawled_urls,
            state.pending_urls.len(),
            state.queue.len(),
            state.failed_urls.len(),
            state.url_patterns.len()
        );
    }
}
