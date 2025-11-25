use chrono::NaiveDateTime;
use ipnet::IpNet;
use once_cell::sync::Lazy;
use regex::Regex;
use reqwest;
use serde::{Deserialize, Serialize};
use std::io::{self, Write};
use std::net::{AddrParseError, IpAddr};
use std::str::FromStr;
use std::sync::Mutex;
use tauri::{Emitter, Manager};

use super::google_ip_fetcher::get_google_ip_ranges;

#[derive(Debug, Deserialize, Clone)]
pub struct BingBotRanges {
    #[serde(rename = "creationTime")]
    pub creation_time: String,
    pub prefixes: Vec<BingPrefix>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct BingPrefix {
    #[serde(rename = "ipv4Prefix")]
    pub ipv4_prefix: Option<String>,
    #[serde(rename = "ipv6Prefix")]
    pub ipv6_prefix: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct OpenAIBotRanges {
    #[serde(rename = "creationTime")]
    pub creation_time: String,
    pub prefixes: Vec<OpenAIPrefix>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct OpenAIPrefix {
    #[serde(rename = "ipv4Prefix")]
    pub ipv4_prefix: Option<String>,
    #[serde(rename = "ipv6Prefix")]
    pub ipv6_prefix: Option<String>,
}

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
    ReqwestError(reqwest::Error),
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

impl From<reqwest::Error> for IpVerificationError {
    fn from(err: reqwest::Error) -> Self {
        IpVerificationError::ReqwestError(err)
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TaxonomyInfo {
    path: String,
    match_type: String,
}

// Use a static variable to cache taxonomies
static TAXONOMIES: Lazy<Mutex<Vec<TaxonomyInfo>>> = Lazy::new(|| Mutex::new(Vec::new()));
static LOG_NUMBER: Lazy<Mutex<i32>> = Lazy::new(|| Mutex::new(0));

// Tauri command to set taxonomies from frontend
#[tauri::command]
pub fn set_taxonomies(new_taxonomies: Vec<TaxonomyInfo>) -> Result<(), String> {
    let mut taxonomies = TAXONOMIES.lock().map_err(|e| e.to_string())?;
    *taxonomies = new_taxonomies;
    Ok(())
}

// Tauri command to get current taxonomies
#[tauri::command]
pub fn get_taxonomies() -> Vec<TaxonomyInfo> {
    let taxonomies = TAXONOMIES.lock().unwrap();
    taxonomies.clone()
}

// Filter the path to see if it matches any taxonomy
fn classify_taxonomy(path: &str) -> String {
    let taxonomies = TAXONOMIES.lock().unwrap();
    let mut sorted_taxonomies = taxonomies.clone();
    sorted_taxonomies.sort_by(|a, b| b.path.len().cmp(&a.path.len())); // Sort by length descending

    for taxonomy in sorted_taxonomies.iter() {
        let matches = match taxonomy.match_type.as_str() {
            "startsWith" => path.starts_with(&taxonomy.path),
            "contains" => path.contains(&taxonomy.path),
            _ => path.starts_with(&taxonomy.path), // Default to startsWith
        };

        if matches {
            return taxonomy.path.clone();
        }
    }
    "other".to_string()
}

/// Google's verified crawler IP ranges (IPv4 and IPv6)
static GOOGLE_IP_RANGES: Lazy<Mutex<Vec<String>>> = Lazy::new(|| Mutex::new(Vec::new()));

#[tauri::command]
pub async fn fetch_google_ip_ranges() -> Result<Vec<String>, String> {
    {
        let ranges = GOOGLE_IP_RANGES.lock().map_err(|e| e.to_string())?;
        if !ranges.is_empty() {
            return Ok(ranges.clone());
        }
    }

    let fetched_ranges = get_google_ip_ranges().await.map_err(|e| e.to_string())?;

    {
        let mut ranges = GOOGLE_IP_RANGES.lock().map_err(|e| e.to_string())?;
        *ranges = fetched_ranges.clone();
    }

    Ok(fetched_ranges)
}

fn is_google_verified(ip: &str) -> Result<bool, IpVerificationError> {
    let ip_addr = IpAddr::from_str(ip)?;
    let ranges = GOOGLE_IP_RANGES.lock().unwrap();

    for cidr in ranges.iter() {
        let net = IpNet::from_str(cidr)
            .map_err(|_| IpVerificationError::InvalidCidr(ipnet::PrefixLenError))?;
        if net.contains(&ip_addr) {
            return Ok(true);
        }
    }

    Ok(false)
}

// Store the actual Bing ranges, not just strings
static BING_IP_RANGES: Lazy<Mutex<Vec<IpNet>>> = Lazy::new(|| Mutex::new(Vec::new()));

/// Fetches the latest Bingbot IP ranges from the official endpoint
#[tauri::command]
pub async fn fetch_bingbot_ranges() -> Result<Vec<String>, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get("https://www.bing.com/toolbox/bingbot.json")
        .header("User-Agent", "RustySEO-Bot-Verifier/1.0")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let bing_ranges = response
        .json::<BingBotRanges>()
        .await
        .map_err(|e| e.to_string())?;

    // Parse and store the IP networks
    let mut networks = Vec::new();
    let mut range_strings = Vec::new();

    for prefix in &bing_ranges.prefixes {
        if let Some(ipv4_prefix) = &prefix.ipv4_prefix {
            if let Ok(net) = IpNet::from_str(ipv4_prefix) {
                networks.push(net);
                range_strings.push(ipv4_prefix.clone());
            }
        }
        if let Some(ipv6_prefix) = &prefix.ipv6_prefix {
            if let Ok(net) = IpNet::from_str(ipv6_prefix) {
                networks.push(net);
                range_strings.push(ipv6_prefix.clone());
            }
        }
    }

    // Store the parsed networks
    {
        let mut ranges = BING_IP_RANGES.lock().unwrap();
        *ranges = networks;
    }

    println!("Loaded {} Bingbot IP ranges", range_strings.len());
    Ok(range_strings)
}

/// Check if an IP is verified as Bingbot
fn is_bing_verified(ip: &str) -> Result<bool, IpVerificationError> {
    let ip_addr = IpAddr::from_str(ip)?;
    let ranges = BING_IP_RANGES.lock().unwrap();

    for net in ranges.iter() {
        if net.contains(&ip_addr) {
            return Ok(true);
        }
    }

    Ok(false)
}

// Store the actual OpenAI ranges
static OPENAI_IP_RANGES: Lazy<Mutex<Vec<IpNet>>> = Lazy::new(|| Mutex::new(Vec::new()));

/// Fetches the latest OpenAI Searchbot IP ranges from the official endpoint
#[tauri::command]
pub async fn fetch_openai_ranges() -> Result<Vec<String>, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get("https://openai.com/searchbot.json")
        .header("User-Agent", "RustySEO-Bot-Verifier/1.0")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let openai_ranges = response
        .json::<OpenAIBotRanges>()
        .await
        .map_err(|e| e.to_string())?;

    // Parse and store the IP networks
    let mut networks = Vec::new();
    let mut range_strings = Vec::new();

    for prefix in &openai_ranges.prefixes {
        if let Some(ipv4_prefix) = &prefix.ipv4_prefix {
            if let Ok(net) = IpNet::from_str(ipv4_prefix) {
                networks.push(net);
                range_strings.push(ipv4_prefix.clone());
            }
        }
        if let Some(ipv6_prefix) = &prefix.ipv6_prefix {
            if let Ok(net) = IpNet::from_str(ipv6_prefix) {
                networks.push(net);
                range_strings.push(ipv6_prefix.clone());
            }
        }
    }

    // Store the parsed networks
    {
        let mut ranges = OPENAI_IP_RANGES.lock().unwrap();
        *ranges = networks;
    }

    println!("Loaded {} OpenAI Searchbot IP ranges", range_strings.len());
    Ok(range_strings)
}

/// Check if an IP is verified as OpenAI Searchbot
fn is_openai_verified(ip: &str) -> Result<bool, IpVerificationError> {
    let ip_addr = IpAddr::from_str(ip)?;
    let ranges = OPENAI_IP_RANGES.lock().unwrap();

    for net in ranges.iter() {
        if net.contains(&ip_addr) {
            return Ok(true);
        }
    }

    Ok(false)
}

/// Check if an IP is from any verified search engine
fn is_verified_crawler(ip: &str, crawler_type: &str) -> bool {
    let crawler_lower = crawler_type.to_lowercase();

    if crawler_lower.contains("google") {
        is_google_verified(ip).unwrap_or(false)
    } else if crawler_lower.contains("bing") {
        is_bing_verified(ip).unwrap_or(false)
    } else if crawler_lower.contains("openai") || crawler_lower.contains("chatgpt") {
        is_openai_verified(ip).unwrap_or(false)
    } else {
        false
    }
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
        || !lower.contains('.')
    // Assume paths without extensions are HTML
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

    // Check for specific bots first
    // // START WITH GOOGLE BOTS
    if lower.contains("googlebot/") {
        return Some("Google Bot".to_string());
    } else if lower.contains("adsbot-google") {
        return Some("Google AdsBot".to_string());
    } else if lower.contains("mediapartners-google") {
        return Some("Google MediaPartners".to_string());
    } else if lower.contains("googleweblight") {
        return Some("Google WebLight".to_string());
    } else if lower.contains("googlebot-image") {
        return Some("Google Img Bot".to_string());
    } else if lower.contains("googlebot-video") {
        return Some("Google video Bot".to_string());
    } else if lower.contains("googlebot-news") {
        return Some("Google News Bot".to_string());
    } else if lower.contains("storebot-google") {
        return Some("Google StoreBot".to_string());
    } else if lower.contains("google-inspectiontool") {
        return Some("Google Inspection Tool".to_string());
    } else if lower.contains("googleother") {
        return Some("Google Other".to_string());
    } else if lower.contains("googleother-image") {
        return Some("Google Other Image".to_string());
    } else if lower.contains("googleother-video") {
        return Some("Google Other Video".to_string());
    } else if lower.contains("google-clouvertexbot") {
        return Some("Google Cloud Vertex Bot".to_string());
    } else if lower.contains("google-extended") {
        return Some("Google Extended".to_string());
    } else if lower.contains("bingbot") {
        return Some("Bing".to_string());
    } else if lower.contains("openai") || lower.contains("chatgpt") {
        return Some("OpenAI".to_string());
    } else if lower.contains("semrush") {
        return Some("Semrush".to_string());
    } else if lower.contains("ahrefs") {
        return Some("Ahrefs".to_string());
    } else if lower.contains("moz.com") {
        return Some("Moz".to_string());
    } else if lower.contains("rocket") {
        return Some("WP Rocket".to_string());
    }
    // Generic bot detection
    for keyword in [
        "crawler", "spider", "sistrix", "chat", "uptime", "bot", "google", "rocket ",
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
                    continue; // Skip this entry instead of using a default timestamp
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

            // Use the new unified verification function
            let verified = is_verified_crawler(&ip, &crawler_type);

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
                file_type: detect_file_type(&caps[4]).unwrap_or_else(|| "Unknown".to_string()),
                verified,
                taxonomy: classify_taxonomy(&caps[4]),
            });
        }
    }

    println!("Parsed {} valid log entries", entries.len());
    entries
}

// Tauri command to fetch all bot IP ranges at once
#[tauri::command]
pub async fn fetch_all_bot_ranges() -> Result<Vec<String>, String> {
    let mut results = Vec::new();

    // Fetch Google ranges
    match fetch_google_ip_ranges().await {
        Ok(ranges) => results.push(format!("Google: {} ranges loaded", ranges.len())),
        Err(e) => results.push(format!("Google: Failed - {}", e)),
    }

    // Fetch Bing ranges
    match fetch_bingbot_ranges().await {
        Ok(ranges) => results.push(format!("Bing: {} ranges loaded", ranges.len())),
        Err(e) => results.push(format!("Bing: Failed - {}", e)),
    }

    // Fetch OpenAI ranges
    match fetch_openai_ranges().await {
        Ok(ranges) => results.push(format!("OpenAI: {} ranges loaded", ranges.len())),
        Err(e) => results.push(format!("OpenAI: Failed - {}", e)),
    }

    Ok(results)
}
