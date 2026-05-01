use crate::loganalyser::analyser::LogEntry;
use directories::ProjectDirs;
use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

lazy_static::lazy_static! {
    pub static ref DB_CONN: Mutex<Option<Connection>> = Mutex::new(None);
}

pub fn init_active_db() -> Result<(), String> {
    let project_dirs = ProjectDirs::from("", "", "rustyseo")
        .ok_or_else(|| "Failed to get project directories".to_string())?;

    let db_dir = project_dirs.data_dir().join("db");
    if !db_dir.exists() {
        std::fs::create_dir_all(&db_dir).map_err(|e| e.to_string())?;
    }

    let db_path = db_dir.join("active_logs.db");
    let mut conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    // Migration: If active_path_aggregations exists but lacks 'segment' column, drop it.
    // SQLite WITHOUT ROWID tables cannot be easily altered.
    let table_exists: bool = conn.query_row(
        "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='active_path_aggregations'",
        [],
        |row| Ok(row.get::<_, i32>(0)? > 0),
    ).unwrap_or(false);

    if table_exists {
        let has_segment: bool = conn.query_row(
            "SELECT count(*) FROM pragma_table_info('active_path_aggregations') WHERE name='segment'",
            [],
            |row| Ok(row.get::<_, i32>(0)? > 0),
        ).unwrap_or(false);

        if !has_segment {
            println!("Migration: Dropping old active_path_aggregations table to add segment column.");
            conn.execute("DROP TABLE active_path_aggregations", []).map_err(|e| e.to_string())?;
        }
    }

    // Migration: If active_path_verified_aggregations exists but lacks 'crawler_type' column, drop it.
    let verified_table_exists: bool = conn.query_row(
        "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='active_path_verified_aggregations'",
        [],
        |row| Ok(row.get::<_, i32>(0)? > 0),
    ).unwrap_or(false);

    if verified_table_exists {
        let has_crawler_type: bool = conn.query_row(
            "SELECT count(*) FROM pragma_table_info('active_path_verified_aggregations') WHERE name='crawler_type'",
            [],
            |row| Ok(row.get::<_, i32>(0)? > 0),
        ).unwrap_or(false);

        if !has_crawler_type {
            println!("Migration: Dropping old active_path_verified_aggregations table to add crawler_type column.");
            conn.execute("DROP TABLE active_path_verified_aggregations", []).map_err(|e| e.to_string())?;
        }
    }

    conn.execute_batch(
        "
        PRAGMA synchronous = OFF;
        PRAGMA journal_mode = MEMORY;
        PRAGMA cache_size = 10000;

        CREATE TABLE IF NOT EXISTS active_parsed_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT,
            timestamp TEXT,
            method TEXT,
            path TEXT,
            position INTEGER,
            clicks INTEGER,
            ctr REAL,
            impressions INTEGER,
            gsc_url TEXT,
            status INTEGER,
            user_agent TEXT,
            referer TEXT,
            response_size INTEGER,
            country TEXT,
            crawler_type TEXT,
            is_crawler BOOLEAN,
            file_type TEXT,
            browser TEXT,
            verified BOOLEAN,
            segment TEXT,
            segment_match TEXT,
            taxonomy TEXT,
            filename TEXT
        );

        CREATE TABLE IF NOT EXISTS active_path_aggregations (
            path TEXT,
            crawler_type TEXT,
            segment TEXT,
            hit_count INTEGER DEFAULT 0,
            PRIMARY KEY (path, crawler_type, segment)
        ) WITHOUT ROWID;

        CREATE TABLE IF NOT EXISTS active_path_status_aggregations (
            path TEXT,
            status INTEGER,
            segment TEXT,
            hit_count INTEGER DEFAULT 0,
            PRIMARY KEY (path, status, segment)
        ) WITHOUT ROWID;

        CREATE TABLE IF NOT EXISTS active_path_method_aggregations (
            path TEXT,
            method TEXT,
            segment TEXT,
            hit_count INTEGER DEFAULT 0,
            PRIMARY KEY (path, method, segment)
        ) WITHOUT ROWID;

        CREATE TABLE IF NOT EXISTS active_path_user_agent_aggregations (
            path TEXT,
            user_agent TEXT,
            segment TEXT,
            hit_count INTEGER DEFAULT 0,
            PRIMARY KEY (path, user_agent, segment)
        ) WITHOUT ROWID;

        CREATE TABLE IF NOT EXISTS active_path_referer_aggregations (
            path TEXT,
            referer TEXT,
            segment TEXT,
            hit_count INTEGER DEFAULT 0,
            PRIMARY KEY (path, referer, segment)
        ) WITHOUT ROWID;

        CREATE TABLE IF NOT EXISTS active_path_browser_aggregations (
            path TEXT,
            browser TEXT,
            segment TEXT,
            hit_count INTEGER DEFAULT 0,
            PRIMARY KEY (path, browser, segment)
        ) WITHOUT ROWID;

        CREATE TABLE IF NOT EXISTS active_path_verified_aggregations (
            path TEXT,
            crawler_type TEXT,
            verified BOOLEAN,
            segment TEXT,
            hit_count INTEGER DEFAULT 0,
            PRIMARY KEY (path, crawler_type, verified, segment)
        ) WITHOUT ROWID;

        CREATE TABLE IF NOT EXISTS active_path_ip_aggregations (
            path TEXT,
            ip TEXT,
            segment TEXT,
            hit_count INTEGER DEFAULT 0,
            PRIMARY KEY (path, ip, segment)
        ) WITHOUT ROWID;

        CREATE INDEX IF NOT EXISTS idx_timestamp ON active_parsed_logs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_status ON active_parsed_logs(status);
        CREATE INDEX IF NOT EXISTS idx_crawler ON active_parsed_logs(is_crawler, crawler_type);
        CREATE INDEX IF NOT EXISTS idx_segment ON active_parsed_logs(segment);
        CREATE INDEX IF NOT EXISTS idx_file_type ON active_parsed_logs(file_type);
        CREATE INDEX IF NOT EXISTS idx_path_agg_count ON active_path_aggregations(hit_count DESC);
        CREATE INDEX IF NOT EXISTS idx_path_status_agg_count ON active_path_status_aggregations(hit_count DESC);
        CREATE INDEX IF NOT EXISTS idx_path_method_agg_count ON active_path_method_aggregations(hit_count DESC);
        CREATE INDEX IF NOT EXISTS idx_path_user_agent_agg_count ON active_path_user_agent_aggregations(hit_count DESC);
        CREATE INDEX IF NOT EXISTS idx_path_referer_agg_count ON active_path_referer_aggregations(hit_count DESC);
        CREATE INDEX IF NOT EXISTS idx_path_browser_agg_count ON active_path_browser_aggregations(hit_count DESC);
        CREATE INDEX IF NOT EXISTS idx_path_verified_agg_count ON active_path_verified_aggregations(hit_count DESC);
        CREATE INDEX IF NOT EXISTS idx_path_ip_agg_count ON active_path_ip_aggregations(hit_count DESC);
        ",
    )
    .map_err(|e| e.to_string())?;

    let mut lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    *lock = Some(conn);
    Ok(())
}

#[derive(Serialize, Deserialize, Default)]
pub struct TrendTotalsSummary {
    pub status_count: usize,
    pub status_hits: usize,
    pub method_count: usize,
    pub method_hits: usize,
    pub user_agent_count: usize,
    pub user_agent_hits: usize,
    pub referer_count: usize,
    pub referer_hits: usize,
    pub browser_count: usize,
    pub browser_hits: usize,
    pub verified_count: usize,
    pub verified_hits: usize,
    pub ip_count: usize,
    pub ip_hits: usize,
    pub path_count: usize,
    pub path_hits: usize,
}

#[tauri::command]
pub fn get_trend_totals_summary() -> Result<TrendTotalsSummary, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let mut summary = TrendTotalsSummary::default();

    summary.status_count = conn.query_row("SELECT COUNT(*) FROM active_path_status_aggregations", [], |row| row.get(0)).unwrap_or(0);
    summary.status_hits = conn.query_row("SELECT SUM(hit_count) FROM active_path_status_aggregations", [], |row| row.get(0)).unwrap_or(0);
    
    summary.method_count = conn.query_row("SELECT COUNT(*) FROM active_path_method_aggregations", [], |row| row.get(0)).unwrap_or(0);
    summary.method_hits = conn.query_row("SELECT SUM(hit_count) FROM active_path_method_aggregations", [], |row| row.get(0)).unwrap_or(0);
    
    summary.user_agent_count = conn.query_row("SELECT COUNT(*) FROM active_path_user_agent_aggregations", [], |row| row.get(0)).unwrap_or(0);
    summary.user_agent_hits = conn.query_row("SELECT SUM(hit_count) FROM active_path_user_agent_aggregations", [], |row| row.get(0)).unwrap_or(0);
    
    summary.referer_count = conn.query_row("SELECT COUNT(*) FROM active_path_referer_aggregations", [], |row| row.get(0)).unwrap_or(0);
    summary.referer_hits = conn.query_row("SELECT SUM(hit_count) FROM active_path_referer_aggregations", [], |row| row.get(0)).unwrap_or(0);
    
    summary.browser_count = conn.query_row("SELECT COUNT(*) FROM active_path_browser_aggregations", [], |row| row.get(0)).unwrap_or(0);
    summary.browser_hits = conn.query_row("SELECT SUM(hit_count) FROM active_path_browser_aggregations", [], |row| row.get(0)).unwrap_or(0);
    
    summary.verified_count = conn.query_row("SELECT COUNT(*) FROM active_path_verified_aggregations", [], |row| row.get(0)).unwrap_or(0);
    summary.verified_hits = conn.query_row("SELECT SUM(hit_count) FROM active_path_verified_aggregations", [], |row| row.get(0)).unwrap_or(0);
    
    summary.ip_count = conn.query_row("SELECT COUNT(*) FROM active_path_ip_aggregations", [], |row| row.get(0)).unwrap_or(0);
    summary.ip_hits = conn.query_row("SELECT SUM(hit_count) FROM active_path_ip_aggregations", [], |row| row.get(0)).unwrap_or(0);
    
    summary.path_count = conn.query_row("SELECT COUNT(*) FROM active_path_aggregations", [], |row| row.get(0)).unwrap_or(0);
    summary.path_hits = conn.query_row("SELECT SUM(hit_count) FROM active_path_aggregations", [], |row| row.get(0)).unwrap_or(0);

    Ok(summary)
}

pub fn insert_active_logs_batch(entries: &[LogEntry]) -> Result<(), String> {
    let mut lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_mut().ok_or("DB not initialized")?;

    let tx = conn.transaction().map_err(|e| e.to_string())?;
    {
        let mut stmt = tx
            .prepare(
                "INSERT INTO active_parsed_logs (
                ip, timestamp, method, path, position, clicks, ctr, impressions, gsc_url,
                status, user_agent, referer, response_size, country, crawler_type, is_crawler,
                file_type, browser, verified, segment, segment_match, taxonomy, filename
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .map_err(|e| e.to_string())?;

        // Pre-aggregate the batch in memory to minimize DB hits for the aggregation table
        let mut path_aggs: HashMap<(String, String, String), i64> = HashMap::new();
        let mut path_status_aggs: HashMap<(String, u16, String), i64> = HashMap::new();
        let mut path_method_aggs: HashMap<(String, String, String), i64> = HashMap::new();
        let mut path_user_agent_aggs: HashMap<(String, String, String), i64> = HashMap::new();
        let mut path_referer_aggs: HashMap<(String, String, String), i64> = HashMap::new();
        let mut path_browser_aggs: HashMap<(String, String, String), i64> = HashMap::new();
        let mut path_verified_aggs: HashMap<(String, String, bool, String), i64> = HashMap::new();
        let mut path_ip_aggs: HashMap<(String, String, String), i64> = HashMap::new();

        for entry in entries {
            stmt.execute(params![
                entry.ip,
                entry.timestamp,
                entry.method,
                entry.path,
                entry.position,
                entry.clicks,
                entry.ctr,
                entry.impressions,
                entry.gsc_url,
                entry.status,
                entry.user_agent,
                entry.referer,
                entry.response_size,
                entry.country,
                entry.crawler_type,
                entry.is_crawler,
                entry.file_type,
                entry.browser,
                entry.verified,
                entry.segment,
                entry.segment_match,
                entry.taxonomy,
                entry.filename
            ])
            .map_err(|e| e.to_string())?;

            // Track aggregations
            let key = (entry.path.clone(), entry.crawler_type.clone(), entry.segment.clone());
            *path_aggs.entry(key).or_insert(0) += 1;

            let status_key = (entry.path.clone(), entry.status, entry.segment.clone());
            *path_status_aggs.entry(status_key).or_insert(0) += 1;

            let method_key = (entry.path.clone(), entry.method.clone(), entry.segment.clone());
            *path_method_aggs.entry(method_key).or_insert(0) += 1;

            let ua_key = (entry.path.clone(), entry.user_agent.clone(), entry.segment.clone());
            *path_user_agent_aggs.entry(ua_key).or_insert(0) += 1;

            let referer_key = (entry.path.clone(), entry.referer.clone().unwrap_or_else(|| "-".to_string()), entry.segment.clone());
            *path_referer_aggs.entry(referer_key).or_insert(0) += 1;

            let browser_key = (entry.path.clone(), entry.browser.clone(), entry.segment.clone());
            *path_browser_aggs.entry(browser_key).or_insert(0) += 1;

            let verified_key = (entry.path.clone(), entry.crawler_type.clone(), entry.verified, entry.segment.clone());
            *path_verified_aggs.entry(verified_key).or_insert(0) += 1;

            let ip_key = (entry.path.clone(), entry.ip.clone(), entry.segment.clone());
            *path_ip_aggs.entry(ip_key).or_insert(0) += 1;
        }

        // Update the aggregation table in bulk
        let mut agg_stmt = tx.prepare_cached(
            "INSERT INTO active_path_aggregations (path, crawler_type, segment, hit_count)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(path, crawler_type, segment) DO UPDATE SET hit_count = hit_count + excluded.hit_count"
        ).map_err(|e| e.to_string())?;

        for ((path, crawler, segment), count) in path_aggs {
            agg_stmt.execute(params![path, crawler, segment, count]).map_err(|e| e.to_string())?;
        }

        let mut status_agg_stmt = tx.prepare_cached(
            "INSERT INTO active_path_status_aggregations (path, status, segment, hit_count)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(path, status, segment) DO UPDATE SET hit_count = hit_count + excluded.hit_count"
        ).map_err(|e| e.to_string())?;

        for ((path, status, segment), count) in path_status_aggs {
            status_agg_stmt.execute(params![path, status, segment, count]).map_err(|e| e.to_string())?;
        }

        let mut method_agg_stmt = tx.prepare_cached(
            "INSERT INTO active_path_method_aggregations (path, method, segment, hit_count)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(path, method, segment) DO UPDATE SET hit_count = hit_count + excluded.hit_count"
        ).map_err(|e| e.to_string())?;

        for ((path, method, segment), count) in path_method_aggs {
            method_agg_stmt.execute(params![path, method, segment, count]).map_err(|e| e.to_string())?;
        }

        let mut ua_agg_stmt = tx.prepare_cached(
            "INSERT INTO active_path_user_agent_aggregations (path, user_agent, segment, hit_count)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(path, user_agent, segment) DO UPDATE SET hit_count = hit_count + excluded.hit_count"
        ).map_err(|e| e.to_string())?;

        for ((path, ua, segment), count) in path_user_agent_aggs {
            ua_agg_stmt.execute(params![path, ua, segment, count]).map_err(|e| e.to_string())?;
        }

        let mut referer_agg_stmt = tx.prepare_cached(
            "INSERT INTO active_path_referer_aggregations (path, referer, segment, hit_count)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(path, referer, segment) DO UPDATE SET hit_count = hit_count + excluded.hit_count"
        ).map_err(|e| e.to_string())?;

        for ((path, referer, segment), count) in path_referer_aggs {
            referer_agg_stmt.execute(params![path, referer, segment, count]).map_err(|e| e.to_string())?;
        }

        let mut browser_agg_stmt = tx.prepare_cached(
            "INSERT INTO active_path_browser_aggregations (path, browser, segment, hit_count)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(path, browser, segment) DO UPDATE SET hit_count = hit_count + excluded.hit_count"
        ).map_err(|e| e.to_string())?;

        for ((path, browser, segment), count) in path_browser_aggs {
            browser_agg_stmt.execute(params![path, browser, segment, count]).map_err(|e| e.to_string())?;
        }

        let mut verified_agg_stmt = tx.prepare_cached(
            "INSERT INTO active_path_verified_aggregations (path, crawler_type, verified, segment, hit_count)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(path, crawler_type, verified, segment) DO UPDATE SET hit_count = hit_count + excluded.hit_count"
        ).map_err(|e| e.to_string())?;

        for ((path, crawler, verified, segment), count) in path_verified_aggs {
            verified_agg_stmt.execute(params![path, crawler, verified, segment, count]).map_err(|e| e.to_string())?;
        }

        let mut ip_agg_stmt = tx.prepare_cached(
            "INSERT INTO active_path_ip_aggregations (path, ip, segment, hit_count)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(path, ip, segment) DO UPDATE SET hit_count = hit_count + excluded.hit_count"
        ).map_err(|e| e.to_string())?;

        for ((path, ip, segment), count) in path_ip_aggs {
            ip_agg_stmt.execute(params![path, ip, segment, count]).map_err(|e| e.to_string())?;
        }
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ActiveFilters {
    pub search_term: String,
    pub status_filter: Vec<u16>,
    pub method_filter: Vec<String>,
    pub file_type_filter: Vec<String>,
    #[serde(default)]
    pub bot_filter: Option<String>,
    #[serde(default)]
    pub bot_type_filter: Option<String>,
    #[serde(default)]
    pub crawler_type_filter: Option<String>,
    #[serde(default)]
    pub verified_filter: Option<bool>,
    #[serde(default)]
    pub sort_key: Option<String>,
    #[serde(default)]
    pub sort_dir: Option<String>,
    #[serde(default)]
    pub taxonomy_filter: Option<String>,
    #[serde(default)]
    pub referer_filter: Option<String>,
    #[serde(default)]
    pub referer_categories: Vec<String>,
    #[serde(default)]
    pub referer_specific: Vec<String>,
    #[serde(default)]
    pub user_agent_filter: Option<String>,
    #[serde(default)]
    pub user_agent_categories: Vec<String>,
    #[serde(default)]
    pub user_agent_specific: Vec<String>,
}

fn get_referer_category_sql(cat: &str) -> (String, Vec<rusqlite::types::Value>) {
    match cat {
        "Direct/None" => ("(referer IS NULL OR referer = '' OR referer = '-')".to_string(), vec![]),
        "Google" => ("(LOWER(referer) LIKE '%google.com%' OR LOWER(referer) LIKE '%google.co%')".to_string(), vec![]),
        "MS Bing" => ("LOWER(referer) LIKE '%bing.com%'".to_string(), vec![]),
        "Yahoo" => ("LOWER(referer) LIKE '%yahoo.com%'".to_string(), vec![]),
        "DuckDuckGo" => ("LOWER(referer) LIKE '%duckduckgo.com%'".to_string(), vec![]),
        "Baidu" => ("LOWER(referer) LIKE '%baidu.com%'".to_string(), vec![]),
        "Yandex" => ("(LOWER(referer) LIKE '%yandex.com%' OR LOWER(referer) LIKE '%yandex.ru%')".to_string(), vec![]),
        "Facebook" => ("(LOWER(referer) LIKE '%facebook.com%' OR LOWER(referer) LIKE '%fb.com%')".to_string(), vec![]),
        "Twitter/X" => ("(LOWER(referer) LIKE '%twitter.com%' OR LOWER(referer) LIKE '%x.com%')".to_string(), vec![]),
        "LinkedIn" => ("LOWER(referer) LIKE '%linkedin.com%'".to_string(), vec![]),
        "Instagram" => ("LOWER(referer) LIKE '%instagram.com%'".to_string(), vec![]),
        "Pinterest" => ("LOWER(referer) LIKE '%pinterest.com%'".to_string(), vec![]),
        "Reddit" => ("LOWER(referer) LIKE '%reddit.com%'".to_string(), vec![]),
        "TikTok" => ("LOWER(referer) LIKE '%tiktok.com%'".to_string(), vec![]),
        "GitHub" => ("LOWER(referer) LIKE '%github.com%'".to_string(), vec![]),
        "YouTube" => ("LOWER(referer) LIKE '%youtube.com%'".to_string(), vec![]),
        "Local/Internal" => ("(LOWER(referer) LIKE '%localhost%' OR LOWER(referer) LIKE '%127.0.0.1%' OR LOWER(referer) LIKE '%::1%')".to_string(), vec![]),
        "Android App" => ("LOWER(referer) LIKE 'android-app://%'".to_string(), vec![]),
        "iOS App" => ("LOWER(referer) LIKE 'ios-app://%'".to_string(), vec![]),
        "Browser Bookmark" => ("(LOWER(referer) LIKE '%bookmark%' OR LOWER(referer) LIKE '%favorite%')".to_string(), vec![]),
        "Chrome Extension" => ("LOWER(referer) LIKE 'chrome-extension://%'".to_string(), vec![]),
        "Stack Overflow" => ("LOWER(referer) LIKE '%stackoverflow.com%'".to_string(), vec![]),
        "Medium" => ("LOWER(referer) LIKE '%medium.com%'".to_string(), vec![]),
        "WordPress" => ("LOWER(referer) LIKE '%wordpress.com%'".to_string(), vec![]),
        "Blogger" => ("LOWER(referer) LIKE '%blogger.com%'".to_string(), vec![]),
        "Quora" => ("LOWER(referer) LIKE '%quora.com%'".to_string(), vec![]),
        "Vimeo" => ("LOWER(referer) LIKE '%vimeo.com%'".to_string(), vec![]),
        "Wikipedia" => ("LOWER(referer) LIKE '%wikipedia.org%'".to_string(), vec![]),
        "Amazon" => ("LOWER(referer) LIKE '%amazon.com%'".to_string(), vec![]),
        "eBay" => ("LOWER(referer) LIKE '%ebay.com%'".to_string(), vec![]),
        "Etsy" => ("LOWER(referer) LIKE '%etsy.com%'".to_string(), vec![]),
        "Shopify" => ("LOWER(referer) LIKE '%shopify.com%'".to_string(), vec![]),
        "Email" => ("(LOWER(referer) LIKE 'mail.%' OR LOWER(referer) LIKE '%email%')".to_string(), vec![]),
        "News" => ("LOWER(referer) LIKE 'news.%'".to_string(), vec![]),
        "Blog" => ("LOWER(referer) LIKE 'blog.%'".to_string(), vec![]),
        "Other" => {
            let patterns = [
                "google.com", "google.co", "bing.com", "yahoo.com", 
                "duckduckgo.com", "baidu.com", "yandex.com", "yandex.ru", 
                "facebook.com", "fb.com", "twitter.com", "x.com", 
                "linkedin.com", "instagram.com", "pinterest.com", "reddit.com", 
                "tiktok.com", "github.com", "youtube.com", "stackoverflow.com", 
                "medium.com", "wordpress.com", "blogger.com", "quora.com", 
                "vimeo.com", "wikipedia.org", "amazon.com", "ebay.com", 
                "etsy.com", "shopify.com", "localhost", "127.0.0.1", "::1"
            ];
            let mut clauses = Vec::new();
            clauses.push("referer IS NOT NULL AND referer != '' AND referer != '-'".to_string());
            for p in patterns {
                clauses.push(format!("LOWER(referer) NOT LIKE '%{}%'", p));
            }
            (format!("({})", clauses.join(" AND ")), vec![])
        },
        other => {
            let pattern = format!("%{}%", other.to_lowercase());
            ("LOWER(referer) LIKE ?".to_string(), vec![pattern.into()])
        }
    }
}

fn get_user_agent_category_sql(cat: &str) -> (String, Vec<rusqlite::types::Value>) {
    let bot_patterns = [
        "googlebot",
        "bingbot",
        "slurp",
        "duckduckbot",
        "baiduspider",
        "yandexbot",
        "facebookexternalhit",
        "twitterbot",
        "linkedinbot",
        "applebot",
        "bot",
        "crawler",
        "spider",
    ];
    let tool_patterns = ["curl", "wget", "postman", "python"];
    let browser_patterns = [
        "chrome", "firefox", "safari", "edge", "opera", "trident", "msie",
    ];

    let mut not_bot_clauses = Vec::new();
    for p in bot_patterns {
        not_bot_clauses.push(format!("LOWER(user_agent) NOT LIKE '%{}%'", p));
    }
    let not_bot = not_bot_clauses.join(" AND ");

    let mut not_tool_clauses = Vec::new();
    for p in tool_patterns {
        not_tool_clauses.push(format!("LOWER(user_agent) NOT LIKE '%{}%'", p));
    }
    let not_tool = not_tool_clauses.join(" AND ");

    let mut not_browser_clauses = Vec::new();
    for p in browser_patterns {
        not_browser_clauses.push(format!("LOWER(user_agent) NOT LIKE '%{}%'", p));
    }
    let not_browser = not_browser_clauses.join(" AND ");

    let not_android = "LOWER(user_agent) NOT LIKE '%android%'";
    let not_ios = "(LOWER(user_agent) NOT LIKE '%iphone%' AND LOWER(user_agent) NOT LIKE '%ipad%' AND LOWER(user_agent) NOT LIKE '%ipod%')";
    let not_windows = "LOWER(user_agent) NOT LIKE '%windows%'";
    let not_macos = "LOWER(user_agent) NOT LIKE '%mac os%'";

    match cat {
        // 1. Bots
        "Googlebot" => ("LOWER(user_agent) LIKE '%googlebot%'".to_string(), vec![]),
        "Bingbot" => ("LOWER(user_agent) LIKE '%bingbot%'".to_string(), vec![]),
        "Yahoo Slurp" => ("LOWER(user_agent) LIKE '%slurp%'".to_string(), vec![]),
        "DuckDuckGo Bot" => ("LOWER(user_agent) LIKE '%duckduckbot%'".to_string(), vec![]),
        "Baidu Spider" => ("LOWER(user_agent) LIKE '%baiduspider%'".to_string(), vec![]),
        "Yandex Bot" => ("LOWER(user_agent) LIKE '%yandexbot%'".to_string(), vec![]),
        "Facebook Bot" => ("LOWER(user_agent) LIKE '%facebookexternalhit%'".to_string(), vec![]),
        "Twitter Bot" => ("LOWER(user_agent) LIKE '%twitterbot%'".to_string(), vec![]),
        "LinkedIn Bot" => ("LOWER(user_agent) LIKE '%linkedinbot%'".to_string(), vec![]),
        "Apple Bot" => ("LOWER(user_agent) LIKE '%applebot%'".to_string(), vec![]),
        "Other Bots" => (format!("({} AND (LOWER(user_agent) LIKE '%bot%' OR LOWER(user_agent) LIKE '%crawler%' OR LOWER(user_agent) LIKE '%spider%'))", 
            [
                "LOWER(user_agent) NOT LIKE '%googlebot%'", "LOWER(user_agent) NOT LIKE '%bingbot%'", 
                "LOWER(user_agent) NOT LIKE '%slurp%'", "LOWER(user_agent) NOT LIKE '%duckduckbot%'",
                "LOWER(user_agent) NOT LIKE '%baiduspider%'", "LOWER(user_agent) NOT LIKE '%yandexbot%'",
                "LOWER(user_agent) NOT LIKE '%facebookexternalhit%'", "LOWER(user_agent) NOT LIKE '%twitterbot%'",
                "LOWER(user_agent) NOT LIKE '%linkedinbot%'", "LOWER(user_agent) NOT LIKE '%applebot%'"
            ].join(" AND ")), vec![]),

        // 2. Tools
        "cURL" => ("LOWER(user_agent) LIKE '%curl%'".to_string(), vec![]),
        "Wget" => ("LOWER(user_agent) LIKE '%wget%'".to_string(), vec![]),
        "Postman" => ("LOWER(user_agent) LIKE '%postman%'".to_string(), vec![]),
        "Python Requests" => ("LOWER(user_agent) LIKE '%python%'".to_string(), vec![]),

        // 3. Browsers (Exclude Bots and Tools)
        "Chrome" => (format!("(LOWER(user_agent) LIKE '%chrome%' AND LOWER(user_agent) NOT LIKE '%mobile%' AND {} AND {})", not_bot, not_tool), vec![]),
        "Chrome Mobile" => (format!("(LOWER(user_agent) LIKE '%chrome%' AND LOWER(user_agent) LIKE '%mobile%' AND {} AND {})", not_bot, not_tool), vec![]),
        "Firefox" => (format!("(LOWER(user_agent) LIKE '%firefox%' AND LOWER(user_agent) NOT LIKE '%mobile%' AND {} AND {})", not_bot, not_tool), vec![]),
        "Firefox Mobile" => (format!("(LOWER(user_agent) LIKE '%firefox%' AND LOWER(user_agent) LIKE '%mobile%' AND {} AND {})", not_bot, not_tool), vec![]),
        "Safari" => (format!("(LOWER(user_agent) LIKE '%safari%' AND LOWER(user_agent) NOT LIKE '%chrome%' AND LOWER(user_agent) NOT LIKE '%mobile%' AND LOWER(user_agent) NOT LIKE '%iphone%' AND LOWER(user_agent) NOT LIKE '%ipad%' AND {} AND {})", not_bot, not_tool), vec![]),
        "Safari Mobile" => (format!("(LOWER(user_agent) LIKE '%safari%' AND NOT LOWER(user_agent) LIKE '%chrome%' AND (LOWER(user_agent) LIKE '%mobile%' OR LOWER(user_agent) LIKE '%iphone%' OR LOWER(user_agent) LIKE '%ipad%') AND {} AND {})", not_bot, not_tool), vec![]),
        "Microsoft Edge" => (format!("(LOWER(user_agent) LIKE '%edge%' AND {} AND {})", not_bot, not_tool), vec![]),
        "Opera" => (format!("(LOWER(user_agent) LIKE '%opera%' AND {} AND {})", not_bot, not_tool), vec![]),
        "Internet Explorer" => (format!("((LOWER(user_agent) LIKE '%trident%' OR LOWER(user_agent) LIKE '%msie%') AND {} AND {})", not_bot, not_tool), vec![]),

        // 4. Devices/OS (Exclude Bots, Tools, and Browsers)
        "Android Browser" => (format!("(LOWER(user_agent) LIKE '%android%' AND {} AND {} AND {})", not_bot, not_tool, not_browser), vec![]),
        "iOS Browser" => (format!("((LOWER(user_agent) LIKE '%iphone%' OR LOWER(user_agent) LIKE '%ipad%' OR LOWER(user_agent) LIKE '%ipod%') AND {} AND {} AND {} AND {})", not_bot, not_tool, not_browser, not_android), vec![]),
        "Windows" => (format!("(LOWER(user_agent) LIKE '%windows%' AND {} AND {} AND {} AND {} AND {})", not_bot, not_tool, not_browser, not_android, not_ios), vec![]),
        "macOS" => (format!("(LOWER(user_agent) LIKE '%mac os%' AND {} AND {} AND {} AND {} AND {} AND {})", not_bot, not_tool, not_browser, not_android, not_ios, not_windows), vec![]),
        "Linux" => (format!("(LOWER(user_agent) LIKE '%linux%' AND {} AND {} AND {} AND {} AND {} AND {} AND {})", not_bot, not_tool, not_browser, not_android, not_ios, not_windows, not_macos), vec![]),

        // 5. Specials
        "Unknown/Empty" => ("(user_agent IS NULL OR user_agent = '' OR user_agent = '-' OR user_agent = 'Unknown')".to_string(), vec![]),
        "Other" => {
            // Everything that doesn't match bots, tools, browsers, or devices
            let mut all_not = Vec::new();
            all_not.extend(not_bot_clauses);
            all_not.extend(not_tool_clauses);
            all_not.extend(not_browser_clauses);
            all_not.push("LOWER(user_agent) NOT LIKE '%android%'".to_string());
            all_not.push("LOWER(user_agent) NOT LIKE '%iphone%'".to_string());
            all_not.push("LOWER(user_agent) NOT LIKE '%ipad%'".to_string());
            all_not.push("LOWER(user_agent) NOT LIKE '%ipod%'".to_string());
            all_not.push("LOWER(user_agent) NOT LIKE '%windows%'".to_string());
            all_not.push("LOWER(user_agent) NOT LIKE '%mac os%'".to_string());
            all_not.push("LOWER(user_agent) NOT LIKE '%linux%'".to_string());
            all_not.push("user_agent IS NOT NULL AND user_agent != '' AND user_agent != '-' AND user_agent != 'Unknown'".to_string());
            (format!("({})", all_not.join(" AND ")), vec![])
        }

        other => {
            let pattern = format!("%{}%", other.to_lowercase());
            ("LOWER(user_agent) LIKE ?".to_string(), vec![pattern.into()])
        }
    }
}

fn build_where_clause(filters: &ActiveFilters) -> (String, Vec<rusqlite::types::Value>) {
    let mut clauses = vec!["1=1".to_string()];
    let mut params = Vec::new();

    if !filters.search_term.trim().is_empty() {
        let term = format!("%{}%", filters.search_term.to_lowercase());
        clauses.push(
            "(LOWER(ip) LIKE ? OR LOWER(path) LIKE ? OR LOWER(user_agent) LIKE ?)".to_string(),
        );
        params.push(term.clone().into());
        params.push(term.clone().into());
        params.push(term.into());
    }

    if !filters.status_filter.is_empty() {
        let in_clause = vec!["?"; filters.status_filter.len()].join(",");
        clauses.push(format!("status IN ({})", in_clause));
        for &s in &filters.status_filter {
            params.push((s as i64).into());
        }
    }

    if !filters.method_filter.is_empty() {
        let in_clause = vec!["?"; filters.method_filter.len()].join(",");
        clauses.push(format!("method IN ({})", in_clause));
        for m in &filters.method_filter {
            params.push(m.clone().into());
        }
    }

    if !filters.file_type_filter.is_empty() {
        let in_clause = vec!["?"; filters.file_type_filter.len()].join(",");
        clauses.push(format!("file_type IN ({})", in_clause));
        for f in &filters.file_type_filter {
            params.push(f.clone().into());
        }
    }

    if let Some(ref bot) = filters.bot_filter {
        if bot == "bot" {
            clauses.push("crawler_type != 'Human'".to_string());
        } else if bot == "Human" {
            clauses.push("crawler_type = 'Human'".to_string());
        }
    }

    if let Some(ref bot_type) = filters.bot_type_filter {
        if bot_type == "Mobile" {
            clauses.push("user_agent LIKE '%Mobile%'".to_string());
        } else if bot_type == "Desktop" {
            clauses.push("user_agent NOT LIKE '%Mobile%'".to_string());
        } else if bot_type == "All Bots" {
            clauses.push("crawler_type != 'Human'".to_string());
        } else if bot_type == "All Crawlers" {
            clauses.push("is_crawler = 1".to_string());
        } else {
            let bot_pattern = format!("%{}%", bot_type.to_lowercase());
            clauses.push("(LOWER(crawler_type) LIKE ? OR LOWER(user_agent) LIKE ?)".to_string());
            params.push(bot_pattern.clone().into());
            params.push(bot_pattern.into());
        }
    }

    if let Some(ref crawler_type) = filters.crawler_type_filter {
        let lower_ct = crawler_type.to_lowercase();
        if lower_ct == "google" {
            clauses.push(
                "(LOWER(crawler_type) LIKE '%google%' OR LOWER(user_agent) LIKE '%googlebot%')"
                    .to_string(),
            );
        } else if lower_ct == "bing" {
            clauses.push(
                "(LOWER(crawler_type) LIKE '%bing%' OR LOWER(user_agent) LIKE '%bingbot%')"
                    .to_string(),
            );
        } else if lower_ct == "semrush" {
            clauses.push("LOWER(crawler_type) LIKE '%semrush%'".to_string());
        } else if lower_ct == "hrefs" {
            clauses.push("LOWER(crawler_type) LIKE '%hrefs%'".to_string());
        } else if lower_ct == "moz" {
            clauses.push("LOWER(crawler_type) LIKE '%moz%'".to_string());
        } else if lower_ct == "openai" {
            clauses.push("(LOWER(crawler_type) LIKE '%openai%' OR LOWER(crawler_type) LIKE '%gpt%' OR LOWER(user_agent) LIKE '%chatgpt%' OR LOWER(user_agent) LIKE '%gptbot%' OR LOWER(user_agent) LIKE '%oai-%')".to_string());
        } else if lower_ct == "claude" {
            clauses.push(
                "(LOWER(crawler_type) LIKE '%claude%' OR LOWER(user_agent) LIKE '%claude%')"
                    .to_string(),
            );
        } else {
            clauses.push("crawler_type = ?".to_string());
            params.push(crawler_type.clone().into());
        }
    }

    if let Some(verified) = filters.verified_filter {
        clauses.push("verified = ?".to_string());
        params.push(verified.into());
    }

    if let Some(ref taxonomy) = filters.taxonomy_filter {
        clauses.push("segment = ?".to_string());
        params.push(taxonomy.clone().into());
    }

    // Referrer Filters
    let mut referer_clauses = Vec::new();

    // 1. Categories
    if !filters.referer_categories.is_empty() {
        let mut cat_or_clauses = Vec::new();
        for cat in &filters.referer_categories {
            let (clause, p) = get_referer_category_sql(cat);
            cat_or_clauses.push(clause);
            for val in p {
                params.push(val);
            }
        }
        referer_clauses.push(format!("({})", cat_or_clauses.join(" OR ")));
    } else if let Some(ref referer_cat) = filters.referer_filter {
        // Legacy/Single category support
        let (clause, p) = get_referer_category_sql(referer_cat);
        referer_clauses.push(clause);
        for val in p {
            params.push(val);
        }
    }

    // 2. Specific referrers
    if !filters.referer_specific.is_empty() {
        let mut spec_or_clauses = Vec::new();
        for spec in &filters.referer_specific {
            spec_or_clauses.push("referer = ?".to_string());
            params.push(spec.clone().into());
        }
        referer_clauses.push(format!("({})", spec_or_clauses.join(" OR ")));
    }

    if !referer_clauses.is_empty() {
        clauses.push(format!("({})", referer_clauses.join(" AND ")));
    }

    // User Agent Filters
    let mut ua_clauses = Vec::new();

    // 1. Categories
    if !filters.user_agent_categories.is_empty() {
        let mut cat_or_clauses = Vec::new();
        for cat in &filters.user_agent_categories {
            let (clause, p) = get_user_agent_category_sql(cat);
            cat_or_clauses.push(clause);
            for val in p {
                params.push(val);
            }
        }
        ua_clauses.push(format!("({})", cat_or_clauses.join(" OR ")));
    } else if let Some(ref ua_cat) = filters.user_agent_filter {
        // Legacy/Single category support
        let (clause, p) = get_user_agent_category_sql(ua_cat);
        ua_clauses.push(clause);
        for val in p {
            params.push(val);
        }
    }

    // 2. Specific user agents
    if !filters.user_agent_specific.is_empty() {
        let mut spec_or_clauses = Vec::new();
        for spec in &filters.user_agent_specific {
            spec_or_clauses.push("user_agent = ?".to_string());
            params.push(spec.clone().into());
        }
        ua_clauses.push(format!("({})", spec_or_clauses.join(" OR ")));
    }

    if !ua_clauses.is_empty() {
        clauses.push(format!("({})", ua_clauses.join(" AND ")));
    }

    (clauses.join(" AND "), params)
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BotPathDetail {
    pub ip: String,
    pub timestamp: String,
    pub method: String,
    pub path: String,
    pub status: u16,
    pub user_agent: String,
    pub referer: String,
    pub response_size: u64,
    pub country: String,
    pub is_crawler: bool,
    pub crawler_type: String,
    pub browser: String,
    pub file_type: String,
    pub frequency: usize,
    pub verified: bool,
}

#[derive(Serialize, Deserialize)]
pub struct FilteredLogsPage {
    pub entries: Vec<LogEntry>,
    pub total_count: u32,
}

#[tauri::command]
pub fn get_active_logs_page(
    page: u32,
    limit: u32,
    filters: ActiveFilters,
) -> Result<FilteredLogsPage, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let (where_sql, params_vec) = build_where_clause(&filters);

    // Get count
    let count_query = format!(
        "SELECT COUNT(*) FROM active_parsed_logs WHERE {}",
        where_sql
    );
    let total_count: u32 = conn
        .query_row(
            &count_query,
            rusqlite::params_from_iter(params_vec.iter()),
            |row| row.get(0),
        )
        .unwrap_or(0);

    // Get rows
    let mut order_sql = "ORDER BY timestamp ASC".to_string(); // default
    if let Some(ref key) = filters.sort_key {
        let safe_key = match key.as_str() {
            "timestamp" | "ip" | "path" | "status" | "user_agent" | "response_size" | "method"
            | "file_type" | "crawler_type" | "country" | "verified" => key,
            _ => "timestamp",
        };
        let safe_dir = if filters.sort_dir.as_deref() == Some("descending") {
            "DESC"
        } else {
            "ASC"
        };
        order_sql = format!("ORDER BY {} {}", safe_key, safe_dir);
    }

    let offset = (page.saturating_sub(1)) * limit;
    let query = format!(
        "SELECT * FROM active_parsed_logs WHERE {} {} LIMIT {} OFFSET {}",
        where_sql, order_sql, limit, offset
    );

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let entries = stmt
        .query_map(rusqlite::params_from_iter(params_vec.iter()), |row| {
            Ok(LogEntry {
                ip: row.get("ip")?,
                timestamp: row.get("timestamp")?,
                method: row.get("method")?,
                path: row.get("path")?,
                position: row.get("position")?,
                clicks: row.get("clicks")?,
                ctr: row.get("ctr")?,
                impressions: row.get("impressions")?,
                gsc_url: row.get("gsc_url")?,
                status: row.get::<_, u16>("status")?,
                user_agent: row.get("user_agent")?,
                referer: row.get("referer")?,
                response_size: row.get::<_, u32>("response_size")? as u64,
                country: row.get("country")?,
                crawler_type: row.get("crawler_type")?,
                is_crawler: row.get("is_crawler")?,
                file_type: row.get("file_type")?,
                browser: row.get("browser")?,
                verified: row.get("verified")?,
                segment: row.get("segment")?,
                segment_match: row.get("segment_match")?,
                taxonomy: row.get("taxonomy")?,
                filename: row.get("filename")?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(FilteredLogsPage {
        entries,
        total_count,
    })
}

#[tauri::command]
pub fn get_all_logs_with_filters(filters: ActiveFilters) -> Result<FilteredLogsPage, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let (where_sql, params_vec) = build_where_clause(&filters);

    // Get count
    let count_query = format!(
        "SELECT COUNT(*) FROM active_parsed_logs WHERE {}",
        where_sql
    );
    let total_count: u32 = conn
        .query_row(
            &count_query,
            rusqlite::params_from_iter(params_vec.iter()),
            |row| row.get(0),
        )
        .unwrap_or(0);

    // Get all rows without pagination
    let mut order_sql = "ORDER BY timestamp ASC".to_string();
    if let Some(ref key) = filters.sort_key {
        let safe_key = match key.as_str() {
            "timestamp" | "ip" | "path" | "status" | "user_agent" | "response_size" | "method"
            | "file_type" | "crawler_type" | "country" | "verified" => key,
            _ => "timestamp",
        };
        let safe_dir = if filters.sort_dir.as_deref() == Some("descending") {
            "DESC"
        } else {
            "ASC"
        };
        order_sql = format!("ORDER BY {} {}", safe_key, safe_dir);
    }

    // For stability, we MUST limit the "all" logs to a sane number.
    // Returning millions of logs via IPC will crash the app.
    // Reduced from 10000 to 1000 to strictly prevent WebKit EXC_BREAKPOINT JS Core crashes.
    let max_logs = 1000;
    let query = format!(
        "SELECT * FROM active_parsed_logs WHERE {} {} LIMIT {}",
        where_sql, order_sql, max_logs
    );

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let entries = stmt
        .query_map(rusqlite::params_from_iter(params_vec.iter()), |row| {
            Ok(LogEntry {
                ip: row.get("ip")?,
                timestamp: row.get("timestamp")?,
                method: row.get("method")?,
                path: row.get("path")?,
                position: row.get("position")?,
                clicks: row.get("clicks")?,
                ctr: row.get("ctr")?,
                impressions: row.get("impressions")?,
                gsc_url: row.get("gsc_url")?,
                status: row.get::<_, u16>("status")?,
                user_agent: row.get("user_agent")?,
                referer: row.get("referer")?,
                response_size: row.get::<_, u32>("response_size")? as u64,
                country: row.get("country")?,
                crawler_type: row.get("crawler_type")?,
                is_crawler: row.get("is_crawler")?,
                file_type: row.get("file_type")?,
                browser: row.get("browser")?,
                verified: row.get("verified")?,
                segment: row.get("segment")?,
                segment_match: row.get("segment_match")?,
                taxonomy: row.get("taxonomy")?,
                filename: row.get("filename")?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(FilteredLogsPage {
        entries,
        total_count,
    })
}

// Chart Aggregations
#[derive(Serialize, Deserialize, Default)]
pub struct TimelinePoint {
    pub date: String,
    pub human: usize,
    pub crawler: usize,
}

#[derive(Serialize, Deserialize, Default)]
pub struct StatusPoint {
    pub date: String,
    pub success: usize,
    pub redirect: usize,
    pub clientError: usize,
    pub serverError: usize,
}

#[derive(Serialize, Deserialize, Default)]
pub struct CrawlerPoint {
    pub date: String,
    pub google: usize,
    pub bing: usize,
    pub openai: usize,
    pub claude: usize,
    pub other: usize,
}

#[tauri::command]
pub fn get_timeline_aggregations(
    view_mode: String,
    filters: ActiveFilters,
) -> Result<Vec<TimelinePoint>, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let (where_sql, params_vec) = build_where_clause(&filters);

    let date_modifier = if view_mode == "daily" {
        "substr(timestamp, 1, 10)"
    } else {
        "substr(timestamp, 1, 13) || ':00:00'"
    };

    let query = format!(
        "
        SELECT
            {} as d,
            SUM(CASE WHEN crawler_type = 'Human' THEN 1 ELSE 0 END) as human_count,
            SUM(CASE WHEN crawler_type != 'Human' THEN 1 ELSE 0 END) as crawler_count
        FROM active_parsed_logs
        WHERE {}
        GROUP BY d
        ORDER BY d ASC
    ",
        date_modifier, where_sql
    );

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    let mut rows = stmt
        .query(rusqlite::params_from_iter(params_vec.iter()))
        .map_err(|e| e.to_string())?;

    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        // Daily output from substr is YYYY-MM-DD
        // Hourly output is YYYY-MM-DD HH:00:00, we format appropriately for FE or just send raw
        let raw_date: String = row.get(0).map_err(|e| e.to_string())?;
        let date_str = if view_mode == "daily" {
            raw_date
        } else {
            raw_date.replace(" ", "T") // FE expects YYYY-MM-DDTHH:00
        };

        result.push(TimelinePoint {
            date: date_str,
            human: row.get(1).map_err(|e| e.to_string())?,
            crawler: row.get(2).map_err(|e| e.to_string())?,
        });
    }

    Ok(result)
}

#[tauri::command]
pub fn get_status_aggregations(
    view_mode: String,
    filters: ActiveFilters,
) -> Result<Vec<StatusPoint>, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let (where_sql, params_vec) = build_where_clause(&filters);
    let date_modifier = if view_mode == "daily" {
        "substr(timestamp, 1, 10)"
    } else {
        "substr(timestamp, 1, 13) || ':00:00'"
    };

    let query = format!(
        "
        SELECT
            {} as d,
            SUM(CASE WHEN status >= 200 AND status < 300 THEN 1 ELSE 0 END) as succ,
            SUM(CASE WHEN status >= 300 AND status < 400 THEN 1 ELSE 0 END) as redir,
            SUM(CASE WHEN status >= 400 AND status < 500 THEN 1 ELSE 0 END) as cli,
            SUM(CASE WHEN status >= 500 THEN 1 ELSE 0 END) as srv
        FROM active_parsed_logs
        WHERE {}
        GROUP BY d
        ORDER BY d ASC
    ",
        date_modifier, where_sql
    );

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    let mut rows = stmt
        .query(rusqlite::params_from_iter(params_vec.iter()))
        .map_err(|e| e.to_string())?;

    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let raw_date: String = row.get(0).map_err(|e| e.to_string())?;
        let date_str = if view_mode == "daily" {
            raw_date
        } else {
            raw_date.replace(" ", "T")
        };
        result.push(StatusPoint {
            date: date_str,
            success: row
                .get::<_, Option<usize>>(1)
                .map_err(|e| e.to_string())?
                .unwrap_or(0),
            redirect: row
                .get::<_, Option<usize>>(2)
                .map_err(|e| e.to_string())?
                .unwrap_or(0),
            clientError: row
                .get::<_, Option<usize>>(3)
                .map_err(|e| e.to_string())?
                .unwrap_or(0),
            serverError: row
                .get::<_, Option<usize>>(4)
                .map_err(|e| e.to_string())?
                .unwrap_or(0),
        });
    }
    Ok(result)
}

#[tauri::command]
pub fn get_crawler_aggregations(
    view_mode: String,
    filters: ActiveFilters,
) -> Result<Vec<CrawlerPoint>, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let (where_sql, params_vec) = build_where_clause(&filters);
    // Ignore human
    let where_sql = format!(
        "{} AND (is_crawler = 1 OR crawler_type != 'Human')",
        where_sql
    );

    let date_modifier = if view_mode == "daily" {
        "substr(timestamp, 1, 10)"
    } else {
        "substr(timestamp, 1, 13) || ':00:00'"
    };

    let query = format!("
        SELECT
            {} as d,
            SUM(CASE WHEN LOWER(crawler_type) LIKE '%google%' THEN 1 ELSE 0 END) as ggl,
            SUM(CASE WHEN LOWER(crawler_type) LIKE '%bing%' THEN 1 ELSE 0 END) as bng,
            SUM(CASE WHEN (LOWER(crawler_type) LIKE '%openai%' OR LOWER(crawler_type) LIKE '%gpt%' OR LOWER(user_agent) LIKE '%chatgpt%' OR LOWER(user_agent) LIKE '%gptbot%' OR LOWER(user_agent) LIKE '%oai-%') THEN 1 ELSE 0 END) as oai,
            SUM(CASE WHEN LOWER(crawler_type) LIKE '%claude%' OR LOWER(user_agent) LIKE '%claude%' THEN 1 ELSE 0 END) as cld
        FROM active_parsed_logs
        WHERE {}
        GROUP BY d
        ORDER BY d ASC
    ", date_modifier, where_sql);

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    let mut rows = stmt
        .query(rusqlite::params_from_iter(params_vec.iter()))
        .map_err(|e| e.to_string())?;

    // In SQL we can't easily get 'other' generically by subtracting inside sum without a CTE, let's just do a second query for Total
    let total_query = format!(
        "SELECT {} as d, COUNT(*) FROM active_parsed_logs WHERE {} GROUP BY d",
        date_modifier, where_sql
    );
    let mut total_stmt = conn.prepare(&total_query).map_err(|e| e.to_string())?;
    let mut total_map = std::collections::HashMap::new();
    let mut t_rows = total_stmt
        .query(rusqlite::params_from_iter(params_vec.iter()))
        .map_err(|e| e.to_string())?;
    while let Some(tr) = t_rows.next().map_err(|e| e.to_string())? {
        let d: String = tr.get(0).map_err(|e| e.to_string())?;
        let t: usize = tr.get(1).map_err(|e| e.to_string())?;
        total_map.insert(d, t);
    }

    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let raw_date: String = row.get(0).map_err(|e| e.to_string())?;
        let ggl: usize = row
            .get::<_, Option<usize>>(1)
            .map_err(|e| e.to_string())?
            .unwrap_or(0);
        let bng: usize = row
            .get::<_, Option<usize>>(2)
            .map_err(|e| e.to_string())?
            .unwrap_or(0);
        let oai: usize = row
            .get::<_, Option<usize>>(3)
            .map_err(|e| e.to_string())?
            .unwrap_or(0);
        let cld: usize = row
            .get::<_, Option<usize>>(4)
            .map_err(|e| e.to_string())?
            .unwrap_or(0);

        let total = total_map.get(&raw_date).copied().unwrap_or(0);
        let other = total.saturating_sub(ggl + bng + oai + cld);

        let date_str = if view_mode == "daily" {
            raw_date
        } else {
            raw_date.replace(" ", "T")
        };
        result.push(CrawlerPoint {
            date: date_str,
            google: ggl,
            bing: bng,
            openai: oai,
            claude: cld,
            other,
        });
    }
    Ok(result)
}

#[derive(Serialize, Deserialize, Default)]
pub struct WidgetAggregations {
    pub file_types: std::collections::HashMap<String, usize>,
    pub content: std::collections::HashMap<String, usize>,
    pub status_codes: std::collections::HashMap<u16, usize>,
    pub user_agents: std::collections::HashMap<String, usize>,
    pub referrers: std::collections::HashMap<String, usize>,
    #[serde(default)]
    pub user_agent_categories: std::collections::HashMap<String, usize>,
    #[serde(default)]
    pub referrer_categories: std::collections::HashMap<String, usize>,
    #[serde(default)]
    pub crawler_types: std::collections::HashMap<String, usize>,
}

#[tauri::command]
pub fn get_widget_aggregations(filters: ActiveFilters) -> Result<WidgetAggregations, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let (where_sql, params_vec) = build_where_clause(&filters);
    let mut aggs = WidgetAggregations::default();

    // 1. File Types
    {
        let query = format!(
            "SELECT file_type, COUNT(*) FROM active_parsed_logs WHERE {} GROUP BY file_type",
            where_sql
        );
        let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(rusqlite::params_from_iter(params_vec.iter()), |row| {
                Ok((row.get::<_, Option<String>>(0)?, row.get::<_, usize>(1)?))
            })
            .map_err(|e| e.to_string())?;

        for row in rows {
            let (ft, count) = row.map_err(|e| e.to_string())?;
            aggs.file_types
                .insert(ft.unwrap_or_else(|| "Other".to_string()), count);
        }
    }

    // 2. Taxonomy / Content
    {
        let query = format!(
            "SELECT segment, COUNT(*) FROM active_parsed_logs WHERE {} GROUP BY segment",
            where_sql
        );
        let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(rusqlite::params_from_iter(params_vec.iter()), |row| {
                Ok((row.get::<_, Option<String>>(0)?, row.get::<_, usize>(1)?))
            })
            .map_err(|e| e.to_string())?;

        for row in rows {
            let (tax, count) = row.map_err(|e| e.to_string())?;
            aggs.content
                .insert(tax.unwrap_or_else(|| "Other".to_string()), count);
        }
    }

    // 3. Status Codes
    {
        let query = format!(
            "SELECT status, COUNT(*) FROM active_parsed_logs WHERE {} GROUP BY status",
            where_sql
        );
        let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(rusqlite::params_from_iter(params_vec.iter()), |row| {
                Ok((row.get::<_, u16>(0)?, row.get::<_, usize>(1)?))
            })
            .map_err(|e| e.to_string())?;

        for row in rows {
            let (st, count) = row.map_err(|e| e.to_string())?;
            if st > 0 {
                aggs.status_codes.insert(st, count);
            }
        }
    }

    // 4. User Agents (Top Strings for dropdown/examples)
    {
        let query = format!(
            "SELECT user_agent, COUNT(*) FROM active_parsed_logs WHERE {} GROUP BY user_agent ORDER BY COUNT(*) DESC LIMIT 500",
            where_sql
        );
        let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(rusqlite::params_from_iter(params_vec.iter()), |row| {
                Ok((row.get::<_, Option<String>>(0)?, row.get::<_, usize>(1)?))
            })
            .map_err(|e| e.to_string())?;

        for row in rows {
            let (ua, count) = row.map_err(|e| e.to_string())?;
            aggs.user_agents
                .insert(ua.unwrap_or_else(|| "Unknown".to_string()), count);
        }
    }

    // 5. User Agent Categories (Accurate Totals for Charts)
    {
        let bot_patterns = [
            ("googlebot", "Googlebot"),
            ("bingbot", "Bingbot"),
            ("slurp", "Yahoo Slurp"),
            ("duckduckbot", "DuckDuckGo Bot"),
            ("baiduspider", "Baidu Spider"),
            ("yandexbot", "Yandex Bot"),
            ("facebookexternalhit", "Facebook Bot"),
            ("twitterbot", "Twitter Bot"),
            ("linkedinbot", "LinkedIn Bot"),
            ("applebot", "Apple Bot"),
        ];

        let mut case_parts = Vec::new();
        case_parts.push("WHEN (user_agent IS NULL OR user_agent = '' OR user_agent = '-' OR user_agent = 'Unknown') THEN 'Unknown/Empty'".to_string());
        for (p, cat) in bot_patterns {
            case_parts.push(format!(
                "WHEN LOWER(user_agent) LIKE '%{}%' THEN '{}'",
                p, cat
            ));
        }
        case_parts.push("WHEN (LOWER(user_agent) LIKE '%bot%' OR LOWER(user_agent) LIKE '%crawler%' OR LOWER(user_agent) LIKE '%spider%') THEN 'Other Bots'".to_string());
        case_parts.push("WHEN LOWER(user_agent) LIKE '%curl%' THEN 'cURL'".to_string());
        case_parts.push("WHEN LOWER(user_agent) LIKE '%wget%' THEN 'Wget'".to_string());
        case_parts.push("WHEN LOWER(user_agent) LIKE '%postman%' THEN 'Postman'".to_string());
        case_parts
            .push("WHEN LOWER(user_agent) LIKE '%python%' THEN 'Python Requests'".to_string());
        case_parts.push("WHEN (LOWER(user_agent) LIKE '%chrome%' AND LOWER(user_agent) NOT LIKE '%mobile%') THEN 'Chrome'".to_string());
        case_parts.push("WHEN (LOWER(user_agent) LIKE '%chrome%' AND LOWER(user_agent) LIKE '%mobile%') THEN 'Chrome Mobile'".to_string());
        case_parts.push("WHEN (LOWER(user_agent) LIKE '%firefox%' AND LOWER(user_agent) NOT LIKE '%mobile%') THEN 'Firefox'".to_string());
        case_parts.push("WHEN (LOWER(user_agent) LIKE '%firefox%' AND LOWER(user_agent) LIKE '%mobile%') THEN 'Firefox Mobile'".to_string());
        case_parts.push("WHEN (LOWER(user_agent) LIKE '%safari%' AND LOWER(user_agent) NOT LIKE '%chrome%' AND LOWER(user_agent) NOT LIKE '%mobile%' AND LOWER(user_agent) NOT LIKE '%iphone%' AND LOWER(user_agent) NOT LIKE '%ipad%') THEN 'Safari'".to_string());
        case_parts.push("WHEN (LOWER(user_agent) LIKE '%safari%' AND NOT LOWER(user_agent) LIKE '%chrome%' AND (LOWER(user_agent) LIKE '%mobile%' OR LOWER(user_agent) LIKE '%iphone%' OR LOWER(user_agent) LIKE '%ipad%')) THEN 'Safari Mobile'".to_string());
        case_parts.push("WHEN LOWER(user_agent) LIKE '%edge%' THEN 'Microsoft Edge'".to_string());
        case_parts.push("WHEN LOWER(user_agent) LIKE '%opera%' THEN 'Opera'".to_string());
        case_parts.push("WHEN (LOWER(user_agent) LIKE '%trident%' OR LOWER(user_agent) LIKE '%msie%') THEN 'Internet Explorer'".to_string());
        case_parts
            .push("WHEN LOWER(user_agent) LIKE '%android%' THEN 'Android Browser'".to_string());
        case_parts.push("WHEN (LOWER(user_agent) LIKE '%iphone%' OR LOWER(user_agent) LIKE '%ipad%' OR LOWER(user_agent) LIKE '%ipod%') THEN 'iOS Browser'".to_string());
        case_parts.push("WHEN LOWER(user_agent) LIKE '%windows%' THEN 'Windows'".to_string());
        case_parts.push("WHEN LOWER(user_agent) LIKE '%mac os%' THEN 'macOS'".to_string());
        case_parts.push("WHEN LOWER(user_agent) LIKE '%linux%' THEN 'Linux'".to_string());

        let query = format!(
            "SELECT CASE {} ELSE 'Other' END as cat, COUNT(*) FROM active_parsed_logs WHERE {} GROUP BY cat",
            case_parts.join(" "),
            where_sql
        );
        let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(rusqlite::params_from_iter(params_vec.iter()), |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, usize>(1)?))
            })
            .map_err(|e| e.to_string())?;

        for row in rows {
            let (cat, count) = row.map_err(|e| e.to_string())?;
            aggs.user_agent_categories.insert(cat, count);
        }
    }

    // 6. Referrers (Top Strings for dropdown/examples)
    {
        let query = format!(
            "SELECT referer, COUNT(*) FROM active_parsed_logs WHERE {} GROUP BY referer ORDER BY COUNT(*) DESC LIMIT 500",
            where_sql
        );
        let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(rusqlite::params_from_iter(params_vec.iter()), |row| {
                Ok((row.get::<_, Option<String>>(0)?, row.get::<_, usize>(1)?))
            })
            .map_err(|e| e.to_string())?;

        for row in rows {
            let (ref_str, count) = row.map_err(|e| e.to_string())?;
            aggs.referrers
                .insert(ref_str.unwrap_or_else(|| "Direct/None".to_string()), count);
        }
    }

    // 7. Referrer Categories (Accurate Totals for Charts)
    {
        let ref_patterns = [
            ("google.com", "Google"),
            ("google.co", "Google"),
            ("bing.com", "MS Bing"),
            ("yahoo.com", "Yahoo"),
            ("duckduckgo.com", "DuckDuckGo"),
            ("baidu.com", "Baidu"),
            ("yandex.com", "Yandex"),
            ("yandex.ru", "Yandex"),
            ("facebook.com", "Facebook"),
            ("fb.com", "Facebook"),
            ("twitter.com", "Twitter/X"),
            ("x.com", "Twitter/X"),
            ("linkedin.com", "LinkedIn"),
            ("instagram.com", "Instagram"),
            ("pinterest.com", "Pinterest"),
            ("reddit.com", "Reddit"),
            ("tiktok.com", "TikTok"),
            ("github.com", "GitHub"),
            ("youtube.com", "YouTube"),
            ("stackoverflow.com", "Stack Overflow"),
            ("medium.com", "Medium"),
            ("wordpress.com", "WordPress"),
            ("blogger.com", "Blogger"),
            ("quora.com", "Quora"),
            ("vimeo.com", "Vimeo"),
            ("wikipedia.org", "Wikipedia"),
            ("amazon.com", "Amazon"),
            ("ebay.com", "eBay"),
            ("etsy.com", "Etsy"),
            ("shopify.com", "Shopify"),
        ];

        let mut case_parts = Vec::new();
        case_parts.push(
            "WHEN (referer IS NULL OR referer = '' OR referer = '-') THEN 'Direct/None'"
                .to_string(),
        );
        for (p, cat) in ref_patterns {
            case_parts.push(format!("WHEN LOWER(referer) LIKE '%{}%' THEN '{}'", p, cat));
        }
        case_parts.push("WHEN (LOWER(referer) LIKE '%localhost%' OR LOWER(referer) LIKE '%127.0.0.1%' OR LOWER(referer) LIKE '%::1%') THEN 'Local/Internal'".to_string());

        let query = format!(
            "SELECT CASE {} ELSE 'Other' END as cat, COUNT(*) FROM active_parsed_logs WHERE {} GROUP BY cat",
            case_parts.join(" "),
            where_sql
        );
        let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(rusqlite::params_from_iter(params_vec.iter()), |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, usize>(1)?))
            })
            .map_err(|e| e.to_string())?;

        for row in rows {
            let (cat, count) = row.map_err(|e| e.to_string())?;
            aggs.referrer_categories.insert(cat, count);
        }
    }

    // 8. Crawler Types (Robots Only)
    {
        let query = format!(
            "SELECT crawler_type, COUNT(*) FROM active_parsed_logs WHERE {} AND crawler_type != 'Human' AND crawler_type IS NOT NULL AND crawler_type != '' GROUP BY crawler_type",
            where_sql
        );
        let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(rusqlite::params_from_iter(params_vec.iter()), |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, usize>(1)?))
            })
            .map_err(|e| e.to_string())?;

        for row in rows {
            let (ct, count) = row.map_err(|e| e.to_string())?;
            aggs.crawler_types.insert(ct, count);
        }
    }

    Ok(aggs)
}


#[tauri::command]
pub fn get_active_logs_stats(filters: ActiveFilters) -> Result<LogAnalysisResult, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let (where_sql, params_vec) = build_where_clause(&filters);

    // Get total count, crawler count, unique IPs and UAs
    let mut stmt = conn
        .prepare(&format!(
            "
        SELECT
            COUNT(*),
            SUM(CASE WHEN is_crawler = 1 THEN 1 ELSE 0 END),
            COUNT(DISTINCT ip),
            COUNT(DISTINCT user_agent),
            SUM(CASE WHEN status >= 200 AND status < 300 THEN 1 ELSE 0 END),
            MIN(timestamp),
            MAX(timestamp)
        FROM active_parsed_logs
        WHERE {}
    ",
            where_sql
        ))
        .map_err(|e| e.to_string())?;

    let (total_count, crawler_count, unique_ips, unique_uas, success_count, start_time, end_time): (i64, Option<i64>, i64, i64, Option<i64>, Option<String>, Option<String>) = stmt.query_row(
        rusqlite::params_from_iter(params_vec.iter()),
        |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
                row.get(5)?,
                row.get(6)?,
            ))
        }
    ).map_err(|e| e.to_string())?;

    let total_count = total_count as usize;
    let crawler_count = crawler_count.unwrap_or(0) as usize;
    let unique_ips = unique_ips as usize;
    let unique_user_agents = unique_uas as usize;
    let success_count = success_count.unwrap_or(0) as usize;
    let log_start_time = start_time.unwrap_or_default();
    let log_finish_time = end_time.unwrap_or_default();

    // Get Status Code Counts
    let mut status_stmt = conn
        .prepare(&format!(
            "SELECT status, COUNT(*) FROM active_parsed_logs WHERE {} GROUP BY status",
            where_sql
        ))
        .map_err(|e| e.to_string())?;
    let mut status_codes = StatusCodeCounts::new();
    let status_rows = status_stmt
        .query_map(rusqlite::params_from_iter(params_vec.iter()), |row| {
            Ok((row.get::<_, u16>(0)?, row.get::<_, usize>(1)?))
        })
        .map_err(|e| e.to_string())?;

    for row in status_rows {
        let (status, count) = row.map_err(|e| e.to_string())?;
        status_codes.counts.insert(status, count);
    }

    // Get Bot Totals
    let mut bot_totals = Totals::default();
    bot_totals.status_codes = status_codes.clone();

    // Get Bot Totals using a single SUM(CASE) query for consistency
    let mut bot_stmt = conn
        .prepare(&format!(
            "
        SELECT
            SUM(CASE WHEN LOWER(crawler_type) LIKE '%google%' THEN 1 ELSE 0 END),
            SUM(CASE WHEN LOWER(crawler_type) LIKE '%bing%' THEN 1 ELSE 0 END),
            SUM(CASE WHEN LOWER(crawler_type) LIKE '%semrush%' THEN 1 ELSE 0 END),
            SUM(CASE WHEN LOWER(crawler_type) LIKE '%ahrefs%' THEN 1 ELSE 0 END),
            SUM(CASE WHEN LOWER(crawler_type) LIKE '%moz%' THEN 1 ELSE 0 END),
            SUM(CASE WHEN LOWER(crawler_type) LIKE '%uptime%' THEN 1 ELSE 0 END),
            SUM(CASE WHEN (LOWER(crawler_type) LIKE '%openai%' OR LOWER(crawler_type) LIKE '%gpt%' OR LOWER(user_agent) LIKE '%chatgpt%' OR LOWER(user_agent) LIKE '%gptbot%' OR LOWER(user_agent) LIKE '%oai-%') THEN 1 ELSE 0 END),
            SUM(CASE WHEN LOWER(crawler_type) LIKE '%claude%' OR LOWER(user_agent) LIKE '%claude%' THEN 1 ELSE 0 END)
        FROM active_parsed_logs
        WHERE {}
    ",
            where_sql
        ))
        .map_err(|e| e.to_string())?;

    let (ggl, bng, sem, ahr, moz, upt, oai, cld): (
        Option<i64>,
        Option<i64>,
        Option<i64>,
        Option<i64>,
        Option<i64>,
        Option<i64>,
        Option<i64>,
        Option<i64>,
    ) = bot_stmt
        .query_row(rusqlite::params_from_iter(params_vec.iter()), |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
                row.get(5)?,
                row.get(6)?,
                row.get(7)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    bot_totals.google = ggl.unwrap_or(0) as usize;
    bot_totals.bing = bng.unwrap_or(0) as usize;
    bot_totals.semrush = sem.unwrap_or(0) as usize;
    bot_totals.hrefs = ahr.unwrap_or(0) as usize;
    bot_totals.moz = moz.unwrap_or(0) as usize;
    bot_totals.uptime = upt.unwrap_or(0) as usize;
    bot_totals.openai = oai.unwrap_or(0) as usize;
    bot_totals.claude = cld.unwrap_or(0) as usize;

    Ok(LogAnalysisResult {
        message: "Stats retrieved".to_string(),
        line_count: total_count,
        unique_ips,
        unique_user_agents,
        crawler_count,
        success_rate: if total_count > 0 {
            (success_count as f32 / total_count as f32) * 100.0
        } else {
            0.0
        },
        totals: bot_totals,
        log_start_time,
        log_finish_time,
        file_count: 0, // Not easily trackable from DB alone without more schema changes
        segmentations: Vec::new(), // Would require reprocessing segments
        segment_summary: SegmentSummary::default(),
    })
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ActivePathAggregation {
    pub path: String,
    pub crawler_type: String,
    pub segment: String,
    pub hit_count: i64,
}

#[derive(Serialize, Deserialize)]
pub struct ActivePathAggregationsPage {
    pub data: Vec<ActivePathAggregation>,
    pub total_count: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ActivePathStatusAggregation {
    pub path: String,
    pub status: u16,
    pub segment: String,
    pub hit_count: i64,
}

#[derive(Serialize, Deserialize)]
pub struct ActivePathStatusAggregationsPage {
    pub data: Vec<ActivePathStatusAggregation>,
    pub total_count: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ActivePathMethodAggregation {
    pub path: String,
    pub method: String,
    pub segment: String,
    pub hit_count: i64,
}

#[derive(Serialize, Deserialize)]
pub struct ActivePathMethodAggregationsPage {
    pub data: Vec<ActivePathMethodAggregation>,
    pub total_count: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ActivePathUserAgentAggregation {
    pub path: String,
    pub user_agent: String,
    pub segment: String,
    pub hit_count: i64,
}

#[derive(Serialize, Deserialize)]
pub struct ActivePathUserAgentAggregationsPage {
    pub data: Vec<ActivePathUserAgentAggregation>,
    pub total_count: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ActivePathRefererAggregation {
    pub path: String,
    pub referer: String,
    pub segment: String,
    pub hit_count: i64,
}

#[derive(Serialize, Deserialize)]
pub struct ActivePathRefererAggregationsPage {
    pub data: Vec<ActivePathRefererAggregation>,
    pub total_count: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ActivePathBrowserAggregation {
    pub path: String,
    pub browser: String,
    pub segment: String,
    pub hit_count: i64,
}

#[derive(Serialize, Deserialize)]
pub struct ActivePathBrowserAggregationsPage {
    pub data: Vec<ActivePathBrowserAggregation>,
    pub total_count: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ActivePathVerifiedAggregation {
    pub path: String,
    pub crawler_type: String,
    pub verified: bool,
    pub segment: String,
    pub hit_count: i64,
}

#[derive(Serialize, Deserialize)]
pub struct ActivePathVerifiedAggregationsPage {
    pub data: Vec<ActivePathVerifiedAggregation>,
    pub total_count: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ActivePathIPAggregation {
    pub path: String,
    pub ip: String,
    pub segment: String,
    pub hit_count: i64,
}

#[derive(Serialize, Deserialize)]
pub struct ActivePathIPAggregationsPage {
    pub data: Vec<ActivePathIPAggregation>,
    pub total_count: u32,
}

#[tauri::command]
pub fn get_active_path_aggregations(
    page: u32,
    limit: u32,
    sort_by: Option<String>,
    sort_order: Option<String>,
    crawler_filter: Option<String>,
    segment_filter: Option<String>,
) -> Result<ActivePathAggregationsPage, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let mut clauses = vec!["1=1".to_string()];
    let mut params: Vec<rusqlite::types::Value> = Vec::new();

    if let Some(ref crawler) = crawler_filter {
        if !crawler.is_empty() {
            clauses.push("crawler_type = ?".to_string());
            params.push(crawler.clone().into());
        }
    }

    if let Some(ref segment) = segment_filter {
        if !segment.is_empty() {
            clauses.push("segment = ?".to_string());
            params.push(segment.clone().into());
        }
    }

    let where_sql = clauses.join(" AND ");

    // Get total count of unique path/crawler combinations
    let count_query = format!(
        "SELECT COUNT(*) FROM active_path_aggregations WHERE {}",
        where_sql
    );
    let total_count: u32 = conn
        .query_row(
            &count_query,
            rusqlite::params_from_iter(params.iter()),
            |row| row.get(0),
        )
        .unwrap_or(0);

    // Get rows with pagination
    let sort_col = match sort_by.as_deref() {
        Some("hit_count") => "hit_count",
        Some("path") => "path",
        Some("crawler_type") => "crawler_type",
        Some("segment") => "segment",
        _ => "hit_count",
    };
    let order = if sort_order.as_deref() == Some("ascending") {
        "ASC"
    } else {
        "DESC"
    };

    let offset = (page.saturating_sub(1)) * limit;
    let query = format!(
        "SELECT path, crawler_type, segment, hit_count FROM active_path_aggregations WHERE {} ORDER BY {} {} LIMIT {} OFFSET {}",
        where_sql, sort_col, order, limit, offset
    );

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let data = stmt
        .query_map(rusqlite::params_from_iter(params.iter()), |row| {
            Ok(ActivePathAggregation {
                path: row.get(0)?,
                crawler_type: row.get(1)?,
                segment: row.get(2)?,
                hit_count: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(ActivePathAggregationsPage { data, total_count })
}

#[tauri::command]
pub fn get_active_path_status_aggregations(
    page: u32,
    limit: u32,
    sort_by: Option<String>,
    sort_order: Option<String>,
    status_filter: Option<u16>,
    segment_filter: Option<String>,
) -> Result<ActivePathStatusAggregationsPage, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let mut clauses = vec!["1=1".to_string()];
    let mut params: Vec<rusqlite::types::Value> = Vec::new();

    if let Some(status) = status_filter {
        if status > 0 {
            clauses.push("status = ?".to_string());
            params.push((status as i64).into());
        }
    }

    if let Some(ref segment) = segment_filter {
        if !segment.is_empty() {
            clauses.push("segment = ?".to_string());
            params.push(segment.clone().into());
        }
    }

    let where_sql = clauses.join(" AND ");

    // Get total count
    let count_query = format!(
        "SELECT COUNT(*) FROM active_path_status_aggregations WHERE {}",
        where_sql
    );
    let total_count: u32 = conn
        .query_row(
            &count_query,
            rusqlite::params_from_iter(params.iter()),
            |row| row.get(0),
        )
        .unwrap_or(0);

    // Get rows with pagination
    let sort_col = match sort_by.as_deref() {
        Some("hit_count") => "hit_count",
        Some("path") => "path",
        Some("status") => "status",
        Some("segment") => "segment",
        _ => "hit_count",
    };
    let order = if sort_order.as_deref() == Some("ascending") {
        "ASC"
    } else {
        "DESC"
    };

    let offset = (page.saturating_sub(1)) * limit;
    let query = format!(
        "SELECT path, status, segment, hit_count FROM active_path_status_aggregations WHERE {} ORDER BY {} {} LIMIT {} OFFSET {}",
        where_sql, sort_col, order, limit, offset
    );

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let data = stmt
        .query_map(rusqlite::params_from_iter(params.iter()), |row| {
            Ok(ActivePathStatusAggregation {
                path: row.get(0)?,
                status: row.get(1)?,
                segment: row.get(2)?,
                hit_count: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(ActivePathStatusAggregationsPage { data, total_count })
}

#[tauri::command]
pub fn get_active_path_method_aggregations(
    page: u32,
    limit: u32,
    sort_by: Option<String>,
    sort_order: Option<String>,
    method_filter: Option<String>,
    segment_filter: Option<String>,
) -> Result<ActivePathMethodAggregationsPage, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let mut clauses = vec!["1=1".to_string()];
    let mut params: Vec<rusqlite::types::Value> = Vec::new();

    if let Some(ref method) = method_filter {
        if !method.is_empty() {
            clauses.push("method = ?".to_string());
            params.push(method.clone().into());
        }
    }

    if let Some(ref segment) = segment_filter {
        if !segment.is_empty() {
            clauses.push("segment = ?".to_string());
            params.push(segment.clone().into());
        }
    }

    let where_sql = clauses.join(" AND ");

    // Get total count
    let count_query = format!(
        "SELECT COUNT(*) FROM active_path_method_aggregations WHERE {}",
        where_sql
    );
    let total_count: u32 = conn
        .query_row(
            &count_query,
            rusqlite::params_from_iter(params.iter()),
            |row| row.get(0),
        )
        .unwrap_or(0);

    // Get rows with pagination
    let sort_col = match sort_by.as_deref() {
        Some("hit_count") => "hit_count",
        Some("path") => "path",
        Some("method") => "method",
        Some("segment") => "segment",
        _ => "hit_count",
    };
    let order = if sort_order.as_deref() == Some("ascending") {
        "ASC"
    } else {
        "DESC"
    };

    let offset = (page.saturating_sub(1)) * limit;
    let query = format!(
        "SELECT path, method, segment, hit_count FROM active_path_method_aggregations WHERE {} ORDER BY {} {} LIMIT {} OFFSET {}",
        where_sql, sort_col, order, limit, offset
    );

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let data = stmt
        .query_map(rusqlite::params_from_iter(params.iter()), |row| {
            Ok(ActivePathMethodAggregation {
                path: row.get(0)?,
                method: row.get(1)?,
                segment: row.get(2)?,
                hit_count: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(ActivePathMethodAggregationsPage { data, total_count })
}

#[tauri::command]
pub fn get_active_path_user_agent_aggregations(
    page: u32,
    limit: u32,
    sort_by: Option<String>,
    sort_order: Option<String>,
    user_agent_filter: Option<String>,
    segment_filter: Option<String>,
) -> Result<ActivePathUserAgentAggregationsPage, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let mut clauses = vec!["1=1".to_string()];
    let mut params: Vec<rusqlite::types::Value> = Vec::new();

    if let Some(ref ua) = user_agent_filter {
        if !ua.is_empty() {
            clauses.push("user_agent LIKE ?".to_string());
            params.push(format!("%{}%", ua).into());
        }
    }

    if let Some(ref segment) = segment_filter {
        if !segment.is_empty() {
            clauses.push("segment = ?".to_string());
            params.push(segment.clone().into());
        }
    }

    let where_sql = clauses.join(" AND ");

    // Get total count
    let count_query = format!(
        "SELECT COUNT(*) FROM active_path_user_agent_aggregations WHERE {}",
        where_sql
    );
    let total_count: u32 = conn
        .query_row(
            &count_query,
            rusqlite::params_from_iter(params.iter()),
            |row| row.get(0),
        )
        .unwrap_or(0);

    // Get rows with pagination
    let sort_col = match sort_by.as_deref() {
        Some("hit_count") => "hit_count",
        Some("path") => "path",
        Some("user_agent") => "user_agent",
        Some("segment") => "segment",
        _ => "hit_count",
    };
    let order = if sort_order.as_deref() == Some("ascending") {
        "ASC"
    } else {
        "DESC"
    };

    let offset = (page.saturating_sub(1)) * limit;
    let query = format!(
        "SELECT path, user_agent, segment, hit_count FROM active_path_user_agent_aggregations WHERE {} ORDER BY {} {} LIMIT {} OFFSET {}",
        where_sql, sort_col, order, limit, offset
    );

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let data = stmt
        .query_map(rusqlite::params_from_iter(params.iter()), |row| {
            Ok(ActivePathUserAgentAggregation {
                path: row.get(0)?,
                user_agent: row.get(1)?,
                segment: row.get(2)?,
                hit_count: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(ActivePathUserAgentAggregationsPage { data, total_count })
}

#[tauri::command]
pub fn get_active_path_referer_aggregations(
    page: u32,
    limit: u32,
    sort_by: Option<String>,
    sort_order: Option<String>,
    referer_filter: Option<String>,
    segment_filter: Option<String>,
) -> Result<ActivePathRefererAggregationsPage, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let mut clauses = vec!["1=1".to_string()];
    let mut params: Vec<rusqlite::types::Value> = Vec::new();

    if let Some(ref referer) = referer_filter {
        if !referer.is_empty() {
            clauses.push("referer LIKE ?".to_string());
            params.push(format!("%{}%", referer).into());
        }
    }

    if let Some(ref segment) = segment_filter {
        if !segment.is_empty() {
            clauses.push("segment = ?".to_string());
            params.push(segment.clone().into());
        }
    }

    let where_sql = clauses.join(" AND ");

    // Get total count
    let count_query = format!(
        "SELECT COUNT(*) FROM active_path_referer_aggregations WHERE {}",
        where_sql
    );
    let total_count: u32 = conn
        .query_row(
            &count_query,
            rusqlite::params_from_iter(params.iter()),
            |row| row.get(0),
        )
        .unwrap_or(0);

    // Get rows with pagination
    let sort_col = match sort_by.as_deref() {
        Some("hit_count") => "hit_count",
        Some("path") => "path",
        Some("referer") => "referer",
        Some("segment") => "segment",
        _ => "hit_count",
    };
    let order = if sort_order.as_deref() == Some("ascending") {
        "ASC"
    } else {
        "DESC"
    };

    let offset = (page.saturating_sub(1)) * limit;
    let query = format!(
        "SELECT path, referer, segment, hit_count FROM active_path_referer_aggregations WHERE {} ORDER BY {} {} LIMIT {} OFFSET {}",
        where_sql, sort_col, order, limit, offset
    );

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let data = stmt
        .query_map(rusqlite::params_from_iter(params.iter()), |row| {
            Ok(ActivePathRefererAggregation {
                path: row.get(0)?,
                referer: row.get(1)?,
                segment: row.get(2)?,
                hit_count: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(ActivePathRefererAggregationsPage { data, total_count })
}

#[tauri::command]
pub fn get_active_path_browser_aggregations(
    page: u32,
    limit: u32,
    sort_by: Option<String>,
    sort_order: Option<String>,
    browser_filter: Option<String>,
    segment_filter: Option<String>,
) -> Result<ActivePathBrowserAggregationsPage, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let mut clauses = vec!["1=1".to_string()];
    let mut params: Vec<rusqlite::types::Value> = Vec::new();

    if let Some(ref browser) = browser_filter {
        if !browser.is_empty() {
            clauses.push("browser = ?".to_string());
            params.push(browser.clone().into());
        }
    }

    if let Some(ref segment) = segment_filter {
        if !segment.is_empty() {
            clauses.push("segment = ?".to_string());
            params.push(segment.clone().into());
        }
    }

    let where_sql = clauses.join(" AND ");

    // Get total count
    let count_query = format!(
        "SELECT COUNT(*) FROM active_path_browser_aggregations WHERE {}",
        where_sql
    );
    let total_count: u32 = conn
        .query_row(
            &count_query,
            rusqlite::params_from_iter(params.iter()),
            |row| row.get(0),
        )
        .unwrap_or(0);

    // Get rows with pagination
    let sort_col = match sort_by.as_deref() {
        Some("hit_count") => "hit_count",
        Some("path") => "path",
        Some("browser") => "browser",
        Some("segment") => "segment",
        _ => "hit_count",
    };
    let order = if sort_order.as_deref() == Some("ascending") {
        "ASC"
    } else {
        "DESC"
    };

    let offset = (page.saturating_sub(1)) * limit;
    let query = format!(
        "SELECT path, browser, segment, hit_count FROM active_path_browser_aggregations WHERE {} ORDER BY {} {} LIMIT {} OFFSET {}",
        where_sql, sort_col, order, limit, offset
    );

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let data = stmt
        .query_map(rusqlite::params_from_iter(params.iter()), |row| {
            Ok(ActivePathBrowserAggregation {
                path: row.get(0)?,
                browser: row.get(1)?,
                segment: row.get(2)?,
                hit_count: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(ActivePathBrowserAggregationsPage { data, total_count })
}

#[tauri::command]
pub fn get_active_path_verified_aggregations(
    page: u32,
    limit: u32,
    sort_by: Option<String>,
    sort_order: Option<String>,
    crawler_filter: Option<String>,
    verified_filter: Option<bool>,
    segment_filter: Option<String>,
) -> Result<ActivePathVerifiedAggregationsPage, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let mut clauses = vec!["1=1".to_string()];
    let mut params: Vec<rusqlite::types::Value> = Vec::new();

    if let Some(ref crawler) = crawler_filter {
        if !crawler.is_empty() {
            clauses.push("crawler_type = ?".to_string());
            params.push(crawler.clone().into());
        }
    }

    if let Some(verified) = verified_filter {
        clauses.push("verified = ?".to_string());
        params.push(verified.into());
    }

    if let Some(ref segment) = segment_filter {
        if !segment.is_empty() {
            clauses.push("segment = ?".to_string());
            params.push(segment.clone().into());
        }
    }

    let where_sql = clauses.join(" AND ");

    // Get total count
    let count_query = format!(
        "SELECT COUNT(*) FROM active_path_verified_aggregations WHERE {}",
        where_sql
    );
    let total_count: u32 = conn
        .query_row(
            &count_query,
            rusqlite::params_from_iter(params.iter()),
            |row| row.get(0),
        )
        .unwrap_or(0);

    // Get rows with pagination
    let sort_col = match sort_by.as_deref() {
        Some("hit_count") => "hit_count",
        Some("path") => "path",
        Some("verified") => "verified",
        Some("segment") => "segment",
        _ => "hit_count",
    };
    let order = if sort_order.as_deref() == Some("ascending") {
        "ASC"
    } else {
        "DESC"
    };

    let offset = (page.saturating_sub(1)) * limit;
    let query = format!(
        "SELECT path, crawler_type, verified, segment, hit_count FROM active_path_verified_aggregations WHERE {} ORDER BY {} {} LIMIT {} OFFSET {}",
        where_sql, sort_col, order, limit, offset
    );

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let data = stmt
        .query_map(rusqlite::params_from_iter(params.iter()), |row| {
            Ok(ActivePathVerifiedAggregation {
                path: row.get(0)?,
                crawler_type: row.get(1)?,
                verified: row.get(2)?,
                segment: row.get(3)?,
                hit_count: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(ActivePathVerifiedAggregationsPage { data, total_count })
}

#[tauri::command]
pub fn get_active_path_ip_aggregations(
    page: u32,
    limit: u32,
    sort_by: Option<String>,
    sort_order: Option<String>,
    ip_filter: Option<String>,
    segment_filter: Option<String>,
) -> Result<ActivePathIPAggregationsPage, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let mut clauses = vec!["1=1".to_string()];
    let mut params: Vec<rusqlite::types::Value> = Vec::new();

    if let Some(ref ip) = ip_filter {
        if !ip.is_empty() {
            clauses.push("ip LIKE ?".to_string());
            params.push(format!("%{}%", ip).into());
        }
    }

    if let Some(ref segment) = segment_filter {
        if !segment.is_empty() {
            clauses.push("segment = ?".to_string());
            params.push(segment.clone().into());
        }
    }

    let where_sql = clauses.join(" AND ");

    // Get total count
    let count_query = format!(
        "SELECT COUNT(*) FROM active_path_ip_aggregations WHERE {}",
        where_sql
    );
    let total_count: u32 = conn
        .query_row(
            &count_query,
            rusqlite::params_from_iter(params.iter()),
            |row| row.get(0),
        )
        .unwrap_or(0);

    // Get rows with pagination
    let sort_col = match sort_by.as_deref() {
        Some("hit_count") => "hit_count",
        Some("path") => "path",
        Some("ip") => "ip",
        Some("segment") => "segment",
        _ => "hit_count",
    };
    let order = if sort_order.as_deref() == Some("ascending") {
        "ASC"
    } else {
        "DESC"
    };

    let offset = (page.saturating_sub(1)) * limit;
    let query = format!(
        "SELECT path, ip, segment, hit_count FROM active_path_ip_aggregations WHERE {} ORDER BY {} {} LIMIT {} OFFSET {}",
        where_sql, sort_col, order, limit, offset
    );

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let data = stmt
        .query_map(rusqlite::params_from_iter(params.iter()), |row| {
            Ok(ActivePathIPAggregation {
                path: row.get(0)?,
                ip: row.get(1)?,
                segment: row.get(2)?,
                hit_count: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(ActivePathIPAggregationsPage { data, total_count })
}

#[tauri::command]
pub fn rebuild_path_aggregations() -> Result<(), String> {
    init_active_db()?;
    let mut lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_mut().ok_or("DB not initialized")?;

    let tx = conn.transaction().map_err(|e| e.to_string())?;
    {
        tx.execute("DELETE FROM active_path_aggregations", [])
            .map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO active_path_aggregations (path, crawler_type, segment, hit_count)
             SELECT path, crawler_type, segment, COUNT(*) 
             FROM active_parsed_logs 
             GROUP BY path, crawler_type, segment",
            [],
        )
        .map_err(|e| e.to_string())?;

        tx.execute("DELETE FROM active_path_status_aggregations", [])
            .map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO active_path_status_aggregations (path, status, segment, hit_count)
             SELECT path, status, segment, COUNT(*) 
             FROM active_parsed_logs 
             GROUP BY path, status, segment",
            [],
        )
        .map_err(|e| e.to_string())?;

        tx.execute("DELETE FROM active_path_method_aggregations", [])
            .map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO active_path_method_aggregations (path, method, segment, hit_count)
             SELECT path, method, segment, COUNT(*) 
             FROM active_parsed_logs 
             GROUP BY path, method, segment",
            [],
        )
        .map_err(|e| e.to_string())?;

        tx.execute("DELETE FROM active_path_user_agent_aggregations", [])
            .map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO active_path_user_agent_aggregations (path, user_agent, segment, hit_count)
             SELECT path, user_agent, segment, COUNT(*) 
             FROM active_parsed_logs 
             GROUP BY path, user_agent, segment",
            [],
        )
        .map_err(|e| e.to_string())?;

        tx.execute("DELETE FROM active_path_referer_aggregations", [])
            .map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO active_path_referer_aggregations (path, referer, segment, hit_count)
             SELECT path, COALESCE(referer, '-'), segment, COUNT(*) 
             FROM active_parsed_logs 
             GROUP BY path, referer, segment",
            [],
        )
        .map_err(|e| e.to_string())?;

        tx.execute("DELETE FROM active_path_browser_aggregations", [])
            .map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO active_path_browser_aggregations (path, browser, segment, hit_count)
             SELECT path, browser, segment, COUNT(*) 
             FROM active_parsed_logs 
             GROUP BY path, browser, segment",
            [],
        )
        .map_err(|e| e.to_string())?;

        tx.execute("DELETE FROM active_path_verified_aggregations", [])
            .map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO active_path_verified_aggregations (path, crawler_type, verified, segment, hit_count)
             SELECT path, crawler_type, verified, segment, COUNT(*) 
             FROM active_parsed_logs 
             GROUP BY path, crawler_type, verified, segment",
            [],
        )
        .map_err(|e| e.to_string())?;

        tx.execute("DELETE FROM active_path_ip_aggregations", [])
            .map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO active_path_ip_aggregations (path, ip, segment, hit_count)
             SELECT path, ip, segment, COUNT(*) 
             FROM active_parsed_logs 
             GROUP BY path, ip, segment",
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
#[tauri::command]
pub fn get_distinct_bot_types() -> Result<Vec<String>, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let query = "SELECT DISTINCT crawler_type FROM active_parsed_logs WHERE crawler_type != 'Human' AND crawler_type != '' ORDER BY crawler_type";
    let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;

    let bot_types: Vec<String> = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .filter(|s: &String| !s.is_empty())
        .collect();

    Ok(bot_types)
}

#[tauri::command]
pub fn clear_active_db_command() -> Result<(), String> {
    let mut lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = match lock.as_mut() {
        Some(c) => c,
        None => return Ok(()),
    };

    conn.execute("DELETE FROM active_parsed_logs", [])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM active_path_aggregations", [])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM active_path_status_aggregations", [])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM active_path_method_aggregations", [])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM active_path_user_agent_aggregations", [])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM active_path_referer_aggregations", [])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM active_path_browser_aggregations", [])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM active_path_verified_aggregations", [])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM active_path_ip_aggregations", [])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn clear_all_log_data_command() -> Result<(), String> {
    // Only clear the active session logs
    clear_active_db_command()?;
    Ok(())
}

#[derive(Serialize, Deserialize)]
pub struct PathAggregationsPage {
    pub entries: Vec<BotPathDetail>,
    pub total_unique_paths: u32,
    pub total_hits: u64,
}

#[tauri::command]
pub fn get_path_aggregations_page(
    page: u32,
    limit: u32,
    filters: ActiveFilters,
) -> Result<PathAggregationsPage, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let (where_sql, params_vec) = build_where_clause(&filters);

    // 1. Get accurate counts
    let count_query = format!(
        "SELECT COUNT(*), SUM(freq) FROM (
            SELECT COUNT(*) as freq 
            FROM active_parsed_logs 
            WHERE {} 
            GROUP BY path, crawler_type, user_agent
        )",
        where_sql
    );
    let (total_unique_paths, total_hits): (u32, u64) = conn
        .query_row(
            &count_query,
            rusqlite::params_from_iter(params_vec.iter()),
            |row| Ok((row.get::<_, u32>(0)?, row.get::<_, Option<i64>>(1)?.unwrap_or(0) as u64)),
        )
        .map_err(|e| e.to_string())?;

    // 2. Get paginated results
    let offset = (page - 1) * limit;
    let sort_col = match filters.sort_key.as_deref() {
        Some("frequency") => "frequency",
        Some("response_size") => "total_size",
        Some("timestamp") => "newest",
        Some("status") => "status",
        Some("path") => "path",
        _ => "frequency",
    };
    let sort_dir = match filters.sort_dir.as_deref() {
        Some("descending") => "DESC",
        _ => "ASC",
    };

    let query = format!(
        "
        SELECT
            path,
            COUNT(*) as frequency,
            SUM(response_size) as total_size,
            MAX(timestamp) as newest,
            MIN(timestamp) as oldest,
            file_type,
            status,
            MAX(user_agent) as ua,
            MAX(crawler_type) as ct,
            MAX(method) as m,
            MAX(verified) as v,
            MAX(ip) as ip_addr,
            GROUP_CONCAT(DISTINCT referer) as ref_str,
            MAX(browser) as br,
            MAX(country) as c
        FROM active_parsed_logs
        WHERE {}
        GROUP BY path, crawler_type, user_agent
        ORDER BY {} {}
        LIMIT {} OFFSET {}
    ",
        where_sql, sort_col, sort_dir, limit, offset
    );

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(rusqlite::params_from_iter(params_vec.iter()), |row| {
            Ok(BotPathDetail {
                path: row.get(0)?,
                frequency: row.get(1)?,
                response_size: row.get::<_, u32>(2)? as u64,
                timestamp: row.get(3)?,
                file_type: row
                    .get::<_, Option<String>>(5)?
                    .unwrap_or_else(|| "Other".to_string()),
                status: row.get::<_, Option<u16>>(6)?.unwrap_or(200),
                user_agent: row.get::<_, Option<String>>(7)?.unwrap_or_default(),
                crawler_type: row.get::<_, Option<String>>(8)?.unwrap_or_default(),
                method: row.get::<_, Option<String>>(9)?.unwrap_or_default(),
                verified: row.get::<_, Option<i32>>(10)?.unwrap_or(0) == 1,
                ip: row.get::<_, Option<String>>(11)?.unwrap_or_default(),
                referer: row.get::<_, Option<String>>(12)?.unwrap_or_default(),
                browser: row.get::<_, Option<String>>(13)?.unwrap_or_default(),
                country: row.get::<_, Option<String>>(14)?.unwrap_or_default(),
                is_crawler: true, // Marker for FE
            })
        })
        .map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }

    Ok(PathAggregationsPage {
        entries: results,
        total_unique_paths,
        total_hits,
    })
}

#[tauri::command]
pub fn get_bot_paths_aggregated(filters: ActiveFilters) -> Result<Vec<BotPathDetail>, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let (where_sql, params_vec) = build_where_clause(&filters);

    // Group by path to get total frequencies across the entire dataset
    let query = format!(
        "
        SELECT
            path,
            COUNT(*) as frequency,
            SUM(response_size) as total_size,
            MAX(timestamp) as newest,
            MIN(timestamp) as oldest,
            file_type,
            status,
            MAX(user_agent) as ua,
            MAX(crawler_type) as ct,
            MAX(method) as m,
            MAX(verified) as v,
            MAX(ip) as ip_addr,
            GROUP_CONCAT(DISTINCT referer) as ref_str,
            MAX(browser) as br,
            MAX(country) as c
        FROM active_parsed_logs
        WHERE {}
        GROUP BY path, crawler_type, user_agent
        ORDER BY frequency DESC
        LIMIT 1000
    ",
        where_sql
    );

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(rusqlite::params_from_iter(params_vec.iter()), |row| {
            Ok(BotPathDetail {
                path: row.get(0)?,
                frequency: row.get(1)?,
                response_size: row.get::<_, u32>(2)? as u64,
                timestamp: row.get(3)?, // Use newest for display
                file_type: row
                    .get::<_, Option<String>>(5)?
                    .unwrap_or_else(|| "Other".to_string()),
                status: row.get::<_, Option<u16>>(6)?.unwrap_or(200),
                user_agent: row.get::<_, Option<String>>(7)?.unwrap_or_default(),
                crawler_type: row.get::<_, Option<String>>(8)?.unwrap_or_default(),
                method: row.get::<_, Option<String>>(9)?.unwrap_or_default(),
                verified: row.get::<_, Option<i32>>(10)?.unwrap_or(0) == 1,
                ip: row.get::<_, Option<String>>(11)?.unwrap_or_default(),
                referer: row.get::<_, Option<String>>(12)?.unwrap_or_default(),
                browser: row.get::<_, Option<String>>(13)?.unwrap_or_default(),
                country: row.get::<_, Option<String>>(14)?.unwrap_or_default(),
                is_crawler: true,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }

    Ok(results)
}

#[tauri::command]
pub fn get_all_path_aggregations(filters: ActiveFilters) -> Result<Vec<BotPathDetail>, String> {
    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let (where_sql, params_vec) = build_where_clause(&filters);

    let sort_col = match filters.sort_key.as_deref() {
        Some("frequency") => "frequency",
        Some("response_size") => "total_size",
        Some("timestamp") => "newest",
        Some("status") => "status",
        Some("path") => "path",
        _ => "frequency",
    };
    let sort_dir = match filters.sort_dir.as_deref() {
        Some("descending") => "DESC",
        _ => "ASC",
    };

    // No LIMIT here because we want all found data for export
    let query = format!(
        "
        SELECT
            path,
            COUNT(*) as frequency,
            SUM(response_size) as total_size,
            MAX(timestamp) as newest,
            MIN(timestamp) as oldest,
            file_type,
            status,
            MAX(user_agent) as ua,
            MAX(crawler_type) as ct,
            MAX(method) as m,
            MAX(verified) as v,
            MAX(ip) as ip_addr,
            GROUP_CONCAT(DISTINCT referer) as ref_str,
            MAX(browser) as br,
            MAX(country) as c
        FROM active_parsed_logs
        WHERE {}
        GROUP BY path, crawler_type, user_agent
        ORDER BY {} {}
    ",
        where_sql, sort_col, sort_dir
    );

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(rusqlite::params_from_iter(params_vec.iter()), |row| {
            Ok(BotPathDetail {
                path: row.get(0)?,
                frequency: row.get(1)?,
                response_size: row.get::<_, u32>(2)? as u64,
                timestamp: row.get(3)?,
                file_type: row
                    .get::<_, Option<String>>(5)?
                    .unwrap_or_else(|| "Other".to_string()),
                status: row.get::<_, Option<u16>>(6)?.unwrap_or(200),
                user_agent: row.get::<_, Option<String>>(7)?.unwrap_or_default(),
                crawler_type: row.get::<_, Option<String>>(8)?.unwrap_or_default(),
                method: row.get::<_, Option<String>>(9)?.unwrap_or_default(),
                verified: row.get::<_, Option<i32>>(10)?.unwrap_or(0) == 1,
                ip: row.get::<_, Option<String>>(11)?.unwrap_or_default(),
                referer: row.get::<_, Option<String>>(12)?.unwrap_or_default(),
                browser: row.get::<_, Option<String>>(13)?.unwrap_or_default(),
                country: row.get::<_, Option<String>>(14)?.unwrap_or_default(),
                is_crawler: true,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }

    Ok(results)
}

use super::analyser::{BotStatsMap, LogAnalysisResult, SegmentSummary, StatusCodeCounts, Totals};

#[tauri::command]
pub fn reclassify_all_segments() -> Result<(), String> {
    init_active_db()?;
    let mut lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_mut().ok_or("DB not initialized")?;

    // Get current taxonomies from parse_logs cache
    let taxonomies = crate::loganalyser::helpers::parse_logs::get_taxonomies();

    // Sort them by path length descending to ensure most specific matches win (as in parse_log_line)
    let mut sorted_taxonomies = taxonomies.clone();
    sorted_taxonomies.sort_by(|a, b| b.path.len().cmp(&a.path.len()));

    let tx = conn.transaction().map_err(|e| e.to_string())?;
    {
        // 1. Reset all segments to 'Other'
        tx.execute("UPDATE active_parsed_logs SET segment = 'Other'", [])
            .map_err(|e| e.to_string())?;

        // 2. Apply each taxonomy in order
        // Note: Since we apply them one by one, and we want specify matches to win,
        // we should probably apply them from LEAST specific to MOST specific if we want the last win,
        // OR we just use CASE statement in one big query.
        // Given how classify_segment_name_internal works (returns first match in sorted list),
        // the big CASE statement is more accurate.

        if !sorted_taxonomies.is_empty() {
            let mut case_parts = Vec::new();
            let mut params = Vec::new();

            for taxonomy in &sorted_taxonomies {
                let (clause, pattern) = match taxonomy.match_type.as_str() {
                    "startsWith" => ("path LIKE ?", format!("{}%", taxonomy.path)),
                    "contains" => ("path LIKE ?", format!("%{}%", taxonomy.path)),
                    "exactMatch" => ("path = ?", taxonomy.path.clone()),
                    _ => ("path LIKE ?", format!("{}%", taxonomy.path)),
                };
                case_parts.push(format!("WHEN {} THEN ?", clause));
                params.push(rusqlite::types::Value::Text(pattern));
                params.push(rusqlite::types::Value::Text(taxonomy.name.clone()));
            }

            let query = format!(
                "UPDATE active_parsed_logs SET segment = CASE {} ELSE 'Other' END",
                case_parts.join(" ")
            );

            // Interleave params: pattern, name, pattern, name...
            let mut interleave_params = Vec::new();
            for i in 0..sorted_taxonomies.len() {
                interleave_params.push(params[i * 2].clone());
                interleave_params.push(params[i * 2 + 1].clone());
            }

            tx.execute(&query, rusqlite::params_from_iter(interleave_params.iter()))
                .map_err(|e| e.to_string())?;
        }
    }
    tx.commit().map_err(|e| e.to_string())?;

    println!("All entries re-classified based on new taxonomies.");
    Ok(())
}

/// Export all logs from the active database directly to an Excel file.
/// This runs entirely on the backend, avoiding IPC serialization limits.
#[tauri::command]
pub fn export_active_logs_excel(
    file_path: String,
    include_gsc: bool,
) -> Result<usize, String> {
    use rust_xlsxwriter::{Workbook, Format};

    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();
    
    // Optional: create a bold format for headers
    let header_format = Format::new().set_bold();

    // Write header row
    let mut headers = vec![
        "IP", "Country", "Browser", "Timestamp", "Method", "Path",
        "Segment", "Taxonomy", "File Type", "Status Code", "Response Size",
        "User Agent", "Referer", "Crawler Type", "Is Crawler", "Verified", "Filename",
    ];
    if include_gsc {
        headers.extend_from_slice(&["Position", "Clicks", "Impressions", "CTR", "GSC URL"]);
    }

    for (col, header) in headers.iter().enumerate() {
        worksheet.write_string_with_format(0, col as u16, *header, &header_format)
            .map_err(|e| e.to_string())?;
    }

    // Query all rows (no LIMIT) ordered by timestamp
    let query = "SELECT ip, country, browser, timestamp, method, path, \
                 segment, taxonomy, file_type, status, response_size, \
                 user_agent, referer, crawler_type, is_crawler, verified, filename, \
                 position, clicks, impressions, ctr, gsc_url \
                 FROM active_parsed_logs ORDER BY timestamp ASC";

    let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    let mut total_exported: usize = 0;
    let mut row_idx = 1;

    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let ip: String = row.get::<_, Option<String>>(0).unwrap_or(None).unwrap_or_default();
        let country: String = row.get::<_, Option<String>>(1).unwrap_or(None).unwrap_or_default();
        let browser: String = row.get::<_, Option<String>>(2).unwrap_or(None).unwrap_or_default();
        let timestamp: String = row.get::<_, Option<String>>(3).unwrap_or(None).unwrap_or_default();
        let method: String = row.get::<_, Option<String>>(4).unwrap_or(None).unwrap_or_default();
        let path: String = row.get::<_, Option<String>>(5).unwrap_or(None).unwrap_or_default();
        let segment: String = row.get::<_, Option<String>>(6).unwrap_or(None).unwrap_or_default();
        let taxonomy: String = row.get::<_, Option<String>>(7).unwrap_or(None).unwrap_or_default();
        let file_type: String = row.get::<_, Option<String>>(8).unwrap_or(None).unwrap_or_default();
        let status: i64 = row.get::<_, Option<i64>>(9).unwrap_or(None).unwrap_or(0);
        let response_size: i64 = row.get::<_, Option<i64>>(10).unwrap_or(None).unwrap_or(0);
        let user_agent: String = row.get::<_, Option<String>>(11).unwrap_or(None).unwrap_or_default();
        let referer: String = row.get::<_, Option<String>>(12).unwrap_or(None).unwrap_or("-".to_string());
        let crawler_type: String = row.get::<_, Option<String>>(13).unwrap_or(None).unwrap_or_default();
        let is_crawler: bool = row.get::<_, Option<bool>>(14).unwrap_or(None).unwrap_or(false);
        let verified: bool = row.get::<_, Option<bool>>(15).unwrap_or(None).unwrap_or(false);
        let filename: String = row.get::<_, Option<String>>(16).unwrap_or(None).unwrap_or_default();

        // Format response size for human readability
        let response_size_str = if response_size < 1024 {
            format!("{} B", response_size)
        } else if response_size < 1024 * 1024 {
            format!("{:.1} KB", response_size as f64 / 1024.0)
        } else {
            format!("{:.1} MB", response_size as f64 / (1024.0 * 1024.0))
        };

        let row_values = vec![
            ip, country, browser, timestamp, method, path,
            segment, taxonomy, file_type, status.to_string(), response_size_str,
            user_agent, referer, crawler_type, 
            if is_crawler { "true".to_string() } else { "false".to_string() },
            if verified { "true".to_string() } else { "false".to_string() },
            filename,
        ];

        let mut col_idx = 0;
        for val in &row_values {
            worksheet.write_string(row_idx, col_idx, val).map_err(|e| e.to_string())?;
            col_idx += 1;
        }

        if include_gsc {
            let position: String = row.get::<_, Option<i32>>(17)
                .unwrap_or(None)
                .map(|v| v.to_string())
                .unwrap_or_default();
            let clicks: String = row.get::<_, Option<i32>>(18)
                .unwrap_or(None)
                .map(|v| v.to_string())
                .unwrap_or_default();
            let impressions: String = row.get::<_, Option<i32>>(19)
                .unwrap_or(None)
                .map(|v| v.to_string())
                .unwrap_or_default();
            let ctr: String = row.get::<_, Option<f64>>(20)
                .unwrap_or(None)
                .map(|v| format!("{:.2}%", v * 100.0))
                .unwrap_or_default();
            let gsc_url: String = row.get::<_, Option<String>>(21)
                .unwrap_or(None)
                .unwrap_or_default();

            worksheet.write_string(row_idx, col_idx, &position).map_err(|e| e.to_string())?; col_idx += 1;
            worksheet.write_string(row_idx, col_idx, &clicks).map_err(|e| e.to_string())?; col_idx += 1;
            worksheet.write_string(row_idx, col_idx, &impressions).map_err(|e| e.to_string())?; col_idx += 1;
            worksheet.write_string(row_idx, col_idx, &ctr).map_err(|e| e.to_string())?; col_idx += 1;
            worksheet.write_string(row_idx, col_idx, &gsc_url).map_err(|e| e.to_string())?;
        }

        row_idx += 1;
        total_exported += 1;
    }

    workbook.save(&file_path).map_err(|e| e.to_string())?;

    Ok(total_exported)
}

/// Export all logs from the active database directly to a CSV file.
/// This runs entirely on the backend, bypassing Excel row limits.
#[tauri::command]
pub fn export_active_logs_csv(
    file_path: String,
    include_gsc: bool,
) -> Result<usize, String> {
    use csv::Writer;

    init_active_db()?;
    let lock = DB_CONN.lock().map_err(|e| e.to_string())?;
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let mut wtr = Writer::from_path(&file_path).map_err(|e| e.to_string())?;

    // Write header row
    let mut headers = vec![
        "IP", "Country", "Browser", "Timestamp", "Method", "Path",
        "Segment", "Taxonomy", "File Type", "Status Code", "Response Size",
        "User Agent", "Referer", "Crawler Type", "Is Crawler", "Verified", "Filename",
    ];
    if include_gsc {
        headers.extend_from_slice(&["Position", "Clicks", "Impressions", "CTR", "GSC URL"]);
    }
    wtr.write_record(&headers).map_err(|e| e.to_string())?;

    // Query all rows
    let query = "SELECT ip, country, browser, timestamp, method, path, \
                 segment, taxonomy, file_type, status, response_size, \
                 user_agent, referer, crawler_type, is_crawler, verified, filename, \
                 position, clicks, impressions, ctr, gsc_url \
                 FROM active_parsed_logs ORDER BY timestamp ASC";

    let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    let mut total_exported: usize = 0;

    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let ip: String = row.get::<_, Option<String>>(0).unwrap_or(None).unwrap_or_default();
        let country: String = row.get::<_, Option<String>>(1).unwrap_or(None).unwrap_or_default();
        let browser: String = row.get::<_, Option<String>>(2).unwrap_or(None).unwrap_or_default();
        let timestamp: String = row.get::<_, Option<String>>(3).unwrap_or(None).unwrap_or_default();
        let method: String = row.get::<_, Option<String>>(4).unwrap_or(None).unwrap_or_default();
        let path: String = row.get::<_, Option<String>>(5).unwrap_or(None).unwrap_or_default();
        let segment: String = row.get::<_, Option<String>>(6).unwrap_or(None).unwrap_or_default();
        let taxonomy: String = row.get::<_, Option<String>>(7).unwrap_or(None).unwrap_or_default();
        let file_type: String = row.get::<_, Option<String>>(8).unwrap_or(None).unwrap_or_default();
        let status: i64 = row.get::<_, Option<i64>>(9).unwrap_or(None).unwrap_or(0);
        let response_size: i64 = row.get::<_, Option<i64>>(10).unwrap_or(None).unwrap_or(0);
        let user_agent: String = row.get::<_, Option<String>>(11).unwrap_or(None).unwrap_or_default();
        let referer: String = row.get::<_, Option<String>>(12).unwrap_or(None).unwrap_or("-".to_string());
        let crawler_type: String = row.get::<_, Option<String>>(13).unwrap_or(None).unwrap_or_default();
        let is_crawler: bool = row.get::<_, Option<bool>>(14).unwrap_or(None).unwrap_or(false);
        let verified: bool = row.get::<_, Option<bool>>(15).unwrap_or(None).unwrap_or(false);
        let filename: String = row.get::<_, Option<String>>(16).unwrap_or(None).unwrap_or_default();

        let response_size_str = if response_size < 1024 {
            format!("{} B", response_size)
        } else if response_size < 1024 * 1024 {
            format!("{:.1} KB", response_size as f64 / 1024.0)
        } else {
            format!("{:.1} MB", response_size as f64 / (1024.0 * 1024.0))
        };

        let mut row_record = vec![
            ip, country, browser, timestamp, method, path,
            segment, taxonomy, file_type, status.to_string(), response_size_str,
            user_agent, referer, crawler_type,
            if is_crawler { "true".to_string() } else { "false".to_string() },
            if verified { "true".to_string() } else { "false".to_string() },
            filename,
        ];

        if include_gsc {
            let position: String = row.get::<_, Option<i32>>(17)
                .unwrap_or(None)
                .map(|v| v.to_string())
                .unwrap_or_default();
            let clicks: String = row.get::<_, Option<i32>>(18)
                .unwrap_or(None)
                .map(|v| v.to_string())
                .unwrap_or_default();
            let impressions: String = row.get::<_, Option<i32>>(19)
                .unwrap_or(None)
                .map(|v| v.to_string())
                .unwrap_or_default();
            let ctr: String = row.get::<_, Option<f64>>(20)
                .unwrap_or(None)
                .map(|v| format!("{:.2}%", v * 100.0))
                .unwrap_or_default();
            let gsc_url: String = row.get::<_, Option<String>>(21)
                .unwrap_or(None)
                .unwrap_or_default();

            row_record.push(position);
            row_record.push(clicks);
            row_record.push(impressions);
            row_record.push(ctr);
            row_record.push(gsc_url);
        }

        wtr.write_record(&row_record).map_err(|e| e.to_string())?;
        total_exported += 1;
    }

    wtr.flush().map_err(|e| e.to_string())?;
    Ok(total_exported)
}

