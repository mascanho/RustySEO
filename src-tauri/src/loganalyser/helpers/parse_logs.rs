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
    pub referer: Option<String>,
    pub response_size: u64,
    pub crawler_type: String,
}

// Detect crawler type from user-agent
fn detect_bot(user_agent: &str) -> Option<String> {
    let lower = user_agent.to_lowercase();
    for keyword in ["bot", "crawler", "spider"] {
        if let Some(pos) = lower.find(keyword) {
            let start = lower[..pos].rfind(|c: char| !c.is_alphanumeric() && c != '/')
                .map_or(0, |p| p + 1);
            let end = lower[pos..].find(|c: char| c == ' ' || c == ';' || c == ')' || c == '"')
                .map_or(user_agent.len(), |p| pos + p);
            return Some(user_agent[start..end].to_string());
        }
    }
    Some("Human".to_string())
}

pub fn parse_log_entries(log: &str) -> Vec<LogEntry> {
    let re = Regex::new(r#"(?x)
        ^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+                              # IP and timestamp
        "(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH)\s+([^?"]+)(?:\?[^"]*)?\s+HTTP/[0-9.]+"\s+  # Method and path
        (\d{3})\s+(\d+)\s+                                                # Status and response size
        "([^"]*)"\s+                                                      # Referer
        "([^"]*)"                                                         # User agent
    "#).expect("Invalid regex pattern");

    log.lines()
        .enumerate()
        .filter_map(|(i, line)| {
            let line = line.trim();
            if line.is_empty() {
                return None;
            }

            re.captures(line).map(|caps| {
                let timestamp = match NaiveDateTime::parse_from_str(&caps[2], "%d/%b/%Y:%H:%M:%S %z") {
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
                    ref r => Some(r.to_string()),
                };

                let user_agent = caps[8].to_string();
                let crawler_type = detect_bot(&user_agent).unwrap_or_default();

                LogEntry {
                    ip: caps[1].to_string(),
                    timestamp,
                    method: caps[3].to_string(),
                    path: caps[4].to_string(),
                    status: caps[5].parse().unwrap_or(0),
                    user_agent,
                    referer,
                    response_size: caps[6].parse().unwrap_or(0),
                    crawler_type,
                }
            })
        })
        .collect()
}

fn parse_user_agent(user_agent: &str) -> Option<String> {

 let string =   Some("*".to_string());
    string
}