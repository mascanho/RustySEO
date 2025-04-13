use chrono::NaiveDateTime;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

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
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LogAnalysisResult {
    pub message: String,
    pub line_count: usize,
    pub unique_ips: usize,
    pub unique_user_agents: usize,
    pub crawler_count: usize,
    pub success_rate: f32,
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
                is_crawler,
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
        },
        entries: enhanced_entries,
    })
}
