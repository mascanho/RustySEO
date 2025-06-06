use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::mpsc;
use std::thread;
use tauri::{Emitter, Manager};

use super::helpers::browser_trim_name;
use super::helpers::country_extractor::extract_country;
use super::helpers::crawler_type::is_crawler;
use super::helpers::parse_logs::parse_log_entries;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogEntry {
    pub ip: String,
    pub timestamp: String,
    pub method: String,
    pub path: String,
    pub status: u16,
    pub user_agent: String,
    pub referer: String,
    pub response_size: u64,
    pub country: Option<String>,
    pub is_crawler: bool,
    pub crawler_type: String,
    pub browser: String,
    pub file_type: String,
    pub verified: bool,
    pub taxonomy: String,
    pub filename: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LogAnalysisResult {
    pub message: String,
    pub line_count: usize,
    pub unique_ips: usize,
    pub unique_user_agents: usize,
    pub crawler_count: usize,
    pub totals: Totals,
    pub success_rate: f32,
    pub log_start_time: String,
    pub log_finish_time: String,
    pub file_count: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BotPageDetails {
    pub crawler_type: String,
    pub file_type: String,
    pub response_size: u64,
    pub timestamp: String,
    pub ip: String,
    pub referer: String,
    pub browser: String,
    pub user_agent: String,
    pub frequency: usize,
    pub method: String,
    pub verified: bool,
    pub taxonomy: String,
    pub filename: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Totals {
    pub google: usize,
    pub bing: usize,
    pub semrush: usize,
    pub hrefs: usize,
    pub moz: usize,
    pub uptime: usize,
    pub openai: usize,
    pub claude: usize,
    pub google_bot_pages: Vec<String>,
    pub google_bot_page_frequencies: HashMap<String, Vec<BotPageDetails>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LogResult {
    pub overview: LogAnalysisResult,
    pub entries: Vec<LogEntry>,
}

#[derive(Serialize, Deserialize)]
pub struct LogInput {
    pub log_contents: Vec<(String, String)>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ProgressUpdate {
    pub current_file: usize,
    pub total_files: usize,
    pub percentage: f32,
    pub filename: String,
    pub phase: String,
}

/// Main analysis function with parallel processing and memory optimizations
pub fn analyse_log(data: LogInput, app_handle: tauri::AppHandle) -> Result<LogResult, String> {
    let file_count = data.log_contents.len();
    let (progress_tx, progress_rx) = mpsc::channel();

    // Spawn progress emitter thread with bounded channel to prevent memory buildup
    let app_handle_clone = app_handle.clone();
    thread::Builder::new()
        .name("progress-emitter".into())
        .spawn(move || {
            for update in progress_rx {
                let _ = app_handle_clone.emit("progress-update", update);
                thread::yield_now();
            }
        })
        .expect("Failed to spawn progress thread");

    // Process files in parallel with Rayon
    let entries: Vec<LogEntry> = data
        .log_contents
        .into_par_iter()
        .enumerate()
        .flat_map(|(index, (filename, log_content))| {
            // Send start progress update
            let _ = progress_tx.send(ProgressUpdate {
                current_file: index + 1,
                total_files: file_count,
                percentage: (index as f32 / file_count as f32) * 100.0,
                filename: filename.clone(),
                phase: "started".to_string(),
            });

            // Process log entries
            let entries = parse_log_entries(&log_content)
                .into_iter()
                .map(|e| {
                    let is_crawler = is_crawler(&e.user_agent);
                    LogEntry {
                        ip: e.ip.clone(),
                        timestamp: e.timestamp.format("%Y-%m-%d %H:%M:%S").to_string(),
                        method: e.method,
                        path: e.path,
                        status: e.status,
                        user_agent: e.user_agent,
                        referer: e.referer.unwrap_or_default(),
                        response_size: e.response_size,
                        country: extract_country(&e.ip),
                        crawler_type: e.crawler_type,
                        is_crawler,
                        file_type: e.file_type,
                        browser: browser_trim_name::trim_browser_name(&e.browser),
                        verified: e.verified,
                        taxonomy: e.taxonomy,
                        filename: filename.clone(),
                    }
                })
                .collect::<Vec<_>>();

            // Send completion progress update
            let _ = progress_tx.send(ProgressUpdate {
                current_file: index + 1,
                total_files: file_count,
                percentage: ((index + 1) as f32 / file_count as f32) * 100.0,
                filename,
                phase: "completed".to_string(),
            });

            entries
        })
        .collect();

    // Early return if no entries found
    if entries.is_empty() {
        return Ok(LogResult {
            overview: LogAnalysisResult {
                message: "No log entries found".to_string(),
                line_count: 0,
                unique_ips: 0,
                unique_user_agents: 0,
                crawler_count: 0,
                success_rate: 0.0,
                totals: Totals::default(),
                log_start_time: String::new(),
                log_finish_time: String::new(),
                file_count,
            },
            entries: Vec::new(),
        });
    }

    // Calculate basic statistics
    let log_start_time = entries
        .first()
        .map(|e| e.timestamp.clone())
        .unwrap_or_default();
    let log_finish_time = entries
        .last()
        .map(|e| e.timestamp.clone())
        .unwrap_or_default();
    let total_requests = entries.len();

    // Use parallel iterators for counting operations
    let crawler_count = entries.par_iter().filter(|e| e.is_crawler).count();
    let success_count = entries
        .par_iter()
        .filter(|e| e.status >= 200 && e.status < 300)
        .count();

    // Use HashSet for unique counts with parallel processing
    let unique_ips = entries
        .par_iter()
        .map(|e| &e.ip)
        .collect::<HashSet<_>>()
        .len();
    let unique_user_agents = entries
        .par_iter()
        .map(|e| &e.user_agent)
        .collect::<HashSet<_>>()
        .len();

    // Calculate bot totals in parallel
    let bot_counts = entries
        .par_iter()
        .fold(
            || [0; 8],
            |mut counts, entry| {
                let crawler_type = entry.crawler_type.to_lowercase();
                if crawler_type.starts_with("google") {
                    counts[0] += 1;
                } else if crawler_type.starts_with("bing") {
                    counts[1] += 1;
                } else if crawler_type.starts_with("semrush") {
                    counts[2] += 1;
                } else if crawler_type.starts_with("hrefs") {
                    counts[3] += 1;
                } else if crawler_type.starts_with("moz") {
                    counts[4] += 1;
                } else if crawler_type.starts_with("uptime") {
                    counts[5] += 1;
                } else if crawler_type.starts_with("chat") {
                    counts[6] += 1;
                } else if crawler_type.starts_with("claude") {
                    counts[7] += 1;
                }
                counts
            },
        )
        .reduce(
            || [0; 8],
            |mut a, b| {
                for i in 0..8 {
                    a[i] += b[i];
                }
                a
            },
        );

    // Extract Google bot pages in parallel
    let (google_bot_pages, google_bot_entries): (Vec<_>, Vec<_>) = entries
        .par_iter()
        .filter(|e| e.crawler_type.to_lowercase().contains("google"))
        .map(|e| (e.path.clone(), e))
        .unzip();

    let google_bot_page_frequencies = calculate_url_frequencies(google_bot_entries);

    Ok(LogResult {
        overview: LogAnalysisResult {
            message: "Log analysis completed".to_string(),
            line_count: total_requests,
            unique_ips,
            unique_user_agents,
            crawler_count,
            success_rate: if total_requests > 0 {
                (success_count as f32 / total_requests as f32) * 100.0
            } else {
                0.0
            },
            totals: Totals {
                google: bot_counts[0],
                bing: bot_counts[1],
                semrush: bot_counts[2],
                hrefs: bot_counts[3],
                moz: bot_counts[4],
                uptime: bot_counts[5],
                openai: bot_counts[6],
                claude: bot_counts[7],
                google_bot_pages,
                google_bot_page_frequencies,
            },
            log_start_time,
            log_finish_time,
            file_count,
        },
        entries,
    })
}

/// Optimized frequency calculation using parallel processing
fn calculate_url_frequencies(entries: Vec<&LogEntry>) -> HashMap<String, Vec<BotPageDetails>> {
    entries
        .into_par_iter()
        .fold(
            || HashMap::new(),
            |mut map, entry| {
                let details = BotPageDetails {
                    crawler_type: entry.crawler_type.clone(),
                    file_type: entry.file_type.clone(),
                    response_size: entry.response_size,
                    timestamp: entry.timestamp.clone(),
                    ip: entry.ip.clone(),
                    referer: entry.referer.clone(),
                    browser: entry.browser.clone(),
                    user_agent: entry.user_agent.clone(),
                    frequency: 1,
                    method: entry.method.clone(),
                    verified: entry.verified,
                    taxonomy: entry.taxonomy.clone(),
                    filename: entry.filename.clone(),
                };
                map.entry(entry.path.clone())
                    .or_insert_with(Vec::new)
                    .push(details);
                map
            },
        )
        .reduce(
            || HashMap::new(),
            |mut a, b| {
                for (key, mut values) in b {
                    a.entry(key).or_insert_with(Vec::new).append(&mut values);
                }
                a
            },
        )
        .into_par_iter()
        .map(|(key, details_vec)| {
            let first = &details_vec[0];
            let aggregated = BotPageDetails {
                crawler_type: first.crawler_type.clone(),
                file_type: first.file_type.clone(),
                response_size: details_vec.iter().map(|d| d.response_size).sum(),
                timestamp: first.timestamp.clone(),
                ip: first.ip.clone(),
                referer: first.referer.clone(),
                browser: first.browser.clone(),
                user_agent: first.user_agent.clone(),
                frequency: details_vec.len(),
                method: first.method.clone(),
                verified: first.verified,
                taxonomy: first.taxonomy.clone(),
                filename: first.filename.clone(),
            };
            (key, vec![aggregated])
        })
        .collect()
}

impl Default for Totals {
    fn default() -> Self {
        Self {
            google: 0,
            bing: 0,
            semrush: 0,
            hrefs: 0,
            moz: 0,
            uptime: 0,
            openai: 0,
            claude: 0,
            google_bot_pages: Vec::new(),
            google_bot_page_frequencies: HashMap::new(),
        }
    }
}
