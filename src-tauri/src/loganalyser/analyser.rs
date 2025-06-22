use chrono::NaiveDateTime;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::mpsc;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

use crate::loganalyser::helpers::browser_trim_name;
use crate::loganalyser::helpers::country_extractor::extract_country;
use crate::loganalyser::helpers::crawler_type::is_crawler;
use crate::loganalyser::helpers::parse_logs::parse_log_entries;
use crate::settings;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogInput {
    pub log_contents: Vec<(String, String)>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub ip: String,
    pub timestamp: String,
    pub method: String,
    pub path: String,
    pub status: u16,
    pub user_agent: String,
    pub referer: Option<String>,
    pub response_size: u64,
    pub country: Option<String>,
    pub crawler_type: String,
    pub is_crawler: bool,
    pub file_type: String,
    pub browser: String,
    pub verified: bool,
    pub taxonomy: Option<String>,
    pub filename: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct LogAnalysisResult {
    pub message: String,
    pub line_count: usize,
    pub unique_ips: usize,
    pub unique_user_agents: usize,
    pub crawler_count: usize,
    pub success_rate: f32,
    pub totals: Totals,
    pub log_start_time: String,
    pub log_finish_time: String,
    pub file_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BotPageDetails {
    pub crawler_type: String,
    pub file_type: String,
    pub response_size: u64,
    pub timestamp: String,
    pub ip: String,
    pub referer: Option<String>,
    pub browser: String,
    pub user_agent: String,
    pub frequency: usize,
    pub method: String,
    pub verified: bool,
    pub taxonomy: Option<String>,
    pub filename: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressUpdate {
    pub current_file: usize,
    pub total_files: usize,
    pub percentage: f32,
    pub filename: String,
    pub phase: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogResult {
    pub overview: LogAnalysisResult,
    pub entries: Vec<LogEntry>,
}

enum StreamEntry {
    LogEntry(LogEntry),
    Overview(LogAnalysisResult),
}

pub fn analyse_log(data: LogInput, app_handle: AppHandle) -> Result<(), String> {
    let file_count = data.log_contents.len();
    let (progress_tx, progress_rx) = mpsc::channel();
    let (entry_tx, entry_rx) = mpsc::channel();

    // Progress reporting thread
    let app_handle_clone = app_handle.clone();
    thread::spawn(move || {
        let mut last_emitted = std::time::Instant::now();
        for update in progress_rx {
            if last_emitted.elapsed() >= Duration::from_millis(100) {
                let _ = app_handle_clone.emit("progress-update", update);
                last_emitted = std::time::Instant::now();
            }
        }
    });

    // Entry streaming thread
    let app_handle_stream = app_handle.clone();
    thread::spawn(move || {
        let settings = match tokio::task::block_in_place(|| {
            tauri::async_runtime::block_on(settings::settings::load_settings())
        }) {
            Ok(s) => s,
            Err(_) => return,
        };

        let mut entries_buffer = Vec::new();
        let mut overview: Option<LogAnalysisResult> = None;

        for entry in entry_rx {
            match entry {
                StreamEntry::LogEntry(e) => {
                    entries_buffer.push(e);

                    if entries_buffer.len() >= settings.log_chunk_size {
                        let chunk = LogResult {
                            overview: overview.clone().unwrap_or_default(),
                            entries: entries_buffer.drain(..).collect(),
                        };
                        let _ = app_handle_stream.emit("log-analysis-chunk", chunk);
                        thread::sleep(Duration::from_millis(settings.log_sleep_stream_duration));
                    }
                }
                StreamEntry::Overview(o) => {
                    overview = Some(o);
                }
            }
        }

        println!(
            "[BACKEND] Emitting chunk of {} entries (buffer size: {})",
            entries_buffer.len(),
            settings.log_chunk_size
        );
        if !entries_buffer.is_empty() {
            let chunk = LogResult {
                overview: overview.clone().unwrap_or_default(),
                entries: entries_buffer,
            };
            let _ = app_handle_stream.emit("log-analysis-chunk", chunk);
        }

        if let Some(overview) = overview {
            let _ = app_handle_stream.emit(
                "log-analysis-complete",
                LogResult {
                    overview,
                    entries: Vec::new(),
                },
            );
        }
    });

    // Main processing
    let mut all_entries = Vec::new();
    let mut unique_ips = HashSet::new();
    let mut unique_user_agents = HashSet::new();
    let mut crawler_count = 0;
    let mut success_count = 0;
    let mut bot_counts = [0; 8];
    let mut google_bot_entries = Vec::new();
    let mut google_bot_pages = Vec::new();

    for (index, (filename, log_content)) in data.log_contents.into_iter().enumerate() {
        let _ = progress_tx.send(ProgressUpdate {
            current_file: index + 1,
            total_files: file_count,
            percentage: (index as f32 / file_count as f32) * 100.0,
            filename: filename.clone(),
            phase: "started".to_string(),
        });

        let entries = parse_log_entries(&log_content)
            .into_iter()
            .map(|e| {
                let is_crawler = is_crawler(&e.user_agent);
                let entry = LogEntry {
                    ip: e.ip.clone(),
                    timestamp: e.timestamp.format("%Y-%m-%d %H:%M:%S").to_string(),
                    method: e.method,
                    path: e.path,
                    status: e.status,
                    user_agent: e.user_agent,
                    referer: e.referer, // Keep as Option<String>
                    response_size: e.response_size,
                    country: extract_country(&e.ip),
                    crawler_type: e.crawler_type,
                    is_crawler,
                    file_type: e.file_type,
                    browser: browser_trim_name::trim_browser_name(&e.browser),
                    verified: e.verified,
                    taxonomy: Some(e.taxonomy),
                    filename: filename.clone(),
                };

                // Update statistics
                unique_ips.insert(entry.ip.clone());
                unique_user_agents.insert(entry.user_agent.clone());
                if entry.is_crawler {
                    crawler_count += 1;
                }
                if entry.status >= 200 && entry.status < 300 {
                    success_count += 1;
                }

                // Update bot counts
                let crawler_type = entry.crawler_type.to_lowercase();
                if crawler_type.starts_with("google") {
                    bot_counts[0] += 1;
                    if entry.verified {
                        google_bot_pages.push(entry.path.clone());
                        google_bot_entries.push(entry.clone());
                    }
                } else if crawler_type.starts_with("bing") {
                    bot_counts[1] += 1;
                } else if crawler_type.starts_with("semrush") {
                    bot_counts[2] += 1;
                } else if crawler_type.starts_with("hrefs") {
                    bot_counts[3] += 1;
                } else if crawler_type.starts_with("moz") {
                    bot_counts[4] += 1;
                } else if crawler_type.starts_with("uptime") {
                    bot_counts[5] += 1;
                } else if crawler_type.starts_with("chat") {
                    bot_counts[6] += 1;
                } else if crawler_type.starts_with("claude") {
                    bot_counts[7] += 1;
                }

                // Stream the entry
                let _ = entry_tx.send(StreamEntry::LogEntry(entry.clone()));

                // NOTE: GOOD DEBUGGING
                //println!(
                //    "[BACKEND] Processing entry from {} - sending to channel",
                //    filename
                //);
                let _ = entry_tx.send(StreamEntry::LogEntry(entry.clone()));

                entry
            })
            .collect::<Vec<_>>();

        // DEBUGGING
        println!("Processing file {} of {}", index + 1, file_count);
        println!("Sending {} entries from {}", &entries.len(), filename);

        all_entries.extend(entries);

        let _ = progress_tx.send(ProgressUpdate {
            current_file: index + 1,
            total_files: file_count,
            percentage: ((index + 1) as f32 / file_count as f32) * 100.0,
            filename,
            phase: "completed".to_string(),
        });
    }

    if all_entries.is_empty() {
        return Err("No logs found".to_string());
    }

    // Calculate overview data
    let log_start_time = all_entries
        .first()
        .map(|e| e.timestamp.clone())
        .unwrap_or_default();
    let log_finish_time = all_entries
        .last()
        .map(|e| e.timestamp.clone())
        .unwrap_or_default();
    let total_requests = all_entries.len();

    let google_bot_page_frequencies =
        calculate_url_frequencies(google_bot_entries.iter().collect());

    let overview = LogAnalysisResult {
        message: "Log analysis completed".to_string(),
        line_count: total_requests,
        unique_ips: unique_ips.len(),
        unique_user_agents: unique_user_agents.len(),
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
    };

    // Send the overview
    let _ = entry_tx.send(StreamEntry::Overview(overview));

    Ok(())
}

fn calculate_url_frequencies(entries: Vec<&LogEntry>) -> HashMap<String, Vec<BotPageDetails>> {
    entries
        .into_par_iter()
        .filter(|entry| entry.verified)
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
