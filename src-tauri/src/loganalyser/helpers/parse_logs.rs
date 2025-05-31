use chrono::NaiveDateTime;
use ipnet::IpNet;
use once_cell::sync::Lazy;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::io::{self, Write};
use std::net::{AddrParseError, IpAddr};
use std::str::FromStr;
use std::sync::Mutex;
use tauri::{Emitter, Manager};

use super::google_ip_fetcher::get_google_ip_ranges;

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
    pub verified: bool,
    pub taxonomy: String,
}

/// Custom error type for IP verification
#[derive(Debug)]
pub enum IpVerificationError {
    InvalidIp(AddrParseError),
    InvalidCidr(ipnet::PrefixLenError),
}

impl From<AddrParseError> for IpVerificationError {
    fn from(err: AddrParseError) -> Self {
        IpVerificationError::InvalidIp(err)
    }
}

impl From<ipnet::PrefixLenError> for IpVerificationError {
    fn from(err: ipnet::PrefixLenError) -> Self {
        IpVerificationError::InvalidCidr(err)
    }
}

// Use a static variable to cache taxonomies
static TAXONOMIES: Lazy<Mutex<Vec<String>>> = Lazy::new(|| Mutex::new(Vec::new()));
static LOG_NUMBER: Lazy<Mutex<i32>> = Lazy::new(|| Mutex::new(0));

// Tauri command to set taxonomies from frontend
#[tauri::command]
pub fn set_taxonomies(new_taxonomies: Vec<String>) -> Result<(), String> {
    let mut taxonomies = TAXONOMIES.lock().map_err(|e| e.to_string())?;
    *taxonomies = new_taxonomies;
    Ok(())
}

// Tauri command to get current taxonomies
#[tauri::command]
pub fn get_taxonomies() -> Vec<String> {
    let taxonomies = TAXONOMIES.lock().unwrap();
    taxonomies.clone()
}

// Filter the path to see if it matches any taxonomy
fn classify_taxonomy(path: &str) -> String {
    let taxonomies = TAXONOMIES.lock().unwrap();
    for taxonomy in taxonomies.iter() {
        if path.contains(taxonomy) {
            return taxonomy.clone();
        }
    }
    "other".to_string()
}

/// Google's verified crawler IP ranges (IPv4 and IPv6)
/// Updated as of 2024 - always check official sources for changes:
/// https://developers.google.com/search/docs/crawling-indexing/verifying-googlebot
static GOOGLE_IP_RANGES: Lazy<Mutex<Vec<String>>> = Lazy::new(|| Mutex::new(Vec::new()));

#[tauri::command]
pub async fn fetch_google_ip_ranges() -> Result<Vec<String>, String> {
    // If we already have the ranges cached, return them
    {
        let ranges = GOOGLE_IP_RANGES.lock().map_err(|e| e.to_string())?;
        if !ranges.is_empty() {
            return Ok(ranges.iter().map(|n| n.to_string()).collect());
        }
    }

    // Otherwise fetch them (this is where you'd implement your actual fetching logic)
    let fetched_ranges = get_google_ip_ranges().await.map_err(|e| e.to_string())?;

    // Store them in the global state
    {
        let mut ranges = GOOGLE_IP_RANGES.lock().map_err(|e| e.to_string())?;
        *ranges = fetched_ranges.clone();
    }

    Ok(fetched_ranges.iter().map(|n| n.to_string()).collect())
}

fn is_google_verified(ip: &str) -> Result<bool, IpVerificationError> {
    // Parse the input IP address
    let ip_addr = IpAddr::from_str(ip)?;

    // Get a lock on the Mutex to access the ranges
    let ranges = GOOGLE_IP_RANGES.lock().unwrap();

    // Check if the IP is within any of Google's verified CIDR ranges
    for cidr in ranges.iter() {
        let net = IpNet::from_str(cidr).map_err(|e| {
            eprintln!("Failed to parse CIDR {}: {}", cidr, e);
            IpVerificationError::InvalidCidr(ipnet::PrefixLenError)
        })?;

        if net.contains(&ip_addr) {
            return Ok(true);
        }
    }

    Ok(false)
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
        || lower.ends_with(".ico")
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
    } else if lower.ends_with(".html")
        || lower.ends_with(".htm")
        || lower.ends_with("/")
        || !lower.ends_with("/")
    {
        Some("HTML".to_string())
    } else if lower.ends_with(".zip")
        || lower.ends_with(".rar")
        || lower.ends_with(".tar")
        || lower.ends_with(".gz")
    {
        Some("Archive".to_string())
    } else if lower.ends_with(".woff") || lower.ends_with(".woff2") || lower.ends_with(".ttf") {
        Some("Font".to_string())
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
    Some("Other".to_string())
}

// Detect crawler type from user-agent
fn detect_bot(user_agent: &str) -> Option<String> {
    let lower = user_agent.to_lowercase();
    for keyword in [
        "crawler", "spider", "sistrix", "chat", "uptime", "google", "bot", "ads",
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

    println!("Log contains {} lines", log.lines().count());

    let mut entries = Vec::new();
    for (i, line) in log.lines().enumerate() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        // Print log file length
        //print!("\rParsing line {}...", i + 1);
        //io::stdout().flush().unwrap();

        if let Some(caps) = re.captures(line) {
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
            let browser = detect_browser(&user_agent).unwrap_or_default();
            let ip = caps[1].to_string();
            let verified = is_google_verified(&ip).unwrap_or(false); // Default to false on error

            entries.push(LogEntry {
                ip,
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
                verified,
                taxonomy: classify_taxonomy(&caps[4]),
            });
        }
    }

    println!();
    entries
}
