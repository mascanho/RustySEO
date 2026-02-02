//! Main domain crawler orchestration
//! On expansion keep adding separate modules to slim down the codebase and improve maintainability.
//! This module contains the main `crawl_domain` function that coordinates
//! the entire crawling process. The actual URL processing is delegated to
//! the `url_processor` module.

use rand::Rng;
use reqwest::Client;
use std::sync::Arc;
use std::time::Instant;
use tauri::Emitter;
use tokio::sync::{Mutex, Semaphore};
use tokio::time::{sleep, Duration};
use url::Url;

use crate::domain_crawler::helpers::domain_checker::url_check;
use crate::domain_crawler::helpers::favicon;
use crate::domain_crawler::helpers::robots::{self, get_domain_robots};
use crate::AppState;

use super::database::{self, Database, DatabaseError};
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

    let client = Client::builder()
        .cookie_store(true)
        .user_agent(&user_agents[rand::random_range(0..user_agents.len())])
        .timeout(Duration::from_secs(client_timeout))
        .connect_timeout(Duration::from_secs(client_connect_timeout))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|e| e.to_string())?;

    let url_checked = url_check(domain);
    let base_url = Url::parse(&url_checked).map_err(|_| "Invalid URL")?;
    let domain = base_url.clone();

    let app_handle_clone = app_handle.clone();

    // INITIAL DATA FETCHING (Robots.txt)
    let robots_data = robots::get_robots_data(&domain).await;
    let robots_blocked = robots_data.as_ref().map(|d| d.blocked_urls.clone()).unwrap_or_default();
    
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
             let _ = app_handle_for_spawn.emit("robots", (&domain_clone, vec!["No robots.txt found".to_string()]));
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

    let (db_tx, mut db_rx) = tokio::sync::mpsc::channel(db_batch_size);

    let db_handle = if let Ok(database) = db {
        let db_pool = database.get_pool();
        let db_batch_size_clone = db_batch_size;
        let handle = tokio::spawn(async move {
            let mut batch_results = Vec::with_capacity(db_batch_size_clone);
            while let Some(result) = db_rx.recv().await {
                batch_results.push(result);
                if batch_results.len() >= db_batch_size {
                    if let Err(e) = database::insert_bulk_crawl_data(
                        db_pool.clone(),
                        batch_results.drain(..).collect(),
                    )
                    .await
                    {
                        eprintln!("Failed to batch insert results: {}", e);
                    }
                }
            }
            if !batch_results.is_empty() {
                if let Err(e) = database::insert_bulk_crawl_data(db_pool, batch_results).await {
                    eprintln!("Failed to insert remaining results: {}", e);
                }
            }
        });
        Some(handle)
    } else {
        eprintln!("Database connection failed");
        None
    };

    let state = Arc::new(Mutex::new(CrawlerState::new(None))); // DB is handled separately
    {
        let mut state_guard = state.lock().await;
        state_guard.queue.push_back((base_url.clone(), 0)); // Start at depth 0
        state_guard.total_urls = 1;
        state_guard
            .pending_urls
            .insert(base_url.to_string(), Instant::now());
    }

    let semaphore = Arc::new(Semaphore::new(concurrent_requests));
    let js_semaphore = Arc::new(Semaphore::new(js_concurrency));
    let crawl_start_time = Instant::now();
    let mut last_stall_check = Instant::now();
    let mut last_crawled_count = 0;

    loop {
        let current_batch: Vec<(Url, usize)> = {
            let mut state_guard = state.lock().await;

            // Clean up stale pending URLs
            state_guard.cleanup_stale_pending();

            // Check if we should continue
            if !state_guard.should_continue() {
                break;
            }

            // Check for stalling (made less aggressive)
            // STALL CHECK FROM SETTINGS CHECKING EVERY 30 SECONDS
            if last_stall_check.elapsed() > Duration::from_secs(stall_check_interval) {
                // Only consider it stalled if no progress AND no pending URLs AND empty queue AND no active tasks
                if state_guard.crawled_urls == last_crawled_count
                    && state_guard.last_activity.elapsed() > Duration::from_secs(max_pending_time) // DEFAULT
                // IS 900
                    && state_guard.is_truly_complete()
                {
                    tracing::info!("Crawler appears to be stalled, terminating...");
                    break;
                }
                last_crawled_count = state_guard.crawled_urls;
                last_stall_check = Instant::now();
            }

            if state_guard.queue.is_empty() {
                // Wait a bit for pending operations to complete
                drop(state_guard);
                sleep(Duration::from_secs(2)).await;
                continue;
            }

            let batch_size = std::cmp::min(batch_size, state_guard.queue.len());
            state_guard.queue.drain(..batch_size).collect()
        };

        if current_batch.is_empty() {
            // Check if there are truly no more URLs to process
            let state_guard = state.lock().await;
            if state_guard.is_truly_complete() {
                tracing::info!("All URLs processed, crawl complete");
                break;
            }
            drop(state_guard);
            sleep(Duration::from_secs(1)).await;
            continue;
        }

        // Increment active tasks counter before spawning
        {
            let mut state_guard = state.lock().await;
            state_guard.active_tasks += current_batch.len();
        }

        let mut handles = Vec::with_capacity(current_batch.len());

        for (url, depth) in current_batch {
            let client_clone = client.clone();
            let base_url_clone = base_url.clone();
            let state_clone = state.clone();
            let app_handle_clone = app_handle.clone();
            let semaphore_clone = semaphore.clone();
            let js_semaphore_clone = js_semaphore.clone();
            let db_tx_clone = db_tx.clone();
            let settings_clone = settings.clone();

            let handle = tokio::spawn(async move {
                let _permit = semaphore_clone.acquire().await.unwrap();
                let jitter = rand::random_range(10..50);
                sleep(Duration::from_millis(jitter)).await;

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
                    if let Ok(db_result) = to_database_results(crawl_result) {
                        if let Err(e) = db_tx_clone.send(db_result).await {
                            eprintln!("Failed to send result to DB thread: {}", e);
                        }
                    }
                }
                (url, result)
            });
            handles.push(handle);
        }

        for handle in handles {
            if let Ok((url, result)) = handle.await {
                match result {
                    Err(_) => {
                        let mut state_guard = state.lock().await;
                        state_guard.pending_urls.remove(url.as_str());
                        state_guard.failed_urls.insert(FailedUrl {
                            url: url.to_string(),
                            error: "Processing failed".to_string(),
                            retries: 0,
                            depth: 0,
                            timestamp: Instant::now(),
                        });
                        state_guard.active_tasks = state_guard.active_tasks.saturating_sub(1);
                        // Don't re-queue failed URLs to prevent infinite loops
                    }
                    Ok(_) => {
                        // Success case is already handled in process_url
                        let mut state_guard = state.lock().await;
                        state_guard.active_tasks = state_guard.active_tasks.saturating_sub(1);
                    }
                }
            }
        }

        if crawl_start_time.elapsed() > Duration::from_secs(crawl_timeout) {
            println!("Crawl timeout reached, terminating...");
            app_handle.emit("crawl_interrupted", ()).unwrap_or_default();
            break;
        }
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
        let safe_completed = std::cmp::max(completed, 1);
        let progress = ProgressData {
            total_urls: safe_completed, // Set total to actual completed count for consistency
            crawled_urls: safe_completed,
            failed_urls: state_guard
                .failed_urls
                .iter()
                .map(|f| f.url.clone())
                .collect(),
            percentage: 100.0, // Always 100% when truly complete
            failed_urls_count: state_guard.failed_urls.len(),
            discovered_urls: std::cmp::max(state_guard.total_urls, 1),
            robots_blocked: Some(robots_blocked),
        };

        println!(
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
