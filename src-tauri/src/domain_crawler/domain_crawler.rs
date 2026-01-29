//! Main domain crawler orchestration
//!
//! This module contains the main `crawl_domain` function that coordinates
//! the entire crawling process. The actual URL processing is delegated to
//! the `url_processor` module.

use reqwest::Client;
use std::sync::Arc;
use std::time::Instant;
use tauri::Emitter;
use tokio::sync::{Mutex, Semaphore};
use tokio::time::{sleep, Duration};
use url::Url;

use crate::domain_crawler::helpers::domain_checker::url_check;
use crate::domain_crawler::helpers::robots::get_domain_robots;
use crate::settings::settings::Settings;
use crate::AppState;

use super::constants::{DB_BATCH_SIZE, JS_CONCURRENCY, MAX_PENDING_TIME, STALL_CHECK_INTERVAL};
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
    let settings = Arc::new(settings_state.settings.read().await.clone());

    let client = Client::builder()
        .user_agent(&settings.user_agents[rand::random_range(0..settings.user_agents.len())])
        .timeout(Duration::from_secs(settings.client_timeout))
        .connect_timeout(Duration::from_secs(settings.client_connect_timeout))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|e| e.to_string())?;

    let url_checked = url_check(domain);
    let base_url = Url::parse(&url_checked).map_err(|_| "Invalid URL")?;
    let domain = base_url.clone();

    let app_handle_clone = app_handle.clone();

    // Spawn a task that checks for the robots files
    tokio::spawn(async move {
        let robots_str = get_domain_robots(&domain)
            .await
            .unwrap_or_else(|| vec!["No robots.txt found".to_string()]);

        if let Err(err) = app_handle_clone.emit("robots", (&domain, robots_str)) {
            eprintln!("Failed to emit robots data: {}", err);
        } else {
            println!("Robots emitted for {}", &domain);
        }
    });

    let (db_tx, mut db_rx) = tokio::sync::mpsc::channel(DB_BATCH_SIZE);

    let db_handle = if let Ok(database) = db {
        let db_pool = database.get_pool();
        let handle = tokio::spawn(async move {
            let mut batch_results = Vec::with_capacity(DB_BATCH_SIZE);
            while let Some(result) = db_rx.recv().await {
                batch_results.push(result);
                if batch_results.len() >= DB_BATCH_SIZE {
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

    let semaphore = Arc::new(Semaphore::new(settings.concurrent_requests));
    let js_semaphore = Arc::new(Semaphore::new(JS_CONCURRENCY));
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
            if last_stall_check.elapsed() > STALL_CHECK_INTERVAL {
                // Only consider it stalled if no progress AND no pending URLs AND empty queue AND no active tasks
                if state_guard.crawled_urls == last_crawled_count
                    && state_guard.last_activity.elapsed() > MAX_PENDING_TIME
                    && state_guard.is_truly_complete()
                {
                    println!("Crawler appears to be stalled, terminating...");
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

            let batch_size = std::cmp::min(settings.batch_size, state_guard.queue.len());
            state_guard.queue.drain(..batch_size).collect()
        };

        if current_batch.is_empty() {
            // Check if there are truly no more URLs to process
            let state_guard = state.lock().await;
            if state_guard.is_truly_complete() {
                println!("All URLs processed, crawl complete");
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
            let settings_clone = settings.clone();
            let js_semaphore_clone = js_semaphore.clone();
            let db_tx_clone = db_tx.clone();

            let handle = tokio::spawn(async move {
                let _permit = semaphore_clone.acquire().await.unwrap();
                let jitter = rand::random_range(500..2000);
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

        if crawl_start_time.elapsed() > Duration::from_secs(settings.crawl_timeout) {
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
    {
        let state_guard = state.lock().await;
        let completed = state_guard.crawled_urls + state_guard.failed_urls.len();
        let safe_completed = std::cmp::max(completed, 1);
        let final_progress = ProgressData {
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
        };

        println!(
            "Final crawl stats: {} total processed ({} succeeded, {} failed)",
            completed,
            state_guard.crawled_urls,
            state_guard.failed_urls.len()
        );

        if let Err(err) = app_handle.emit("progress_update", final_progress) {
            eprintln!("Failed to emit final progress update: {}", err);
        }
    }

    app_handle.emit("crawl_complete", ()).unwrap_or_default();
    println!("Crawl completed.");

    if let Err(e) = database::create_diff_tables() {
        eprintln!("Failed to create diff tables: {}", e);
    }

    if let Err(e) = database::clone_batched_crawl_into_persistent_db().await {
        eprintln!("Failed to clone batched crawl into persistent db: {}", e);
    }

    Ok(())
}
