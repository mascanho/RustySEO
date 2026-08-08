use crate::domain_crawler::db_deep::db::{
    fetch_enabled_custom_search_rules, CustomSearchRule, SearchMode, SearchTarget,
};
use crate::domain_crawler::models::CustomSearchMatch;
use once_cell::sync::Lazy;
use regex::Regex;
use scraper::{Html, Selector};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use tokio::sync::OnceCell;

// Longest a captured value is allowed to be before truncation — mirrors the
// truncation convention LightCrawlResult::from_full already uses for
// titles/headings, so a match against e.g. a whole <body> can't bloat
// per-page payloads.
const MAX_MATCH_VALUE_LEN: usize = 300;

// Global cache for the currently-enabled custom search rules.
static CUSTOM_SEARCH_CACHE: OnceCell<Mutex<Option<Vec<CustomSearchRule>>>> = OnceCell::const_new();
// Timestamp (seconds since epoch) of the last DB fetch — throttles to once per 60s.
static LAST_CACHE_FETCH_SECS: AtomicU64 = AtomicU64::new(0);

static BODY_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("body").unwrap());

async fn get_custom_search() -> &'static Mutex<Option<Vec<CustomSearchRule>>> {
    CUSTOM_SEARCH_CACHE
        .get_or_init(|| async {
            Mutex::new(None) // Initialize the cache as None
        })
        .await
}

async fn fetch_and_update_cache() -> Result<(), String> {
    // Fetch new data from the database (outside the Mutex lock)
    let new_data = fetch_enabled_custom_search_rules()
        .await
        .map_err(|e| e.to_string())?;

    // Acquire the Mutex lock
    let cache = get_custom_search().await;
    let mut cache_lock = cache.lock().unwrap();

    // Compare new data with cached data
    if let Some(cached_data) = &*cache_lock {
        if *cached_data == new_data {
            return Ok(());
        }
    }

    // Update the cache with new data
    *cache_lock = Some(new_data);
    Ok(())
}

pub async fn update_cache() -> Result<(), String> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let last = LAST_CACHE_FETCH_SECS.load(Ordering::Relaxed);
    // Only hit the DB at most once every 60 seconds across all concurrent tasks.
    if now.saturating_sub(last) < 60 {
        return Ok(());
    }
    // CAS to ensure only one concurrent task triggers the fetch.
    if LAST_CACHE_FETCH_SECS
        .compare_exchange(last, now, Ordering::Relaxed, Ordering::Relaxed)
        .is_err()
    {
        return Ok(());
    }
    fetch_and_update_cache().await
}

fn truncate_value(value: String) -> String {
    if value.len() <= MAX_MATCH_VALUE_LEN {
        return value;
    }
    let end = value
        .char_indices()
        .map(|(i, _)| i)
        .take_while(|&i| i <= MAX_MATCH_VALUE_LEN)
        .last()
        .unwrap_or(0);
    let mut truncated = value[..end].to_string();
    truncated.push_str("...");
    truncated
}

/// Extracts the page's visible text the same way helpers::text_ratio does —
/// used as the subject for regex matching (visible text only, never raw
/// HTML; see extraction plan for why).
fn get_visible_text(document: &Html) -> String {
    document
        .select(&BODY_SELECTOR)
        .next()
        .map(|body| body.text().collect::<Vec<_>>().join(" "))
        .unwrap_or_default()
}

fn evaluate_css_rule(rule: &CustomSearchRule, document: &Html) -> CustomSearchMatch {
    let base = CustomSearchMatch {
        rule_id: rule.id,
        rule_name: rule.name.clone(),
        matched: false,
        value: None,
    };

    let selector = match Selector::parse(&rule.pattern) {
        Ok(s) => s,
        Err(_) => return base,
    };

    let element = match document.select(&selector).next() {
        Some(el) => el,
        None => return base,
    };

    let extracted: Option<String> = match rule.target {
        SearchTarget::Text => Some(element.text().collect::<String>()),
        SearchTarget::Html => Some(element.html()),
        SearchTarget::Attribute => rule
            .attribute_name
            .as_deref()
            .and_then(|attr| element.value().attr(attr))
            .map(|s| s.to_string()),
    };

    let Some(extracted) = extracted else {
        return base;
    };

    let matched = match rule.search_text.as_deref() {
        Some(needle) if !needle.is_empty() => extracted.contains(needle),
        _ => true, // no search text configured — presence of the element/attribute is the match
    };

    CustomSearchMatch {
        matched,
        value: Some(truncate_value(extracted)),
        ..base
    }
}

fn evaluate_regex_rule(rule: &CustomSearchRule, document: &Html) -> CustomSearchMatch {
    let base = CustomSearchMatch {
        rule_id: rule.id,
        rule_name: rule.name.clone(),
        matched: false,
        value: None,
    };

    let regex = match Regex::new(&rule.pattern) {
        Ok(r) => r,
        Err(_) => return base,
    };

    let text = get_visible_text(document);
    let Some(captures) = regex.captures(&text) else {
        return base;
    };

    // Prefer the first capture group if the pattern has one, else the whole match.
    let matched_str = captures
        .get(1)
        .or_else(|| captures.get(0))
        .map(|m| m.as_str().to_string());

    CustomSearchMatch {
        matched: true,
        value: matched_str.map(truncate_value),
        ..base
    }
}

fn evaluate_rule(rule: &CustomSearchRule, document: &Html) -> CustomSearchMatch {
    match rule.mode {
        SearchMode::Css => evaluate_css_rule(rule, document),
        SearchMode::Regex => evaluate_regex_rule(rule, document),
    }
}

/// Evaluates every enabled custom search rule against a page. Returns one
/// CustomSearchMatch per enabled rule (matched or not) so the frontend can
/// always show the full rule set's status per page, not just the hits.
pub fn perform_extraction(document: &Html) -> Vec<CustomSearchMatch> {
    let cache = match CUSTOM_SEARCH_CACHE.get() {
        Some(c) => c,
        None => return Vec::new(),
    };

    let cache_lock = cache.lock().unwrap();
    let rules = match &*cache_lock {
        Some(data) => data,
        None => return Vec::new(),
    };

    rules.iter().map(|rule| evaluate_rule(rule, document)).collect()
}
