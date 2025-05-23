use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use tauri::{Emitter, Manager};

use crate::loganalyser::helpers::{
    browser_trim_name, country_extractor::extract_country, crawler_type::is_crawler,
    parse_logs::parse_log_entries,
};

#[derive(Debug, Serialize, Deserialize)]
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
    pub filename: String, // Added to track which file each entry came from
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
    pub file_count: usize, // Added to track number of files processed
}

#[derive(Serialize, Deserialize, Debug)]
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
    pub filename: String, // Added to track which file each entry came from
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

#[derive(Serialize, Deserialize, Debug)]
pub struct LogInput {
    pub log_contents: Vec<(String, String)>, // Now accepts multiple files with their names
}

#[derive(Serialize, Deserialize, Clone)]
struct ProgressUpdate {
    current_file: usize,
    total_files: i32,
    percentage: f32,
    filename: String,
}

pub fn analyse_log(
    data: LogInput,
    log_count: &i32,
    app_handle: tauri::AppHandle,
) -> Result<LogResult, String> {
    let mut all_entries = Vec::new();
    let mut file_count: usize = 0;

    // Process each file
    for (filename, log_content) in data.log_contents {
        file_count += 1;


        let entries = parse_log_entries(&log_content);    

        // Add filename to each entry
        let entries_with_filename: Vec<LogEntry> = entries
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
                    filename: filename.clone(), // Add filename to each entry
                }
            })
            .collect();


            // STREAM THE INFORMATION TO THE FRONTEND

            let total = *log_count;
            let percentage = (file_count as f32 / total as f32) * 100.0;
        
            println!("Processing file: {}", filename);
            println!("Total logs: {}", total);
            println!("Processing log: {}", file_count);
            println!("Percentage complete: {:.2}%", percentage);
        
            // SEND PROGRESS TO THE FRONT END
            app_handle
                .emit(
                    "progress-update",
                    ProgressUpdate {
                        current_file: file_count,
                        total_files: total,
                        percentage,
                        filename: filename.clone(),
                    },
                )
                .unwrap();
        

        all_entries.extend(entries_with_filename);
    }


  

    if all_entries.is_empty() {
        return Ok(LogResult {
            overview: LogAnalysisResult {
                message: "No log entries found".to_string(),
                line_count: 0,
                unique_ips: 0,
                unique_user_agents: 0,
                crawler_count: 0,
                success_rate: 0.0,
                totals: Totals {
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
                },
                log_start_time: String::new(),
                log_finish_time: String::new(),
                file_count,
            },
            entries: Vec::new(),
        });
    }

    let log_start_time = all_entries
        .first()
        .map(|e| e.timestamp.clone())
        .unwrap_or_default();
    let log_finish_time = all_entries
        .last()
        .map(|e| e.timestamp.clone())
        .unwrap_or_default();

    let crawler_count = all_entries.iter().filter(|e| e.is_crawler).count();
    let total_requests = all_entries.len();
    let success_count = all_entries
        .iter()
        .filter(|e| e.status >= 200 && e.status < 300)
        .count();
    let unique_ips = all_entries
        .iter()
        .map(|e| &e.ip)
        .collect::<HashSet<_>>()
        .len();
    let unique_user_agents = all_entries
        .iter()
        .map(|e| &e.user_agent)
        .collect::<HashSet<_>>()
        .len();

    let google_bot_totals = all_entries
        .iter()
        .filter(|e| e.crawler_type.to_lowercase().starts_with("google"))
        .count();
    let bing_bot_totals = all_entries
        .iter()
        .filter(|e| e.crawler_type.to_lowercase().starts_with("bing"))
        .count();
    let semrush_bot_totals = all_entries
        .iter()
        .filter(|e| e.crawler_type.to_lowercase().starts_with("semrush"))
        .count();
    let hrefs_bot_totals = all_entries
        .iter()
        .filter(|e| e.crawler_type.to_lowercase().starts_with("hrefs"))
        .count();
    let moz_bot_totals = all_entries
        .iter()
        .filter(|e| e.crawler_type.to_lowercase().starts_with("moz"))
        .count();
    let uptime_bot_totals = all_entries
        .iter()
        .filter(|e| e.crawler_type.to_lowercase().starts_with("uptime"))
        .count();
    let openai_bot_totals = all_entries
        .iter()
        .filter(|e| e.crawler_type.to_lowercase().starts_with("chat"))
        .count();
    let claude_bot_totals = all_entries
        .iter()
        .filter(|e| e.crawler_type.to_lowercase().starts_with("claude"))
        .count();

    let google_bot_pages = all_entries
        .iter()
        .filter(|e| e.crawler_type.to_lowercase().contains("google"))
        .map(|e| e.path.clone())
        .collect::<Vec<_>>();

    fn calculate_url_frequencies(entries: Vec<&LogEntry>) -> HashMap<String, Vec<BotPageDetails>> {
        let mut frequency_map: HashMap<String, Vec<BotPageDetails>> = HashMap::new();

        for entry in entries {
            let key = format!("{}", entry.path);
            let details = BotPageDetails {
                crawler_type: entry.crawler_type.clone(),
                file_type: entry.file_type.clone(),
                response_size: entry.response_size,
                timestamp: entry.timestamp.clone(),
                ip: entry.ip.clone(),
                method: entry.method.clone(),
                referer: entry.referer.clone(),
                browser: entry.browser.clone(),
                user_agent: entry.user_agent.clone(),
                frequency: 1,
                verified: entry.verified.clone(),
                taxonomy: entry.taxonomy.clone(),
                filename: entry.filename.clone(),
            };

            frequency_map
                .entry(key)
                .or_insert_with(Vec::new)
                .push(details);
        }

        let mut aggregated_map: HashMap<String, Vec<BotPageDetails>> = HashMap::new();
        for (key, details_vec) in frequency_map {
            let aggregated_details = BotPageDetails {
                crawler_type: details_vec[0].crawler_type.clone(),
                file_type: details_vec[0].file_type.clone(),
                response_size: details_vec.iter().map(|d| d.response_size).sum(),
                timestamp: details_vec[0].timestamp.clone(),
                method: details_vec[0].method.clone(),
                ip: details_vec[0].ip.clone(),
                referer: details_vec[0].referer.clone(),
                browser: details_vec[0].browser.clone(),
                user_agent: details_vec[0].user_agent.clone(),
                frequency: details_vec.len(),
                verified: details_vec[0].verified.clone(),
                taxonomy: details_vec[0].taxonomy.clone(),
                filename: details_vec[0].filename.clone(),
            };
            aggregated_map.insert(key, vec![aggregated_details]);
        }

        aggregated_map
    }

    let google_bot_page_frequencies = calculate_url_frequencies(
        all_entries
            .iter()
            .filter(|e| e.crawler_type.to_lowercase().contains("google"))
            .collect(),
    );

   

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
                google: google_bot_totals,
                bing: bing_bot_totals,
                semrush: semrush_bot_totals,
                hrefs: hrefs_bot_totals,
                moz: moz_bot_totals,
                uptime: uptime_bot_totals,
                openai: openai_bot_totals,
                claude: claude_bot_totals,
                google_bot_pages,
                google_bot_page_frequencies,
            },
            log_start_time,
            log_finish_time,
            file_count,
        },
        entries: all_entries,
    })

   
}
