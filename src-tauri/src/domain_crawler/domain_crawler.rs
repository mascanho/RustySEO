//! Main domain crawler orchestration
//! On expansion keep adding separate modules to slim down the codebase and improve maintainability.
//! This module contains the main `crawl_domain` function that coordinates
//! the entire crawling process. The actual URL processing is delegated to
//! the `url_processor` module.

use rand::seq::IndexedRandom;
use rand::Rng;
use reqwest::Client;
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, RwLock};
use std::time::Instant;
use tauri::Emitter;
use tokio::sync::{Mutex, Semaphore};
use tokio::time::{sleep, Duration};
use url::Url;

use crate::domain_crawler::helpers::domain_checker::url_check;
use crate::domain_crawler::helpers::favicon;
use crate::domain_crawler::helpers::robots::{self, get_domain_robots};
use crate::domain_crawler::helpers::sitemap;
use crate::domain_crawler::helpers::normalize_url::normalize_url;
use crate::AppState;

use super::database::{self, Database, DatabaseError};
use super::helpers::links_status_code_checker::SharedLinkChecker;
use super::state::{to_database_results, CrawlerState, FailedUrl, ProgressData};
use super::url_processor::process_url;

/// Main entry point for domain crawling
pub async fn crawl_domain(
    domain: &str,
    app_handle: tauri::AppHandle,
    db: Result<Database, DatabaseError>,
    settings_state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let settings = settings_state.settings.read().await.clone();

    // Extract all settings values we need to avoid borrowing issues
    let user_agents = settings.user_agents.clone();
    let client_timeout = settings.client_timeout;
    let client_connect_timeout = settings.client_connect_timeout;
    let concurrent_requests = settings.concurrent_requests;
    let js_concurrency = settings.javascript_concurrency;
    let stall_check_interval = settings.stall_check_interval;
    let max_pending_time = settings.max_pending_time;
    let batch_size = settings.batch_size;
    let crawl_timeout = settings.crawl_timeout;
    let db_batch_size = settings.db_batch_size;
    let base_delay = settings.base_delay;
    let max_delay = settings.max_delay;
    let adaptive_crawling = settings.adaptive_crawling;
    let min_crawl_delay = settings.min_crawl_delay;

    let selected_user_agent = user_agents.choose(&mut rand::rng()).cloned()
        .unwrap_or_else(|| "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36".to_string());

    let client = Client::builder()
        .cookie_store(true)
        .user_agent(&selected_user_agent)
        .timeout(Duration::from_secs(client_timeout))
        .connect_timeout(Duration::from_secs(client_connect_timeout))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|e| e.to_string())?;

    let url_checked = url_check(domain);
    let base_url = Url::parse(&url_checked).map_err(|_| "Invalid URL")?;
    let domain = base_url.clone();

    //TODO: Better to check the efficiency of this
    // INITIAL DATA FETCHING (Robots.txt)
    let robots_data = robots::get_robots_data(&domain).await;
    let robots_blocked = robots_data
        .as_ref()
        .map(|d| d.blocked_urls.clone())
        .unwrap_or_default();

    // Emit initial blocked info
    let _ = app_handle.emit("robots_blocked", &robots_blocked);

    // BACKGROUND TASKS (UI Updates & Favicon)
    let app_handle_for_spawn = app_handle.clone();
    let domain_clone = domain.clone();

    tokio::spawn(async move {
        // Run favicon check in parallel with UI updates
        let favicon_task = favicon::get_favicon(&domain_clone);

        // Emit robots raw text immediately if we already have it
        if let Some(data) = robots_data {
            if let Err(err) = app_handle_for_spawn.emit("robots", (&domain_clone, data.raw_text)) {
                eprintln!("Failed to emit robots data: {}", err);
            }
        } else {
            let _ = app_handle_for_spawn.emit(
                "robots",
                (&domain_clone, vec!["No robots.txt found".to_string()]),
            );
        }

        // Wait for favicon
        let favicon_result = favicon_task.await;

        match favicon_result {
            Ok(favicon_url) => {
                let _ = app_handle_for_spawn.emit("favicon", (&domain_clone, favicon_url));
            }
            Err(_) => {
                let _ = app_handle_for_spawn.emit("favicon", (&domain_clone, ""));
            }
        }
    });

    // Create the global URL status registry — shared between the crawler and the link checker
    // so that URLs already crawled are never re-requested during link checking.
    let url_status_registry: Arc<RwLock<HashMap<String, u16>>> =
        Arc::new(RwLock::new(HashMap::new()));

    let link_checker = Arc::new(SharedLinkChecker::new(
        &settings,
        Some(selected_user_agent.clone()),
        url_status_registry.clone(),
    ));
    let state = Arc::new(Mutex::new(
        CrawlerState::new(None)
            .with_link_checker(link_checker.clone())
            .with_url_status_registry(url_status_registry),
    )); // DB is handled separately
    {
        let normalized_base = normalize_url(base_url.as_str());
        let normalized_url_obj = Url::parse(&normalized_base).unwrap_or_else(|_| base_url.clone());
        
        let mut state_guard = state.lock().await;
        state_guard.queue.push_back((normalized_url_obj, 0)); // Start at depth 0
        state_guard.total_urls = 1;
        state_guard
            .pending_urls
            .insert(normalized_base, Instant::now());
    }

    // DISCOVER URLS FROM SITEMAPS
    let sitemap_urls = sitemap::extract_urls_from_sitemaps(&domain, &client).await;
    if !sitemap_urls.is_empty() {
        tracing::info!("Found {} URLs in sitemaps", sitemap_urls.len());
        let mut state_guard = state.lock().await;
        state_guard.add_discovered_urls(
            sitemap_urls,
            &domain,
            settings.max_depth,
            settings.max_urls_per_domain,
        );
    }

    let (db_tx, mut db_rx) = tokio::sync::mpsc::channel(db_batch_size);

    let db_handle = if let Ok(database) = db {
        let db_pool = database.get_pool();
        let db_batch_size_clone = db_batch_size;
        let handle = tokio::spawn(async move {
            let mut batch_results = Vec::with_capacity(db_batch_size_clone);
            // Use an interval to ensure periodic flushing regardless of channel activity
            let mut interval = tokio::time::interval(Duration::from_secs(2));
            interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);

            loop {
                tokio::select! {
                    recv_result = db_rx.recv() => {
                        match recv_result {
                            Some(result) => {
                                batch_results.push(result);
                                if batch_results.len() >= db_batch_size_clone {
                                    if let Err(e) = database::insert_bulk_crawl_data(
                                        db_pool.clone(),
                                        batch_results.drain(..).collect(),
                                    )
                                    .await
                                    {
                                        tracing::error!("Failed to batch insert results: {}", e);
                                    }
                                }
                            }
                            None => break,
                        }
                    }
                    _ = interval.tick() => {
                        if !batch_results.is_empty() {
                            if let Err(e) = database::insert_bulk_crawl_data(
                                db_pool.clone(),
                                batch_results.drain(..).collect(),
                            )
                            .await
                            {
                                tracing::error!("Failed to flush batch insert results: {}", e);
                            }
                        }
                    }
                }
            }
            if !batch_results.is_empty() {
                if let Err(e) = database::insert_bulk_crawl_data(db_pool, batch_results).await {
                    tracing::error!("Failed to insert remaining results: {}", e);
                }
            }
        });
        Some(handle)
    } else {
        tracing::error!("Database connection failed");
        None
    };


    let semaphore = Arc::new(Semaphore::new(concurrent_requests));
    let js_semaphore = Arc::new(Semaphore::new(js_concurrency));
    // Initialize adaptive delay with base_delay
    let current_atomic_delay = Arc::new(AtomicU64::new(base_delay));
    // Track when the crawler should pause due to rate limiting (epoch millis)
    let rate_limit_cooldown_until = Arc::new(AtomicU64::new(0));

    let crawl_start_time = Instant::now();
    let mut last_stall_check = Instant::now();
    let mut last_crawled_count = 0;

    let mut last_log_time = Instant::now();

    while state.lock().await.should_continue() {
        let to_spawn = {
            let mut state_guard = state.lock().await;
            state_guard.cleanup_stale_pending();

            // Check for stalling
            if last_stall_check.elapsed() > Duration::from_secs(stall_check_interval) {
                if state_guard.crawled_urls == last_crawled_count
                    && state_guard.last_activity.elapsed() > Duration::from_secs(max_pending_time)
                    && state_guard.is_truly_complete()
                {
                    tracing::info!("Crawler appears to be stalled, terminating...");
                    break;
                }
                last_crawled_count = state_guard.crawled_urls;
                last_stall_check = Instant::now();
            }

            // Periodic status log
            if last_log_time.elapsed() > Duration::from_secs(10) {
                tracing::info!(
                    "Status - Crawled: {}, Queue: {}, Pending: {}, Active: {}, Failed: {}",
                    state_guard.crawled_urls,
                    state_guard.queue.len(),
                    state_guard.pending_urls.len(),
                    state_guard.active_tasks,
                    state_guard.failed_urls.len()
                );
                last_log_time = Instant::now();
            }

            // Don't spawn more tasks than 2x the concurrency limit to prevent memory bloat
            // and ensure we don't overwhelm the pending_urls logic.
            if state_guard.active_tasks >= concurrent_requests * 2 {
                drop(state_guard);
                sleep(Duration::from_millis(100)).await;
                continue;
            }

            // Check if we're in a rate limit cooldown period
            let now_epoch_ms = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64;
            let cooldown_until = rate_limit_cooldown_until.load(Ordering::Relaxed);
            if now_epoch_ms < cooldown_until {
                let wait_ms = cooldown_until - now_epoch_ms;
                tracing::info!("Rate limit cooldown active. Pausing new tasks for {}ms", wait_ms);
                drop(state_guard);
                sleep(Duration::from_millis(wait_ms.min(5000))).await;
                continue;
            }

            if state_guard.queue.is_empty() {
                if state_guard.is_truly_complete() {
                    break;
                }
                drop(state_guard);
                sleep(Duration::from_millis(500)).await;
                continue;
            }

            // Calculate how many we can spawn based on semaphore and current active tasks
            // But actually, the inner loop handles the semaphore, so we just pull a reasonable batch
            let available_batch = std::cmp::min(batch_size, state_guard.queue.len());
            state_guard
                .queue
                .drain(..available_batch)
                .collect::<Vec<_>>()
        };

        if to_spawn.is_empty() {
            continue;
        }

        // Increment active tasks
        {
            let mut state_guard = state.lock().await;
            state_guard.active_tasks += to_spawn.len();
        }

        for (url, depth) in to_spawn {
            let client_clone = client.clone();
            let base_url_clone = base_url.clone();
            let state_clone = state.clone();
            let app_handle_clone = app_handle.clone();
            let semaphore_clone = semaphore.clone();
            let js_semaphore_clone = js_semaphore.clone();
            let db_tx_clone = db_tx.clone();
            let settings_clone = settings.clone();
            let current_atomic_delay_clone = current_atomic_delay.clone();
            let rate_limit_cooldown_clone = rate_limit_cooldown_until.clone();

            tokio::spawn(async move {
                let _permit = semaphore_clone.acquire().await.unwrap();

                // Calculate delay logic
                let delay = if adaptive_crawling {
                    let current_val = current_atomic_delay_clone.load(Ordering::Relaxed);
                    // Add +/- 20% jitter
                    let jitter_range = current_val as f32 * 0.2;
                    let jitter = if jitter_range > 0.0 {
                        rand::random_range(-jitter_range..jitter_range) as i64
                    } else {
                        0
                    };
                    (current_val as i64 + jitter).max(0) as u64
                } else {
                    if base_delay < max_delay {
                        rand::random_range(base_delay..max_delay)
                    } else {
                        base_delay
                    }
                };

                if delay > 0 {
                    sleep(Duration::from_millis(delay)).await;
                }

                let url_str = url.to_string();
                let result = process_url(
                    url.clone(),
                    depth,
                    &client_clone,
                    &base_url_clone,
                    state_clone.clone(),
                    &app_handle_clone,
                    &settings_clone,
                    js_semaphore_clone,
                )
                .await;

                if let Ok(crawl_result) = &result {
                    if adaptive_crawling {
                        let status = crawl_result.status_code;
                        if status == 429 || status == 503 {
                            // Backoff aggressively using fetch_max to avoid race conditions
                            let current = current_atomic_delay_clone.load(Ordering::Relaxed);
                            let jitter = rand::random_range(1000..3000);
                            let new_val = (current.saturating_mul(2).saturating_add(jitter)).min(max_delay).max(5000); 
                            // Use fetch_max so concurrent 429s only increase, never decrease
                            current_atomic_delay_clone.fetch_max(new_val, Ordering::Relaxed);
                            
                            // Set a global cooldown to pause new task spawning
                            let cooldown_ms = new_val.min(30000); // Max 30s cooldown
                            let cooldown_until = std::time::SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH)
                                .unwrap_or_default()
                                .as_millis() as u64 + cooldown_ms;
                            rate_limit_cooldown_clone.fetch_max(cooldown_until, Ordering::Relaxed);
                            
                            tracing::warn!("Server responded with {}. Increasing adaptive delay to {}ms and pausing new tasks for {}ms", status, new_val, cooldown_ms);
                        } else if status >= 200 && status < 300 {
                            // Speed up (decrease delay) — only decrease by 3% for stability
                            let current = current_atomic_delay_clone.load(Ordering::Relaxed);
                            let decrement = std::cmp::max((current as f32 * 0.03) as u64, 25);
                            let new_val = current.saturating_sub(decrement).max(min_crawl_delay);
                            current_atomic_delay_clone.store(new_val, Ordering::Relaxed);
                        }
                    }

                    if let Ok(db_result) = to_database_results(crawl_result) {
                        let _ = db_tx_clone.send(db_result).await;
                    }
                } else if adaptive_crawling {
                    // Error case (timeout, network error, or detected block)
                    let current = current_atomic_delay_clone.load(Ordering::Relaxed);
                    let err_str = result.as_ref().err().map(|e| e.to_string()).unwrap_or_default();
                    
                    if err_str.contains("Block") || err_str.contains("Rate Limit") {
                        // Aggressive backoff for detected blocks
                        let new_val = (current * 2 + 2000).min(max_delay).max(5000);
                        current_atomic_delay_clone.store(new_val, Ordering::Relaxed);
                        tracing::warn!("Block detected in response content. Increasing adaptive delay to {}ms", new_val);
                    } else {
                        // Standard network error - slow down slightly
                        let new_val = (current + 500).min(max_delay);
                        current_atomic_delay_clone.store(new_val, Ordering::Relaxed);
                    }
                }

                let mut state_guard = state_clone.lock().await;
                state_guard.active_tasks = state_guard.active_tasks.saturating_sub(1);
                state_guard.pending_urls.remove(&url_str);

                if let Err(e) = result {
                    tracing::error!("Failed to process {}: {}", url_str, e);
                    state_guard.failed_urls.insert(FailedUrl {
                        url: url_str,
                        error: e,
                        retries: 0,
                        depth,
                        timestamp: Instant::now(),
                    });
                }
            });
        }

        if crawl_start_time.elapsed() > Duration::from_secs(crawl_timeout) {
            println!("Crawl timeout reached, terminating...");
            app_handle.emit("crawl_interrupted", ()).unwrap_or_default();
            break;
        }

        // Small sleep to prevent tight-looping the state lock
        sleep(Duration::from_millis(50)).await;
    }

    // Final cleanup and status report
    {
        let state_guard = state.lock().await;
        println!("\nCrawl completed - Final stats:");
        println!("  Total URLs discovered: {}", state_guard.total_urls);
        println!("  URLs successfully crawled: {}", state_guard.crawled_urls);
        println!("  URLs failed: {}", state_guard.failed_urls.len());
        println!("  URLs still pending: {}", state_guard.pending_urls.len());
        println!("  Active tasks remaining: {}", state_guard.active_tasks);
        println!("  Unique URL patterns: {}", state_guard.url_patterns.len());

        // Calculate final completion percentage
        let completed = state_guard.crawled_urls + state_guard.failed_urls.len();
        let final_percentage = if state_guard.total_urls > 0 {
            (completed as f32 / state_guard.total_urls as f32) * 100.0
        } else {
            0.0
        };
        println!("  Final completion: {:.2}%", final_percentage);
    }

    drop(db_tx);
    if let Some(handle) = db_handle {
        handle.await.unwrap_or_default();
    }

    // Emit final 100% progress update before completion
    let final_progress = {
        let state_guard = state.lock().await;
        let completed = state_guard.crawled_urls + state_guard.failed_urls.len();
        let progress = ProgressData {
            total_urls: std::cmp::max(state_guard.total_urls, 1),
            crawled_urls: completed,
            percentage: if state_guard.total_urls > 0 {
                (completed as f32 / state_guard.total_urls as f32) * 100.0
            } else {
                100.0
            },
            failed_urls_count: state_guard.failed_urls.len(),
            discovered_urls: std::cmp::max(state_guard.total_urls, 1),
            robots_blocked: Some(robots_blocked),
        };

        tracing::info!(
            "Final crawl stats: {} total processed ({} succeeded, {} failed)",
            completed,
            state_guard.crawled_urls,
            state_guard.failed_urls.len()
        );

        if let Err(err) = app_handle.emit("progress_update", progress.clone()) {
            eprintln!("Failed to emit final progress update: {}", err);
        }

        progress
    };

    app_handle
        .emit("crawl_complete", final_progress)
        .unwrap_or_default();
    tracing::info!("Crawl completed.");

    if let Err(e) = database::create_diff_tables() {
        eprintln!("Failed to create diff tables: {}", e);
    }

    if let Err(e) = database::clone_batched_crawl_into_persistent_db().await {
        eprintln!("Failed to clone batched crawl into persistent db: {}", e);
    }

    Ok(())
}
