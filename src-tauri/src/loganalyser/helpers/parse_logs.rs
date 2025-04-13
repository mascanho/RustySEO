use chrono::NaiveDateTime;
use regex::Regex;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct LogEntry {
    pub ip: String,
    pub timestamp: NaiveDateTime,
    pub method: String,
    pub path: String,
    pub status: u16,
    pub user_agent: String,
    pub referer: Option<String>, // Changed to Option<String> since referer can be "-"
    pub response_size: u64,
}

pub fn parse_log_entries(log: &str) -> Vec<LogEntry> {
    // Updated regex to capture all fields including referer and response size
    let re = Regex::new(r#"(?x)
        ^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+       # IP and timestamp
        "(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH)\s+([^?"]+)(?:\?[^"]*)?\s+HTTP/[0-9.]+"\s+  # Method and path
        (\d{3})\s+(\d+)\s+                          # Status and response size
        "([^"]*)"\s+                                # Referer
        "([^"]*)"                                   # User agent
    "#).expect("Invalid regex pattern");

    log.lines()
        .enumerate()
        .filter_map(|(i, line)| {
            let line = line.trim();
            if line.is_empty() {
                return None;
            }

            re.captures(line).map(|caps| {
                let timestamp =
                    match NaiveDateTime::parse_from_str(&caps[2], "%d/%b/%Y:%H:%M:%S %z") {
                        Ok(t) => t,
                        Err(e) => {
                            eprintln!(
                                "Error parsing timestamp on line {}: '{}' - {}",
                                i + 1,
                                &caps[2],
                                e
                            );
                            NaiveDateTime::from_timestamp_opt(0, 0).unwrap()
                        }
                    };

                let referer = match caps[7].trim() {
                    "-" => None,
                    referer => Some(referer.to_string()),
                };

                LogEntry {
                    ip: caps[1].to_string(),
                    timestamp,
                    method: caps[3].to_string(),
                    path: caps[4].to_string(),
                    status: caps[5].parse().unwrap_or(0),
                    user_agent: caps[8].to_string(),
                    referer,
                    response_size: caps[6].parse().unwrap_or(0),
                }
            })
        })
        .collect()
}
