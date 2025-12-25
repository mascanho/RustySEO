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

    pub fn add_url(&mut self, url: String) {
        if !self.urls.contains(&url) {
            self.urls.push(url);
        }
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
    fn new() -> Self {
        Self {
            counts: HashMap::new(),
            success_count: 0,
            redirect_count: 0,
            client_error_count: 0,
            server_error_count: 0,
            other_count: 0,
        }
    }

    fn add_status(&mut self, status: u16) {
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
        self.pages.push(entry.path.clone());

        // Update page-specific status codes
        let page_status = self
            .page_status_codes
            .entry(entry.path.clone())
            .or_insert_with(StatusCodeCounts::new);
        page_status.add_status(entry.status);
    }
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
    let mut status_code_counts = StatusCodeCounts::new();

    // Initialize bot stats
    let mut bot_stats = BotStatsMap::default();
    let mut bot_counts = [0; 8];

    // For detailed frequency analysis (keep original fields)
    let mut google_bot_entries = Vec::new();
    let mut bing_bot_entries = Vec::new();
    let mut openai_bot_entries = Vec::new();
    let mut claude_bot_entries = Vec::new();

    // Keep original page lists
    let mut google_bot_pages = Vec::new();
    let mut bing_bot_pages = Vec::new();
    let mut openai_bot_pages = Vec::new();
    let mut claude_bot_pages = Vec::new();

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

        let entries = parse_log_entries(&log_content)
            .into_iter()
            .map(|e| {
                let is_crawler = is_crawler(&e.user_agent);
                let entry = LogEntry {
                    ip: e.ip.clone(),
                    timestamp: e.timestamp.format("%Y-%m-%d %H:%M:%S").to_string(),
                    method: e.method,
                    path: e.path,
                    position: e.position,
                    impressions: e.impressions,
                    clicks: e.clicks,
                    gsc_url: e.gsc_url,
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
                    segment: e.segment.clone(),
                    segment_match: e.segment_match.clone(),
                    taxonomy: Some(e.taxonomy),
                    filename: filename.clone(),
                };

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
                unique_ips.insert(entry.ip.clone());
                unique_user_agents.insert(entry.user_agent.clone());
                if entry.is_crawler {
                    crawler_count += 1;
                }
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
                    google_bot_entries.push(entry.clone());
                    google_bot_pages.push(entry.path.clone());
                } else if crawler_type.contains("bing") {
                    bot_counts[1] += 1;
                    bot_stats.bing.add_entry(&entry);
                    bing_bot_entries.push(entry.clone());
                    bing_bot_pages.push(entry.path.clone());
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
                    openai_bot_entries.push(entry.clone());
                    openai_bot_pages.push(entry.path.clone());
                } else if crawler_type.contains("claude") {
                    bot_counts[7] += 1;
                    bot_stats.claude.add_entry(&entry);
                    claude_bot_entries.push(entry.clone());
                    claude_bot_pages.push(entry.path.clone());
                }

                // Stream the entry
                let _ = entry_tx.send(StreamEntry::LogEntry(entry.clone()));

                entry
            })
            .collect::<Vec<_>>();

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

    // Update segment counts with unique IPs
    for (segment_name, ip_set) in segment_ips {
        if let Some(segment) = segments.get_mut(&segment_name) {
            segment.unique_ips = ip_set.len();
        }
    }

    // Convert segments HashMap to Vec for the result
    let segmentations: Vec<Segmentation> = segments.into_values().collect();

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

    // Calculate page frequencies for bots that have detailed entries
    let google_bot_page_frequencies =
        calculate_url_frequencies(google_bot_entries.iter().collect());
    let bing_bot_page_frequencies = calculate_url_frequencies(bing_bot_entries.iter().collect());
    let openai_bot_page_frequencies =
        calculate_url_frequencies(openai_bot_entries.iter().collect());
    let claude_bot_page_frequencies =
        calculate_url_frequencies(claude_bot_entries.iter().collect());

    // Update bot stats with page frequencies
    bot_stats.google.page_frequencies = google_bot_page_frequencies.clone();
    bot_stats.bing.page_frequencies = bing_bot_page_frequencies.clone();
    bot_stats.openai.page_frequencies = openai_bot_page_frequencies.clone();
    bot_stats.claude.page_frequencies = claude_bot_page_frequencies.clone();

    // DEBUG OUTPUT - Show page status code examples
    println!("=== DEBUG PAGE STATUS CODES ===");
    for (page, status_codes) in bot_stats.google.page_status_codes.iter().take(5) {
        println!(
            "Google Page: {} - Status codes: {:?}",
            page, status_codes.counts
        );
    }

    // DEBUG OUTPUT - Show segment information
    println!("=== DEBUG SEGMENT INFORMATION ===");
    for segment in &segmentations {
        println!(
            "Segment: {} - Requests: {} - Unique IPs: {} - URLs: {}",
            segment.name,
            segment.count,
            segment.unique_ips,
            segment.urls.len()
        );
    }

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
            // Original fields for backward compatibility
            google: bot_counts[0],
            bing: bot_counts[1],
            semrush: bot_counts[2],
            hrefs: bot_counts[3],
            moz: bot_counts[4],
            uptime: bot_counts[5],
            openai: bot_counts[6],
            claude: bot_counts[7],

            // New fields for detailed stats
            bot_stats,
            status_codes: status_code_counts,

            // Original page fields
            google_bot_pages,
            google_bot_page_frequencies,
            bing_bot_pages,
            bing_bot_page_frequencies,
            openai_bot_pages,
            openai_bot_page_frequencies,
            claude_bot_pages,
            claude_bot_page_frequencies,
        },
        log_start_time,
        log_finish_time,
        file_count,
        segmentations,
        segment_summary,
    };

    // Send the overview
    let _ = entry_tx.send(StreamEntry::Overview(overview));

    Ok(())
}

fn calculate_url_frequencies(entries: Vec<&LogEntry>) -> HashMap<String, Vec<BotPageDetails>> {
    let mut frequency_map: HashMap<String, Vec<&LogEntry>> = HashMap::new();

    for entry in entries {
        frequency_map
            .entry(entry.path.clone())
            .or_insert_with(Vec::new)
            .push(entry);
    }

    frequency_map
        .into_iter()
        .map(|(path, entries_vec)| {
            if entries_vec.is_empty() {
                return (path, Vec::new());
            }

            let first = entries_vec[0];
            let mut status_codes = StatusCodeCounts::new();
            for entry in &entries_vec {
                status_codes.add_status(entry.status);
            }

            let aggregated = BotPageDetails {
                crawler_type: first.crawler_type.clone(),
                file_type: first.file_type.clone(),
                response_size: entries_vec.iter().map(|d| d.response_size).sum(),
                timestamp: first.timestamp.clone(),
                ip: first.ip.clone(),
                referer: first.referer.clone(),
                browser: first.browser.clone(),
                user_agent: first.user_agent.clone(),
                frequency: entries_vec.len(),
                method: first.method.clone(),
                verified: first.verified,
                taxonomy: first.taxonomy.clone(),
                filename: first.filename.clone(),
                status: first.status,
                status_codes,
            };
            (path, vec![aggregated])
        })
        .collect()
}

// Enhanced segment_log function for detailed segment analysis
pub fn segment_log_enhanced(data: &LogInput) -> Vec<Segmentation> {
    let mut segments: HashMap<String, Segmentation> = HashMap::new();
    let mut segment_ips: HashMap<String, HashSet<String>> = HashMap::new();

    for (_filename, log_content) in &data.log_contents {
        let entries = parse_log_entries(log_content);

        for entry in entries {
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
                    filename: "".to_string(), // Not needed for this analysis
                });

                // Add URL if not already present
                segment.add_url(entry.path.clone());

                // Track unique IPs
                let segment_ip_set = segment_ips
                    .entry(entry.segment.clone())
                    .or_insert_with(HashSet::new);
                segment_ip_set.insert(entry.ip.clone());
            }
        }
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
