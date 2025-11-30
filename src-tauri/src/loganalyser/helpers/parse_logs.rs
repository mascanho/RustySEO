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

use crate::loganalyser::helpers::modeling::{
    BingBotRanges, IpVerificationError, LogEntry, OpenAIBotRanges, TaxonomyInfo,
};

use super::google_ip_fetcher::get_google_ip_ranges;

// Use a static variable to cache taxonomies
static TAXONOMIES: Lazy<Mutex<Vec<TaxonomyInfo>>> = Lazy::new(|| Mutex::new(Vec::new()));
static LOG_NUMBER: Lazy<Mutex<i32>> = Lazy::new(|| Mutex::new(0));

// Tauri command to set taxonomies from frontend
#[tauri::command]
pub fn set_taxonomies(new_taxonomies: Vec<TaxonomyInfo>) -> Result<(), String> {
    let mut taxonomies = TAXONOMIES.lock().map_err(|e| e.to_string())?;
    *taxonomies = new_taxonomies;
    println!("Taxonomies: {:#?}", taxonomies);
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
            "exactMatch" => path == taxonomy.path, // New exactMatch case
            _ => path.starts_with(&taxonomy.path), // Default to startsWith
        };

        if matches {
            return taxonomy.path.clone();
        }
    }
    "other".to_string()
}

/// Classify the segment of the path based on taxonomy configuration
fn classify_segment_name(path: &str) -> String {
    let taxonomies = TAXONOMIES.lock().unwrap();
    let mut sorted_taxonomies = taxonomies.clone();
    sorted_taxonomies.sort_by(|a, b| b.path.len().cmp(&a.path.len())); // Sort by length descending

    for taxonomy in sorted_taxonomies.iter() {
        let matches = match taxonomy.match_type.as_str() {
            "startsWith" => path.starts_with(&taxonomy.path),
            "contains" => path.contains(&taxonomy.path),
            "exactMatch" => path == taxonomy.path,
            _ => path.starts_with(&taxonomy.path), // Default to startsWith
        };

        if matches {
            // Return the taxonomy name instead of the path
            // Assuming TaxonomyInfo has a 'name' field based on your frontend data
            return taxonomy.name.clone(); // This should return "Blogs", "Industries", etc.
        }
    }
    "Other".to_string() // Default to "Other" when no taxonomy matches
}

/// Get the match type of the segment based on taxonomy configuration
fn classify_segment_match(path: &str) -> Option<String> {
    let taxonomies = TAXONOMIES.lock().unwrap();
    let mut sorted_taxonomies = taxonomies.clone();
    sorted_taxonomies.sort_by(|a, b| b.path.len().cmp(&a.path.len())); // Sort by length descending

    for taxonomy in sorted_taxonomies.iter() {
        let matches = match taxonomy.match_type.as_str() {
            "startsWith" => path.starts_with(&taxonomy.path),
            "contains" => path.contains(&taxonomy.path),
            "exactMatch" => path == taxonomy.path,
            _ => path.starts_with(&taxonomy.path), // Default to startsWith
        };

        if matches {
            return Some(taxonomy.match_type.clone());
        }
    }
    None
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

// Store the actual OpenAI ranges for DIFFERENT bot types
static OPENAI_SEARCHBOT_RANGES: Lazy<Mutex<Vec<IpNet>>> = Lazy::new(|| Mutex::new(Vec::new()));
static OPENAI_CHATGPT_USER_RANGES: Lazy<Mutex<Vec<IpNet>>> = Lazy::new(|| Mutex::new(Vec::new()));
static OPENAI_GPTBOT_RANGES: Lazy<Mutex<Vec<IpNet>>> = Lazy::new(|| Mutex::new(Vec::new()));

/// Fetches the latest OpenAI Searchbot IP ranges from the official endpoint
#[tauri::command]
pub async fn fetch_openai_searchbot_ranges() -> Result<Vec<String>, String> {
    fetch_openai_ranges_internal(
        "https://openai.com/searchbot.json",
        &OPENAI_SEARCHBOT_RANGES,
        "SearchBot",
    )
    .await
}

/// Fetches the latest ChatGPT-User IP ranges
#[tauri::command]
pub async fn fetch_openai_chatgpt_user_ranges() -> Result<Vec<String>, String> {
    fetch_openai_ranges_internal(
        "https://openai.com/chatgpt-user.json",
        &OPENAI_CHATGPT_USER_RANGES,
        "ChatGPT-User",
    )
    .await
}

/// Fetches the latest GPTBot IP ranges
#[tauri::command]
pub async fn fetch_openai_gptbot_ranges() -> Result<Vec<String>, String> {
    fetch_openai_ranges_internal(
        "https://openai.com/gptbot.json",
        &OPENAI_GPTBOT_RANGES,
        "GPTBot",
    )
    .await
}

// Internal helper function for fetching OpenAI ranges
async fn fetch_openai_ranges_internal(
    url: &str,
    storage: &Lazy<Mutex<Vec<IpNet>>>,
    bot_type: &str,
) -> Result<Vec<String>, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(url)
        .header("User-Agent", "RustySEO-Bot-Verifier/1.0")
        .send()
        .await
        .map_err(|e| {
            println!("DEBUG: {} fetch failed: {}", bot_type, e);
            e.to_string()
        })?;

    println!(
        "DEBUG: {} fetch response status: {}",
        bot_type,
        response.status()
    );

    let openai_ranges = response.json::<OpenAIBotRanges>().await.map_err(|e| {
        println!("DEBUG: {} JSON parse failed: {}", bot_type, e);
        e.to_string()
    })?;

    // Parse and store the IP networks
    let mut networks = Vec::new();
    let mut range_strings = Vec::new();

    for prefix in &openai_ranges.prefixes {
        if let Some(ipv4_prefix) = &prefix.ipv4_prefix {
            if let Ok(net) = IpNet::from_str(ipv4_prefix) {
                networks.push(net);
                range_strings.push(ipv4_prefix.clone());
                println!("DEBUG: Added {} IPv4 range: {}", bot_type, ipv4_prefix);
            } else {
                println!(
                    "DEBUG: Failed to parse {} IPv4 range: {}",
                    bot_type, ipv4_prefix
                );
            }
        }
        if let Some(ipv6_prefix) = &prefix.ipv6_prefix {
            if let Ok(net) = IpNet::from_str(ipv6_prefix) {
                networks.push(net);
                range_strings.push(ipv6_prefix.clone());
                println!("DEBUG: Added {} IPv6 range: {}", bot_type, ipv6_prefix);
            } else {
                println!(
                    "DEBUG: Failed to parse {} IPv6 range: {}",
                    bot_type, ipv6_prefix
                );
            }
        }
    }

    // Store the parsed networks
    {
        let mut ranges = storage.lock().unwrap();
        *ranges = networks;
    }

    Ok(range_strings)
}

/// Check if an IP is verified as OpenAI Searchbot
fn is_openai_searchbot_verified(ip: &str) -> Result<bool, IpVerificationError> {
    verify_ip_against_ranges(ip, &OPENAI_SEARCHBOT_RANGES, "OpenAI SearchBot")
}

/// Check if an IP is verified as ChatGPT-User
fn is_openai_chatgpt_user_verified(ip: &str) -> Result<bool, IpVerificationError> {
    verify_ip_against_ranges(ip, &OPENAI_CHATGPT_USER_RANGES, "ChatGPT-User")
}

/// Check if an IP is verified as GPTBot
fn is_openai_gptbot_verified(ip: &str) -> Result<bool, IpVerificationError> {
    verify_ip_against_ranges(ip, &OPENAI_GPTBOT_RANGES, "GPTBot")
}

// Helper function for verification
fn verify_ip_against_ranges(
    ip: &str,
    storage: &Lazy<Mutex<Vec<IpNet>>>,
    bot_type: &str,
) -> Result<bool, IpVerificationError> {
    let ip_addr = IpAddr::from_str(ip)?;
    let ranges = storage.lock().unwrap();

    println!(
        "DEBUG: Checking IP {} against {} {} ranges",
        ip,
        ranges.len(),
        bot_type
    );

    if ranges.is_empty() {
        println!(
            "WARNING: {} IP ranges are empty! Call fetch function first.",
            bot_type
        );
        return Ok(false);
    }

    for net in ranges.iter() {
        if net.contains(&ip_addr) {
            println!("✓ VERIFIED: IP {} matches {} range {}", ip, bot_type, net);
            return Ok(true);
        }
    }

    println!(
        "✗ UNVERIFIED: IP {} not found in {} official ranges",
        ip, bot_type
    );
    Ok(false)
}

/// Check if an IP is from any verified search engine
fn is_verified_crawler(ip: &str, crawler_type: &str) -> bool {
    let crawler_lower = crawler_type.to_lowercase();

    println!(
        "DEBUG: Checking verification for IP: {}, Crawler: '{}'",
        ip, crawler_type
    );

    let result = if crawler_lower.contains("google") {
        is_google_verified(ip).unwrap_or(false)
    } else if crawler_lower.contains("bing") {
        is_bing_verified(ip).unwrap_or(false)
    } else if crawler_lower == "chatgpt-user" || crawler_lower.contains("chatgpt") {
        // Specifically check ChatGPT-User against its own ranges
        println!("DEBUG: Checking against ChatGPT-User ranges");
        is_openai_chatgpt_user_verified(ip).unwrap_or(false)
    } else if crawler_lower == "gptbot" {
        // Specifically check GPTBot against its own ranges
        println!("DEBUG: Checking against GPTBot ranges");
        is_openai_gptbot_verified(ip).unwrap_or(false)
    } else if crawler_lower.contains("openai") || crawler_lower.contains("oai-searchbot") {
        // Check OpenAI SearchBot
        println!("DEBUG: Checking against OpenAI SearchBot ranges");
        is_openai_searchbot_verified(ip).unwrap_or(false)
    } else {
        println!("DEBUG: Not a verifiable bot type");
        false
    };

    println!("DEBUG: Final verification result: {}", result);
    result
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
    // START WITH GOOGLE BOTS
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
        return Some("Google Insp. Tool".to_string());
    } else if lower.contains("googleother") {
        return Some("Google Other".to_string());
    } else if lower.contains("googleother-image") {
        return Some("Google Other Img".to_string());
    } else if lower.contains("googleother-video") {
        return Some("Google Other Video".to_string());
    } else if lower.contains("google-clouvertexbot") {
        return Some("Google Cloud Vertex".to_string());
    } else if lower.contains("google-extended") {
        return Some("Google Extended".to_string());
    } else if lower.contains("bingbot") {
        return Some("Bing".to_string());
    } else if lower.contains("googleimageproxy") {
        return Some("Goog. Img Proxy".to_string());
    } else if lower.contains("gptbot") {
        return Some("GPTBot".to_string());
    } else if lower.contains("chatgpt") {
        return Some("ChatGPT-User".to_string());
    } else if lower.contains("semrush") {
        return Some("Semrush".to_string());
    } else if lower.contains("ahrefs") {
        return Some("Ahrefs".to_string());
    } else if lower.contains("moz.com") {
        return Some("Moz".to_string());
    } else if lower.contains("rocket") {
        return Some("WP Rocket".to_string());
    } else if lower.contains("dompdf") {
        return Some("DomPdf bot".to_string());
    } else if lower.contains("wordpress") {
        return Some("Wordpress Bot".to_string());
    } else if lower.contains("meta-") {
        return Some("Meta Bot".to_string());
    } else if lower.contains("dalvik") {
        return Some("Human".to_string());
    } else if lower == "-" {
        return Some("Unknown Bot".to_string());
    } else if lower == "" {
        return Some("No User Agent".to_string());
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
            let path = &caps[4];

            // Use the new unified verification function
            let verified = is_verified_crawler(&ip, &crawler_type);

            entries.push(LogEntry {
                ip,
                timestamp,
                method: caps[3].to_string(),
                path: caps[4].to_string(),
                status: caps[5].parse().unwrap_or(0),
                user_agent,
                country: None,
                referer,
                response_size: caps[6].parse().unwrap_or(0),
                crawler_type,
                browser,
                file_type: detect_file_type(&caps[4]).unwrap_or_else(|| "Unknown".to_string()),
                verified,
                segment: classify_segment_name(path),
                segment_match: classify_segment_match(path),
                taxonomy: classify_taxonomy(path),
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

    // Fetch ALL OpenAI ranges
    match fetch_openai_searchbot_ranges().await {
        Ok(ranges) => results.push(format!("OpenAI SearchBot: {} ranges loaded", ranges.len())),
        Err(e) => results.push(format!("OpenAI SearchBot: Failed - {}", e)),
    }

    match fetch_openai_chatgpt_user_ranges().await {
        Ok(ranges) => results.push(format!("ChatGPT-User: {} ranges loaded", ranges.len())),
        Err(e) => results.push(format!("ChatGPT-User: Failed - {}", e)),
    }

    match fetch_openai_gptbot_ranges().await {
        Ok(ranges) => results.push(format!("GPTBot: {} ranges loaded", ranges.len())),
        Err(e) => results.push(format!("GPTBot: Failed - {}", e)),
    }

    Ok(results)
}

// Debug command to check OpenAI ranges
#[tauri::command]
pub fn debug_all_openai_ranges() -> Vec<String> {
    let mut result = Vec::new();

    let searchbot_ranges = OPENAI_SEARCHBOT_RANGES.lock().unwrap();
    let chatgpt_ranges = OPENAI_CHATGPT_USER_RANGES.lock().unwrap();
    let gptbot_ranges = OPENAI_GPTBOT_RANGES.lock().unwrap();

    result.push(format!(
        "OpenAI SearchBot ranges: {}",
        searchbot_ranges.len()
    ));
    result.push(format!("ChatGPT-User ranges: {}", chatgpt_ranges.len()));
    result.push(format!("GPTBot ranges: {}", gptbot_ranges.len()));

    // Show first few ranges of each
    for (i, net) in searchbot_ranges.iter().enumerate().take(3) {
        result.push(format!("SearchBot {}: {}", i, net));
    }

    for (i, net) in chatgpt_ranges.iter().enumerate().take(3) {
        result.push(format!("ChatGPT-User {}: {}", i, net));
    }

    for (i, net) in gptbot_ranges.iter().enumerate().take(3) {
        result.push(format!("GPTBot {}: {}", i, net));
    }

    result
}

// Command to verify specific IP against all OpenAI bot types
#[tauri::command]
pub fn verify_openai_ip(ip: String) -> Vec<String> {
    let mut result = Vec::new();

    result.push(format!("Verifying IP: {}", ip));

    let searchbot_verified = is_openai_searchbot_verified(&ip).unwrap_or(false);
    let chatgpt_verified = is_openai_chatgpt_user_verified(&ip).unwrap_or(false);
    let gptbot_verified = is_openai_gptbot_verified(&ip).unwrap_or(false);

    result.push(format!(
        "OpenAI SearchBot: {}",
        if searchbot_verified {
            "✓ VERIFIED"
        } else {
            "✗ UNVERIFIED"
        }
    ));
    result.push(format!(
        "ChatGPT-User: {}",
        if chatgpt_verified {
            "✓ VERIFIED"
        } else {
            "✗ UNVERIFIED"
        }
    ));
    result.push(format!(
        "GPTBot: {}",
        if gptbot_verified {
            "✓ VERIFIED"
        } else {
            "✗ UNVERIFIED"
        }
    ));

    if !searchbot_verified && !chatgpt_verified && !gptbot_verified {
        result.push("This IP is not in any OpenAI official ranges".to_string());
        result.push("This may be an impersonator using OpenAI user agents".to_string());
    }

    result
}

// Initialize all ranges at startup
#[tauri::command]
pub async fn initialize_all_ranges() -> Result<Vec<String>, String> {
    println!("=== INITIALIZING ALL BOT RANGES ===");
    fetch_all_bot_ranges().await
}
