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
    pub browser: String,
    pub file_type: String,
}

fn detect_file_type(path: &str) -> Option<String> {
    let lower = path.to_lowercase();

    if lower.ends_with(".jpg")
        || lower.ends_with(".svg")
        || lower.ends_with(".jpeg")
        || lower.ends_with(".png")
        || lower.ends_with(".gif")
        || lower.ends_with(".bmp")
        || lower.ends_with(".webp")
    {
        Some("Image".to_string())
    } else if lower.ends_with(".mp4")
        || lower.ends_with(".mov")
        || lower.ends_with(".avi")
        || lower.ends_with(".mkv")
    {
        Some("Video".to_string())
    } else if lower.ends_with(".mp3")
        || lower.ends_with(".wav")
        || lower.ends_with(".flac")
        || lower.ends_with(".aac")
    {
        Some("Audio".to_string())
    } else if lower.ends_with(".php") {
        Some("PHP".to_string())
    } else if lower.ends_with(".txt") {
        Some("TXT".to_string())
    } else if lower.ends_with(".css") {
        Some("CSS".to_string())
    } else if lower.ends_with(".js") {
        Some("JS".to_string())
    } else if lower.ends_with(".pdf") {
        Some("Document".to_string())
    } else if lower.ends_with(".html") || lower.ends_with(".htm") || lower.ends_with("/") {
        Some("HTML".to_string())
    } else if lower.ends_with(".zip")
        || lower.ends_with(".rar")
        || lower.ends_with(".tar")
        || lower.ends_with(".gz")
    {
        Some("Archive".to_string())
    } else if lower.ends_with(".wolf") || lower.ends_with(".wolf2") || lower.ends_with(".ttf") {
} else {
        None
    }
}

fn detect_browser(user_agent: &str) -> Option<String> {
    let lower = user_agent.to_lowercase();
    for keyword in ["chrome", "firefox", "safari", "edge", "opera"] {
        if let Some(pos) = lower.find(keyword) {
            let start = lower[..pos]
                .rfind(|c: char| !c.is_alphanumeric() && c != '/')
                .map_or(0, |p| p + 1);
            let end = lower[pos..]
                .find(|c: char| c == ' ' || c == ';' || c == ')' || c == '"')
                .map_or(user_agent.len(), |p| pos + p);
            return Some(user_agent[start..end].to_string());
        }
    }
    Some("Bot".to_string())
}

// Detect crawler type from user-agent
fn detect_bot(user_agent: &str) -> Option<String> {
    let lower = user_agent.to_lowercase();
    for keyword in [
        "crawler", "spider", "sistrix", "chat", "uptime", "google", "bot",
    ] {
        if let Some(pos) = lower.find(keyword) {
            let start = lower[..pos]
                .rfind(|c: char| !c.is_alphanumeric() && c != '/')
                .map_or(0, |p| p + 1);
            let end = lower[pos..]
                .find(|c: char| c == ' ' || c == ';' || c == ')' || c == '"')
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
                    ref r => Some(r.to_string()),
                };

                let user_agent = caps[8].to_string();
                let crawler_type = detect_bot(&user_agent).unwrap_or_default();
                let browser = detect_browser(&user_agent).unwrap_or_default();

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
                    browser,
                    file_type: detect_file_type(&caps[4]).unwrap_or_default(),
                }
            })
        })
        .collect()
}

fn parse_user_agent(user_agent: &str) -> Option<String> {
    let string = Some("*".to_string());
    string
}
