use chrono::NaiveDateTime;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::sync::mpsc;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

use crate::loganalyser::helpers::browser_trim_name;
use crate::loganalyser::helpers::country_extractor::extract_country;
use crate::loganalyser::helpers::crawler_type::is_crawler;
use crate::loganalyser::helpers::parse_logs::{parse_log_entries, parse_log_line, preload_all_ip_ranges_sync};
use crate::loganalyser::active_db::{get_active_logs_stats, init_active_db, insert_active_logs_batch};
use crate::settings::settings;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Segmentation {
    pub name: String,
    pub match_type: String,
    pub urls: Vec<String>,
    pub count: usize,
    pub unique_ips: usize,
    pub status_codes: StatusCodeCounts,
    pub bot_breakdown: HashMap<String, usize>, // Bot types in this segment
}

impl Segmentation {
    pub fn new() -> Self {
        Segmentation {
            name: "".to_string(),
            match_type: "".to_string(),
            urls: Vec::new(),
            count: 0,
            unique_ips: 0,
            status_codes: StatusCodeCounts::new(),
            bot_breakdown: HashMap::new(),
        }
    }

    pub fn add_url(&mut self, _url: String) {
        // Removed: Causes OOM and O(n^2) performance degradation on large log files.
        // Unique URLs per segment should be queried from the database if needed.
    }

    pub fn add_entry(&mut self, entry: &LogEntry) {
        self.count += 1;
        self.status_codes.add_status(entry.status);

        // Track bot types in this segment
        if entry.is_crawler {
            let crawler_type = entry.crawler_type.to_lowercase();
            *self.bot_breakdown.entry(crawler_type).or_insert(0) += 1;
        }
    }

    /// Strip heavyweight data that shouldn't be serialized over IPC events.
    pub fn strip_heavy_data(&mut self) {
        self.urls.clear();
    }
}

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
    pub position: Option<i32>,
    pub clicks: Option<i32>,
    pub ctr: Option<f64>,
    pub impressions: Option<i32>,
    pub gsc_url: Option<String>,
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
    pub segment: String,
    pub segment_match: Option<String>,
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
    pub segmentations: Vec<Segmentation>,
    pub segment_summary: SegmentSummary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SegmentSummary {
    pub total_segments: usize,
    pub total_segment_requests: usize,
    pub average_requests_per_segment: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct StatusCodeCounts {
    pub counts: HashMap<u16, usize>,
    pub success_count: usize,
    pub redirect_count: usize,
    pub client_error_count: usize,
    pub server_error_count: usize,
    pub other_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct BotStats {
    pub count: usize,
    pub status_codes: StatusCodeCounts,
    pub pages: Vec<String>,
    pub page_frequencies: HashMap<String, Vec<BotPageDetails>>,
    pub page_status_codes: HashMap<String, StatusCodeCounts>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Totals {
    // Keep original fields for backward compatibility
    pub google: usize,
    pub bing: usize,
    pub semrush: usize,
    pub hrefs: usize,
    pub moz: usize,
    pub uptime: usize,
    pub openai: usize,
    pub claude: usize,

    // New fields for detailed bot stats
    pub bot_stats: BotStatsMap,
    pub status_codes: StatusCodeCounts,

    // Keep original page fields
    pub google_bot_pages: Vec<String>,
    pub google_bot_page_frequencies: HashMap<String, Vec<BotPageDetails>>,
    pub bing_bot_pages: Vec<String>,
    pub bing_bot_page_frequencies: HashMap<String, Vec<BotPageDetails>>,
    pub openai_bot_pages: Vec<String>,
    pub openai_bot_page_frequencies: HashMap<String, Vec<BotPageDetails>>,
    pub claude_bot_pages: Vec<String>,
    pub claude_bot_page_frequencies: HashMap<String, Vec<BotPageDetails>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct BotStatsMap {
    pub google: BotStats,
    pub bing: BotStats,
    pub semrush: BotStats,
    pub hrefs: BotStats,
    pub moz: BotStats,
    pub uptime: BotStats,
    pub openai: BotStats,
    pub claude: BotStats,
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
    pub status: u16,
    #[serde(default)]
    pub status_codes: StatusCodeCounts,
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

impl StatusCodeCounts {
    pub fn new() -> Self {
        Self {
            counts: HashMap::new(),
            success_count: 0,
            redirect_count: 0,
            client_error_count: 0,
            server_error_count: 0,
            other_count: 0,
        }
    }

    pub fn add_status(&mut self, status: u16) {
        *self.counts.entry(status).or_insert(0) += 1;

        match status {
            200..=299 => self.success_count += 1,
            300..=399 => self.redirect_count += 1,
            400..=499 => self.client_error_count += 1,
            500..=599 => self.server_error_count += 1,
            _ => self.other_count += 1,
        }
    }

    fn merge(&mut self, other: &StatusCodeCounts) {
        for (&status, &count) in &other.counts {
            *self.counts.entry(status).or_insert(0) += count;
        }
        self.success_count += other.success_count;
        self.redirect_count += other.redirect_count;
        self.client_error_count += other.client_error_count;
        self.server_error_count += other.server_error_count;
        self.other_count += other.other_count;
    }
}

impl BotStats {
    fn new() -> Self {
        Self {
            count: 0,
            status_codes: StatusCodeCounts::new(),
            pages: Vec::new(),
            page_frequencies: HashMap::new(),
            page_status_codes: HashMap::new(),
        }
    }

    fn add_entry(&mut self, entry: &LogEntry) {
        self.count += 1;
        self.status_codes.add_status(entry.status);
        // Removed per-page status tracking to prevent OOM.
        // This detail is now retrieved from the database on demand.
    }

    /// Strip heavyweight data that shouldn't be serialized over IPC events.
    /// The detailed per-page data is already in the SQLite DB.
    fn strip_heavy_data(&mut self) {
        self.pages.clear();
        self.page_frequencies.clear();
        self.page_status_codes.clear();
    }
}

impl BotStatsMap {
    /// Strip all heavyweight per-page data from every bot's stats.
    /// Call this before emitting the overview event to prevent UI freeze.
    fn strip_heavy_data(&mut self) {
        self.google.strip_heavy_data();
        self.bing.strip_heavy_data();
        self.semrush.strip_heavy_data();
        self.hrefs.strip_heavy_data();
        self.moz.strip_heavy_data();
        self.uptime.strip_heavy_data();
        self.openai.strip_heavy_data();
        self.claude.strip_heavy_data();
    }
}

pub fn analyse_log(data: LogInput, app_handle: AppHandle) -> Result<(), String> {
    let file_count = data.log_contents.len();
    let (progress_tx, progress_rx) = mpsc::channel();
    let (entry_tx, entry_rx) = mpsc::sync_channel(10000);

    // PRE-LOAD all bot IP ranges BEFORE starting log parsing
    // This ensures Google/Bing/OpenAI verification works during parsing
    crate::loganalyser::helpers::parse_logs::preload_all_ip_ranges_sync();

    // Progress reporting thread
    let app_handle_clone = app_handle.clone();
    thread::spawn(move || {
        let mut last_emitted = std::time::Instant::now();
        let mut last_update: Option<ProgressUpdate> = None;
        for update in progress_rx {
            if last_emitted.elapsed() >= Duration::from_millis(50) {
                let _ = app_handle_clone.emit("progress-update", &update);
                last_emitted = std::time::Instant::now();
                last_update = None;
            } else {
                last_update = Some(update);
            }
        }
        // Always emit the final update so the frontend sees 100%
        if let Some(final_update) = last_update {
            let _ = app_handle_clone.emit("progress-update", &final_update);
        }
    });

    // Wait for the initialize to succeed before creating threads
    if let Err(e) = init_active_db() {
        println!("Failed to init active db: {}", e);
        return Err(e);
    }

    // Entry streaming thread
    let app_handle_stream = app_handle.clone();
    thread::spawn(move || {
        let settings = match tokio::task::block_in_place(|| {
            tauri::async_runtime::block_on(settings::load_settings())
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
                        if let Err(e) = insert_active_logs_batch(&entries_buffer) {
                            println!("Failed to insert active logs chunk: {}", e);
                        }
                        let chunk = LogResult {
                            overview: LogAnalysisResult::default(),
                            entries: Vec::new(),
                        };

                        entries_buffer.clear();
                        thread::sleep(Duration::from_millis(settings.log_sleep_stream_duration));
                    }
                }
                StreamEntry::Overview(o) => {
                    overview = Some(o);
                }
            }
        }

        if !entries_buffer.is_empty() {
            if let Err(e) = insert_active_logs_batch(&entries_buffer) {
                println!("Failed to insert final active logs chunk: {}", e);
            }
            let chunk = LogResult {
                overview: LogAnalysisResult::default(),
                entries: Vec::new(),
            };

        }

        if let Some(mut overview) = overview {
            if let Ok(stats) = crate::loganalyser::active_db::get_active_logs_stats(crate::loganalyser::active_db::ActiveFilters::default()) {
                overview.line_count = stats.line_count;
                overview.unique_ips = stats.unique_ips;
                overview.unique_user_agents = stats.unique_user_agents;
                overview.crawler_count = stats.crawler_count;
                overview.success_rate = stats.success_rate;
                overview.log_start_time = stats.log_start_time.clone();
                overview.log_finish_time = stats.log_finish_time.clone();
                overview.totals.google = stats.totals.google;
                overview.totals.bing = stats.totals.bing;
                overview.totals.semrush = stats.totals.semrush;
                overview.totals.hrefs = stats.totals.hrefs;
                overview.totals.moz = stats.totals.moz;
                overview.totals.uptime = stats.totals.uptime;
                overview.totals.openai = stats.totals.openai;
                overview.totals.claude = stats.totals.claude;
                overview.totals.status_codes = stats.totals.status_codes;
            }
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
    let mut total_requests = 0;
    let mut success_count = 0;
    let mut status_code_counts = StatusCodeCounts::new();
    
    let mut log_start_time = String::new();
    let mut log_finish_time = String::new();

    // Initialize bot stats
    let mut bot_stats = BotStatsMap::default();
    let mut bot_counts = [0; 8];

    // SEGMENTATION - Initialize segment tracking
    let mut segments: HashMap<String, Segmentation> = HashMap::new();
    let mut segment_ips: HashMap<String, HashSet<String>> = HashMap::new();

    for (index, (filename, log_content)) in data.log_contents.into_iter().enumerate() {
        let _ = progress_tx.send(ProgressUpdate {
            current_file: index + 1,
            total_files: file_count,
            percentage: (index as f32 / file_count as f32) * 100.0,
            filename: filename.clone(),
            phase: "started".to_string(),
        });

        parse_log_entries(&log_content, |e| {
            let is_crawler = is_crawler(&e.user_agent);
            let entry = LogEntry {
                ip: e.ip.clone(),
                timestamp: e.timestamp.format("%Y-%m-%d %H:%M:%S").to_string(),
                method: e.method,
                path: e.path,
                position: e.position,
                impressions: e.impressions,
                clicks: e.clicks,
                ctr: e.ctr,
                gsc_url: e.gsc_url,
                status: e.status,
                user_agent: e.user_agent,
                referer: e.referer,
                response_size: e.response_size,
                country: extract_country(&e.ip),
                crawler_type: e.crawler_type,
                is_crawler,
                file_type: e.file_type,
                browser: browser_trim_name::trim_browser_name(&e.browser),
                verified: e.verified,
                segment: e.segment.clone(),
                segment_match: e.segment_match.clone(),
                taxonomy: Some(e.taxonomy),
                filename: filename.clone(),
            };

            // Track start/finish times
            if log_start_time.is_empty() {
                log_start_time = entry.timestamp.clone();
            }
            log_finish_time = entry.timestamp.clone();

            // Update segment statistics
            if !entry.segment.is_empty() {
                let segment = segments.entry(entry.segment.clone()).or_insert_with(|| {
                    let mut seg = Segmentation::new();
                    seg.name = entry.segment.clone();
                    seg.match_type = entry.segment_match.clone().unwrap_or_default();
                    seg
                });

                segment.add_entry(&entry);

                // Track unique IPs per segment
                let segment_ip_set = segment_ips
                    .entry(entry.segment.clone())
                    .or_insert_with(HashSet::new);
                segment_ip_set.insert(entry.ip.clone());

                // Add URL if not already present
                segment.add_url(entry.path.clone());
            }

            // Update statistics
            total_requests += 1;
            if entry.status >= 200 && entry.status < 300 {
                success_count += 1;
            }

            // Update overall status code counts
            status_code_counts.add_status(entry.status);

            // Update bot counts and their status codes
            let crawler_type = entry.crawler_type.to_lowercase();

            if crawler_type.contains("google") {
                bot_counts[0] += 1;
                bot_stats.google.add_entry(&entry);
            } else if crawler_type.contains("bing") {
                bot_counts[1] += 1;
                bot_stats.bing.add_entry(&entry);
            } else if crawler_type.contains("semrush") {
                bot_counts[2] += 1;
                bot_stats.semrush.add_entry(&entry);
            } else if crawler_type.contains("hrefs") {
                bot_counts[3] += 1;
                bot_stats.hrefs.add_entry(&entry);
            } else if crawler_type.contains("moz") {
                bot_counts[4] += 1;
                bot_stats.moz.add_entry(&entry);
            } else if crawler_type.contains("uptime") {
                bot_counts[5] += 1;
                bot_stats.uptime.add_entry(&entry);
            } else if crawler_type.contains("open")
                || crawler_type.contains("openai")
                || crawler_type.contains("gpt")
                || entry.user_agent.contains("OAI-SearchBot")
                || entry.user_agent.contains("ChatGPT-User")
                || entry.user_agent.contains("GPTBot")
                || entry.user_agent.contains("openai.com/searchbot")
                || entry.user_agent.contains("openai.com/bot")
                || entry.user_agent.contains("openai.com/gptbot")
            {
                bot_counts[6] += 1;
                bot_stats.openai.add_entry(&entry);
            } else if crawler_type.contains("claude") {
                bot_counts[7] += 1;
                bot_stats.claude.add_entry(&entry);
            }

            // Stream the entry
            let _ = entry_tx.send(StreamEntry::LogEntry(entry));
        });

        let _ = progress_tx.send(ProgressUpdate {
            current_file: index + 1,
            total_files: file_count,
            percentage: ((index + 1) as f32 / file_count as f32) * 100.0,
            filename,
            phase: "completed".to_string(),
        });
    }

    if total_requests == 0 {
        return Err("No logs found".to_string());
    }

    // Update segment counts with unique IPs
    for (segment_name, ip_set) in segment_ips {
        if let Some(segment) = segments.get_mut(&segment_name) {
            segment.unique_ips = ip_set.len();
        }
    }

    // Convert segments HashMap to Vec for the result
    let mut segmentations: Vec<Segmentation> = segments.into_values().collect();

    // Calculate segment summary
    let total_segment_requests: usize = segmentations.iter().map(|s| s.count).sum();
    let segment_summary = SegmentSummary {
        total_segments: segmentations.len(),
        total_segment_requests,
        average_requests_per_segment: if !segmentations.is_empty() {
            total_segment_requests as f32 / segmentations.len() as f32
        } else {
            0.0
        },
    };

    // Strip out heavy segment lists
    for segment in &mut segmentations {
        segment.strip_heavy_data();
    }


    // Strip heavyweight per-page data from bot_stats before emitting.
    // This data is already persisted in the SQLite DB and can be queried on demand.
    // Sending it over IPC causes the frontend to freeze trying to merge/deep-clone it.
    bot_stats.strip_heavy_data();

    // GET CUMULATIVE STATS FROM DB TO PROVIDE A TRUE "APPEND" EXPERIENCE
    // We'll merge our current segmentation/frequency data with the global stats from DB
    let cumulative_overview = if let Ok(stats) = get_active_logs_stats(crate::loganalyser::active_db::ActiveFilters::default()) {
        LogAnalysisResult {
            message: "Log analysis completed (cumulative)".to_string(),
            line_count: stats.line_count,
            unique_ips: stats.unique_ips,
            unique_user_agents: stats.unique_user_agents,
            crawler_count: stats.crawler_count,
            success_rate: stats.success_rate,
            totals: Totals {
                google: stats.totals.google,
                bing: stats.totals.bing,
                semrush: stats.totals.semrush,
                hrefs: stats.totals.hrefs,
                moz: stats.totals.moz,
                uptime: stats.totals.uptime,
                openai: stats.totals.openai,
                claude: stats.totals.claude,
                bot_stats, // Use current batch's detailed stats for segments, but we should really merge them too if we want true append. For now, counts are most important.
                status_codes: stats.totals.status_codes,
                google_bot_pages: Vec::new(),
                google_bot_page_frequencies: HashMap::new(),
                bing_bot_pages: Vec::new(),
                bing_bot_page_frequencies: HashMap::new(),
                openai_bot_pages: Vec::new(),
                openai_bot_page_frequencies: HashMap::new(),
                claude_bot_pages: Vec::new(),
                claude_bot_page_frequencies: HashMap::new(),
            },
            log_start_time: stats.log_start_time,
            log_finish_time: stats.log_finish_time,
            file_count: stats.file_count, // Updated later if needed
            segmentations, // We keep the current batch's segmentations or we'd need to re-scan the whole DB
            segment_summary,
        }
    } else {
        // Fallback to current batch if DB stats fail
        LogAnalysisResult {
            message: "Log analysis completed".to_string(),
            line_count: total_requests,
            unique_ips: 0,
            unique_user_agents: 0,
            crawler_count: 0,
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
                bot_stats,
                status_codes: status_code_counts,
                google_bot_pages: Vec::new(),
                google_bot_page_frequencies: HashMap::new(),
                bing_bot_pages: Vec::new(),
                bing_bot_page_frequencies: HashMap::new(),
                openai_bot_pages: Vec::new(),
                openai_bot_page_frequencies: HashMap::new(),
                claude_bot_pages: Vec::new(),
                claude_bot_page_frequencies: HashMap::new(),
            },
            log_start_time,
            log_finish_time,
            file_count,
            segmentations,
            segment_summary,
        }
    };

    let _ = entry_tx.send(StreamEntry::Overview(cumulative_overview));

    Ok(())
}

/// Analyse logs from file paths - reads files line-by-line via BufReader to avoid loading
/// entire file contents into memory. This prevents OOM crashes on large log files.
pub fn analyse_log_from_paths(file_paths: Vec<String>, app_handle: AppHandle) -> Result<(), String> {
    let file_count = file_paths.len();
    let (progress_tx, progress_rx) = mpsc::channel();
    let (entry_tx, entry_rx) = mpsc::sync_channel(10000);

    // PRE-LOAD all bot IP ranges BEFORE starting log parsing
    preload_all_ip_ranges_sync();

    // Progress reporting thread
    let app_handle_clone = app_handle.clone();
    thread::spawn(move || {
        let mut last_emitted = std::time::Instant::now();
        let mut last_update: Option<ProgressUpdate> = None;
        for update in progress_rx {
            if last_emitted.elapsed() >= Duration::from_millis(50) {
                let _ = app_handle_clone.emit("progress-update", &update);
                last_emitted = std::time::Instant::now();
                last_update = None;
            } else {
                last_update = Some(update);
            }
        }
        // Always emit the final update so the frontend sees 100%
        if let Some(final_update) = last_update {
            let _ = app_handle_clone.emit("progress-update", &final_update);
        }
    });

    // Wait for the initialize to succeed before creating threads
    if let Err(e) = init_active_db() {
        println!("Failed to init active db: {}", e);
        return Err(e);
    }

    // Entry streaming thread
    let app_handle_stream = app_handle.clone();
    thread::spawn(move || {
        let settings = match tokio::task::block_in_place(|| {
            tauri::async_runtime::block_on(settings::load_settings())
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
                        if let Err(e) = insert_active_logs_batch(&entries_buffer) {
                            println!("Failed to insert active logs chunk: {}", e);
                        }

                        entries_buffer.clear();
                        thread::sleep(Duration::from_millis(settings.log_sleep_stream_duration));
                    }
                }
                StreamEntry::Overview(o) => {
                    overview = Some(o);
                }
            }
        }

        if !entries_buffer.is_empty() {
            if let Err(e) = insert_active_logs_batch(&entries_buffer) {
                println!("Failed to insert final active logs chunk: {}", e);
            }
            let chunk = LogResult {
                overview: LogAnalysisResult::default(),
                entries: Vec::new(),
            };

        }

        if let Some(mut overview) = overview {
            if let Ok(stats) = crate::loganalyser::active_db::get_active_logs_stats(crate::loganalyser::active_db::ActiveFilters::default()) {
                overview.line_count = stats.line_count;
                overview.unique_ips = stats.unique_ips;
                overview.unique_user_agents = stats.unique_user_agents;
                overview.crawler_count = stats.crawler_count;
                overview.success_rate = stats.success_rate;
                overview.log_start_time = stats.log_start_time.clone();
                overview.log_finish_time = stats.log_finish_time.clone();
                overview.totals.google = stats.totals.google;
                overview.totals.bing = stats.totals.bing;
                overview.totals.semrush = stats.totals.semrush;
                overview.totals.hrefs = stats.totals.hrefs;
                overview.totals.moz = stats.totals.moz;
                overview.totals.uptime = stats.totals.uptime;
                overview.totals.openai = stats.totals.openai;
                overview.totals.claude = stats.totals.claude;
                overview.totals.status_codes = stats.totals.status_codes;
            }
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
    let mut total_requests = 0;
    let mut success_count = 0;
    let mut status_code_counts = StatusCodeCounts::new();

    let mut log_start_time = String::new();
    let mut log_finish_time = String::new();

    // Initialize bot stats
    let mut bot_stats = BotStatsMap::default();
    let mut bot_counts = [0; 8];

    // SEGMENTATION

    // SEGMENTATION
    let mut segments: HashMap<String, Segmentation> = HashMap::new();
    let mut segment_ips: HashMap<String, HashSet<String>> = HashMap::new();

    for (index, file_path) in file_paths.iter().enumerate() {
        let filename = std::path::Path::new(file_path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or(file_path)
            .to_string();

        // Get file size for intra-file progress reporting
        let file_size = std::fs::metadata(file_path)
            .map(|m| m.len())
            .unwrap_or(0) as f32;

        let _ = progress_tx.send(ProgressUpdate {
            current_file: index + 1,
            total_files: file_count,
            percentage: (index as f32 / file_count as f32) * 100.0,
            filename: filename.clone(),
            phase: "started".to_string(),
        });

        // Open the file and read line-by-line with BufReader — no full file in memory
        let file = match File::open(file_path) {
            Ok(f) => f,
            Err(e) => {
                println!("Failed to open file {}: {}", file_path, e);
                continue;
            }
        };
        let reader = BufReader::with_capacity(8 * 1024 * 1024, file); // 8MB buffer
        let mut bytes_read: u64 = 0;
        let mut lines_since_progress: usize = 0;

        for line_result in reader.lines() {
            let line = match line_result {
                Ok(l) => l,
                Err(_) => continue,
            };
            bytes_read += line.len() as u64 + 1; // +1 for newline
            lines_since_progress += 1;

            // Send intra-file progress every 5000 lines
            if lines_since_progress >= 5000 && file_size > 0.0 {
                lines_since_progress = 0;
                let file_fraction = (bytes_read as f32 / file_size).min(1.0);
                // Blend file index progress with intra-file progress
                let overall_pct = ((index as f32 + file_fraction) / file_count as f32) * 100.0;
                let _ = progress_tx.send(ProgressUpdate {
                    current_file: index + 1,
                    total_files: file_count,
                    percentage: overall_pct,
                    filename: filename.clone(),
                    phase: "processing".to_string(),
                });
            }

            let line = line.trim().to_string();
            if line.is_empty() {
                continue;
            }

            if let Some(e) = parse_log_line(&line) {
                let is_crawler_flag = is_crawler(&e.user_agent);
                let entry = LogEntry {
                    ip: e.ip.clone(),
                    timestamp: e.timestamp.format("%Y-%m-%d %H:%M:%S").to_string(),
                    method: e.method,
                    path: e.path,
                    position: e.position,
                    impressions: e.impressions,
                    clicks: e.clicks,
                    ctr: e.ctr,
                    gsc_url: e.gsc_url,
                    status: e.status,
                    user_agent: e.user_agent,
                    referer: e.referer,
                    response_size: e.response_size,
                    country: extract_country(&e.ip),
                    crawler_type: e.crawler_type,
                    is_crawler: is_crawler_flag,
                    file_type: e.file_type,
                    browser: browser_trim_name::trim_browser_name(&e.browser),
                    verified: e.verified,
                    segment: e.segment.clone(),
                    segment_match: e.segment_match.clone(),
                    taxonomy: Some(e.taxonomy),
                    filename: filename.clone(),
                };

                // Track start/finish times
                if log_start_time.is_empty() {
                    log_start_time = entry.timestamp.clone();
                }
                log_finish_time = entry.timestamp.clone();

                // Update segment statistics
                if !entry.segment.is_empty() {
                    let segment = segments.entry(entry.segment.clone()).or_insert_with(|| {
                        let mut seg = Segmentation::new();
                        seg.name = entry.segment.clone();
                        seg.match_type = entry.segment_match.clone().unwrap_or_default();
                        seg
                    });
                    segment.add_entry(&entry);
                    let segment_ip_set = segment_ips
                        .entry(entry.segment.clone())
                        .or_insert_with(HashSet::new);
                    segment_ip_set.insert(entry.ip.clone());
                    segment.add_url(entry.path.clone());
                }

                // Update statistics
                total_requests += 1;
                if entry.status >= 200 && entry.status < 300 {
                    success_count += 1;
                }
                status_code_counts.add_status(entry.status);

                let crawler_type = entry.crawler_type.to_lowercase();
                if crawler_type.contains("google") {
                    bot_counts[0] += 1;
                    bot_stats.google.add_entry(&entry);
                } else if crawler_type.contains("bing") {
                    bot_counts[1] += 1;
                    bot_stats.bing.add_entry(&entry);
                } else if crawler_type.contains("semrush") {
                    bot_counts[2] += 1;
                    bot_stats.semrush.add_entry(&entry);
                } else if crawler_type.contains("hrefs") {
                    bot_counts[3] += 1;
                    bot_stats.hrefs.add_entry(&entry);
                } else if crawler_type.contains("moz") {
                    bot_counts[4] += 1;
                    bot_stats.moz.add_entry(&entry);
                } else if crawler_type.contains("uptime") {
                    bot_counts[5] += 1;
                    bot_stats.uptime.add_entry(&entry);
                } else if crawler_type.contains("open")
                    || crawler_type.contains("openai")
                    || crawler_type.contains("gpt")
                    || entry.user_agent.contains("OAI-SearchBot")
                    || entry.user_agent.contains("ChatGPT-User")
                    || entry.user_agent.contains("GPTBot")
                    || entry.user_agent.contains("openai.com/searchbot")
                    || entry.user_agent.contains("openai.com/bot")
                    || entry.user_agent.contains("openai.com/gptbot")
                {
                    bot_counts[6] += 1;
                    bot_stats.openai.add_entry(&entry);
                } else if crawler_type.contains("claude") {
                    bot_counts[7] += 1;
                    bot_stats.claude.add_entry(&entry);
                }

                // Stream the entry
                let _ = entry_tx.send(StreamEntry::LogEntry(entry));
            }
        }

        let _ = progress_tx.send(ProgressUpdate {
            current_file: index + 1,
            total_files: file_count,
            percentage: ((index + 1) as f32 / file_count as f32) * 100.0,
            filename,
            phase: "completed".to_string(),
        });
    }

    if total_requests == 0 {
        return Err("No logs found".to_string());
    }

    // Update segment counts with unique IPs
    for (segment_name, ip_set) in segment_ips {
        if let Some(segment) = segments.get_mut(&segment_name) {
            segment.unique_ips = ip_set.len();
        }
    }

    let mut segmentations: Vec<Segmentation> = segments.into_values().collect();
    let total_segment_requests: usize = segmentations.iter().map(|s| s.count).sum();
    let segment_summary = SegmentSummary {
        total_segments: segmentations.len(),
        total_segment_requests,
        average_requests_per_segment: if !segmentations.is_empty() {
            total_segment_requests as f32 / segmentations.len() as f32
        } else {
            0.0
        },
    };

    // Strip out heavy segment lists
    for segment in &mut segmentations {
        segment.strip_heavy_data();
    }


    // Strip heavyweight per-page data from bot_stats before emitting.
    // This data is already persisted in the SQLite DB and can be queried on demand.
    // Sending it over IPC causes the frontend to freeze trying to merge/deep-clone it.
    bot_stats.strip_heavy_data();

    let cumulative_overview = if let Ok(stats) = get_active_logs_stats(crate::loganalyser::active_db::ActiveFilters::default()) {
        LogAnalysisResult {
            message: "Log analysis completed (cumulative)".to_string(),
            line_count: stats.line_count,
            unique_ips: stats.unique_ips,
            unique_user_agents: stats.unique_user_agents,
            crawler_count: stats.crawler_count,
            success_rate: stats.success_rate,
            totals: Totals {
                google: stats.totals.google,
                bing: stats.totals.bing,
                semrush: stats.totals.semrush,
                hrefs: stats.totals.hrefs,
                moz: stats.totals.moz,
                uptime: stats.totals.uptime,
                openai: stats.totals.openai,
                claude: stats.totals.claude,
                bot_stats,
                status_codes: stats.totals.status_codes,
                // Send empty page lists — data is in DB, query on demand
                google_bot_pages: Vec::new(),
                google_bot_page_frequencies: HashMap::new(),
                bing_bot_pages: Vec::new(),
                bing_bot_page_frequencies: HashMap::new(),
                openai_bot_pages: Vec::new(),
                openai_bot_page_frequencies: HashMap::new(),
                claude_bot_pages: Vec::new(),
                claude_bot_page_frequencies: HashMap::new(),
            },
            log_start_time: stats.log_start_time,
            log_finish_time: stats.log_finish_time,
            file_count: stats.file_count,
            segmentations,
            segment_summary,
        }
    } else {
        // Fallback to current batch if DB stats fail
        LogAnalysisResult {
            message: "Log analysis completed".to_string(),
            line_count: total_requests,
            unique_ips: 0,
            unique_user_agents: 0,
            crawler_count: 0,
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
                bot_stats,
                status_codes: status_code_counts,
                google_bot_pages: Vec::new(),
                google_bot_page_frequencies: HashMap::new(),
                bing_bot_pages: Vec::new(),
                bing_bot_page_frequencies: HashMap::new(),
                openai_bot_pages: Vec::new(),
                openai_bot_page_frequencies: HashMap::new(),
                claude_bot_pages: Vec::new(),
                claude_bot_page_frequencies: HashMap::new(),
            },
            log_start_time,
            log_finish_time,
            file_count,
            segmentations,
            segment_summary,
        }
    };

    let _ = entry_tx.send(StreamEntry::Overview(cumulative_overview));

    Ok(())
}

// Enhanced segment_log function for detailed segment analysis
pub fn segment_log_enhanced(data: &LogInput) -> Vec<Segmentation> {
    let mut segments: HashMap<String, Segmentation> = HashMap::new();
    let mut segment_ips: HashMap<String, HashSet<String>> = HashMap::new();

    for (_filename, log_content) in &data.log_contents {
        parse_log_entries(log_content, |entry| {
            if !entry.segment.is_empty() {
                let segment = segments.entry(entry.segment.clone()).or_insert_with(|| {
                    let mut seg = Segmentation::new();
                    seg.name = entry.segment.clone();
                    seg.match_type = entry.segment_match.clone().unwrap_or_default();
                    seg
                });

                // Add entry data
                segment.add_entry(&LogEntry {
                    ip: entry.ip.clone(),
                    timestamp: entry.timestamp.format("%Y-%m-%d %H:%M:%S").to_string(),
                    method: entry.method.clone(),
                    path: entry.path.clone(),
                    position: entry.position,
                    impressions: entry.impressions,
                    clicks: entry.clicks,
                    ctr: entry.ctr,
                    gsc_url: entry.gsc_url.clone(),
                    status: entry.status,
                    user_agent: entry.user_agent.clone(),
                    referer: entry.referer.clone(),
                    response_size: entry.response_size,
                    country: extract_country(&entry.ip),
                    crawler_type: entry.crawler_type.clone(),
                    is_crawler: is_crawler(&entry.user_agent),
                    file_type: entry.file_type.clone(),
                    browser: browser_trim_name::trim_browser_name(&entry.browser),
                    verified: entry.verified,
                    segment: entry.segment.clone(),
                    segment_match: entry.segment_match.clone(),
                    taxonomy: Some(entry.taxonomy.clone()),
                    filename: "".to_string(),
                });

                // Track unique IPs
                let segment_ip_set = segment_ips
                    .entry(entry.segment.clone())
                    .or_insert_with(HashSet::new);
                segment_ip_set.insert(entry.ip.clone());
            }
        });
    }

    // Update segment counts with unique IPs
    for (segment_name, ip_set) in segment_ips {
        if let Some(segment) = segments.get_mut(&segment_name) {
            segment.unique_ips = ip_set.len();
        }
    }

    segments.into_values().collect()
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
            bot_stats: BotStatsMap::default(),
            status_codes: StatusCodeCounts::new(),
            google_bot_pages: Vec::new(),
            google_bot_page_frequencies: HashMap::new(),
            bing_bot_pages: Vec::new(),
            bing_bot_page_frequencies: HashMap::new(),
            openai_bot_pages: Vec::new(),
            openai_bot_page_frequencies: HashMap::new(),
            claude_bot_pages: Vec::new(),
            claude_bot_page_frequencies: HashMap::new(),
        }
    }
}

impl Default for SegmentSummary {
    fn default() -> Self {
        Self {
            total_segments: 0,
            total_segment_requests: 0,
            average_requests_per_segment: 0.0,
        }
    }
}
