use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

use crate::loganalyser::helpers::{
    country_extractor::extract_country, crawler_type::is_crawler, parse_logs::parse_log_entries,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct LogEntry {
    pub ip: String,
    pub timestamp: String, // Serialized as string
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
    pub entries: Vec<LogEntry>, // Now contains complete entries
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LogInput {
    pub log_content: String,
}

pub fn analyse_log(data: LogInput) -> Result<LogResult, String> {
    let log = data.log_content;
    let entries = parse_log_entries(&log);

    let log_start_time = entries
        .first()
        .map(|e| e.timestamp.format("%Y-%m-%d %H:%M:%S").to_string())
        .unwrap_or_default();
    let log_finish_time = entries
        .last()
        .map(|e| e.timestamp.format("%Y-%m-%d %H:%M:%S").to_string())
        .unwrap_or_default();

    // Enhance each entry with additional data
    let enhanced_entries: Vec<LogEntry> = entries
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
                browser: e.browser,
                verified: e.verified,
            }
        })
        .collect();

    let crawler_count = enhanced_entries.iter().filter(|e| e.is_crawler).count();
    let total_requests = enhanced_entries.len();
    let success_count = enhanced_entries
        .iter()
        .filter(|e| e.status >= 200 && e.status < 300)
        .count();
    let unique_ips = enhanced_entries
        .iter()
        .map(|e| &e.ip)
        .collect::<HashSet<_>>()
        .len();
    let unique_user_agents = enhanced_entries
        .iter()
        .map(|e| &e.user_agent)
        .collect::<HashSet<_>>()
        .len();

    // DEFINE THE TOTALS FOR EACH CRAWLER TYPE
    let google_bot_totals = enhanced_entries
        .iter()
        .filter(|e| e.crawler_type.to_lowercase().starts_with("google"))
        .count();
    let bing_bot_totals = enhanced_entries
        .iter()
        .filter(|e| e.crawler_type.to_lowercase().starts_with("bing"))
        .count();
    let semrush_bot_totals = enhanced_entries
        .iter()
        .filter(|e| e.crawler_type.to_lowercase().starts_with("semrush"))
        .count();
    let hrefs_bot_totals = enhanced_entries
        .iter()
        .filter(|e| e.crawler_type.to_lowercase().starts_with("hrefs"))
        .count();
    let moz_bot_totals = enhanced_entries
        .iter()
        .filter(|e| e.crawler_type.to_lowercase().starts_with("moz"))
        .count();
    let uptime_bot_totals = enhanced_entries
        .iter()
        .filter(|e| e.crawler_type.to_lowercase().starts_with("uptime"))
        .count();
    let openai_bot_totals = enhanced_entries
        .iter()
        .filter(|e| e.crawler_type.to_lowercase().starts_with("chat"))
        .count();
    let claude_bot_totals = enhanced_entries
        .iter()
        .filter(|e| e.crawler_type.to_lowercase().starts_with("claude"))
        .count();

    // Filtering pages crawled by Google Bot
    let google_bot_pages = enhanced_entries
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
                frequency: 1, // Each entry contributes one to the frequency
                verified: entry.verified.clone(),
            };

            frequency_map
                .entry(key)
                .or_insert_with(Vec::new)
                .push(details);
        }

        // Aggregate frequencies for identical path:crawler_type combinations
        let mut aggregated_map: HashMap<String, Vec<BotPageDetails>> = HashMap::new();
        for (key, details_vec) in frequency_map {
            let aggregated_details = BotPageDetails {
                crawler_type: details_vec[0].crawler_type.clone(),
                file_type: details_vec[0].file_type.clone(), // Keep first file_type
                response_size: details_vec.iter().map(|d| d.response_size).sum(),
                timestamp: details_vec[0].timestamp.clone(), // Keep first timestamp
                method: details_vec[0].method.clone(),
                ip: details_vec[0].ip.clone(), // Keep first IP
                referer: details_vec[0].referer.clone(), // Keep first referer
                browser: details_vec[0].browser.clone(), // Keep first browser
                user_agent: details_vec[0].user_agent.clone(), // Keep first user agent
                frequency: details_vec.len(), // Frequency is the number of occurrences of this path:crawler_type
                verified: details_vec[0].verified.clone(),
            };
            aggregated_map.insert(key, vec![aggregated_details]);
        }

        aggregated_map
    }

    let google_bot_page_frequencies = calculate_url_frequencies(
        enhanced_entries
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
        },
        entries: enhanced_entries,
    })
}
