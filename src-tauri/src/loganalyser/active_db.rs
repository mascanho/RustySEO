use crate::loganalyser::analyser::LogEntry;
use directories::ProjectDirs;
use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
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
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

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
        CREATE INDEX IF NOT EXISTS idx_timestamp ON active_parsed_logs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_status ON active_parsed_logs(status);
        CREATE INDEX IF NOT EXISTS idx_crawler ON active_parsed_logs(is_crawler, crawler_type);
        ",
    )
    .map_err(|e| e.to_string())?;

    let mut lock = DB_CONN.lock().unwrap();
    *lock = Some(conn);
    Ok(())
}

pub fn insert_active_logs_batch(entries: &[LogEntry]) -> Result<(), String> {
    let mut lock = DB_CONN.lock().unwrap();
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
        }
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ActiveFilters {
    pub search_term: String,
    pub status_filter: Vec<u16>,
    pub method_filter: Vec<String>,
    pub file_type_filter: Vec<String>,
    pub bot_filter: Option<String>,
    pub bot_type_filter: Option<String>,
    pub crawler_type_filter: Option<String>,
    pub verified_filter: Option<bool>,
    pub sort_key: Option<String>,
    pub sort_dir: Option<String>,
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
        let ct_pattern = format!("%{}%", crawler_type.to_lowercase());
        clauses.push("LOWER(crawler_type) LIKE ?".to_string());
        params.push(ct_pattern.into());
    }

    if let Some(verified) = filters.verified_filter {
        clauses.push("verified = ?".to_string());
        params.push(verified.into());
    }

    (clauses.join(" AND "), params)
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
    let mut lock = DB_CONN.lock().unwrap();
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
    let mut lock = DB_CONN.lock().unwrap();
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

    let query = format!(
        "SELECT * FROM active_parsed_logs WHERE {} {} LIMIT 100000",
        where_sql, order_sql
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
    let mut lock = DB_CONN.lock().unwrap();
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
    let mut lock = DB_CONN.lock().unwrap();
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
    let mut lock = DB_CONN.lock().unwrap();
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
}

#[tauri::command]
pub fn get_widget_aggregations(filters: ActiveFilters) -> Result<WidgetAggregations, String> {
    let mut lock = DB_CONN.lock().unwrap();
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    let (where_sql, params_vec) = build_where_clause(&filters);

    let query = format!(
        "SELECT file_type, taxonomy, status, user_agent, referer FROM active_parsed_logs WHERE {}",
        where_sql
    );
    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let mut aggs = WidgetAggregations::default();

    let mut rows = stmt
        .query(rusqlite::params_from_iter(params_vec.iter()))
        .map_err(|e| e.to_string())?;

    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let ft: Option<String> = row.get(0).unwrap_or(None);
        let tax: Option<String> = row.get(1).unwrap_or(None);
        let st: Option<u16> = row.get(2).unwrap_or(None);
        let ua: Option<String> = row.get(3).unwrap_or(None);
        let ref_str: Option<String> = row.get(4).unwrap_or(None);

        *aggs
            .file_types
            .entry(ft.unwrap_or_else(|| "Other".to_string()))
            .or_insert(0) += 1;
        *aggs
            .content
            .entry(tax.unwrap_or_else(|| "other".to_string()))
            .or_insert(0) += 1;

        if let Some(s) = st {
            if s > 0 {
                *aggs.status_codes.entry(s).or_insert(0) += 1;
            }
        }

        *aggs
            .user_agents
            .entry(ua.unwrap_or_else(|| "Unknown".to_string()))
            .or_insert(0) += 1;
        *aggs
            .referrers
            .entry(ref_str.unwrap_or_else(|| "Direct/None".to_string()))
            .or_insert(0) += 1;
    }

    Ok(aggs)
}

#[tauri::command]
pub fn get_active_logs_stats() -> Result<LogAnalysisResult, String> {
    let mut lock = DB_CONN.lock().unwrap();
    let conn = lock.as_ref().ok_or("DB not initialized")?;

    // Get total count, crawler count, unique IPs and UAs
    let mut stmt = conn
        .prepare(
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
    ",
        )
        .map_err(|e| e.to_string())?;

    let (total_count, crawler_count, unique_ips, unique_uas, success_count, start_time, end_time): (i64, Option<i64>, i64, i64, Option<i64>, Option<String>, Option<String>) = stmt.query_row([], |row| {
        Ok((
            row.get(0)?,
            row.get(1)?,
            row.get(2)?,
            row.get(3)?,
            row.get(4)?,
            row.get(5)?,
            row.get(6)?,
        ))
    }).map_err(|e| e.to_string())?;

    let total_count = total_count as usize;
    let crawler_count = crawler_count.unwrap_or(0) as usize;
    let unique_ips = unique_ips as usize;
    let unique_user_agents = unique_uas as usize;
    let success_count = success_count.unwrap_or(0) as usize;
    let log_start_time = start_time.unwrap_or_default();
    let log_finish_time = end_time.unwrap_or_default();

    // Get Status Code Counts
    let mut status_stmt = conn
        .prepare("SELECT status, COUNT(*) FROM active_parsed_logs GROUP BY status")
        .map_err(|e| e.to_string())?;
    let mut status_codes = StatusCodeCounts::new();
    let status_rows = status_stmt
        .query_map([], |row| {
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

    let mut bot_stmt = conn
        .prepare(
            "
        SELECT 
            LOWER(crawler_type), 
            COUNT(*) 
        FROM active_parsed_logs 
        WHERE crawler_type != 'Human'
        GROUP BY LOWER(crawler_type)
    ",
        )
        .map_err(|e| e.to_string())?;

    let bot_rows = bot_stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, usize>(1)?))
        })
        .map_err(|e| e.to_string())?;

    for row in bot_rows {
        let (crawler, count) = row.map_err(|e| e.to_string())?;
        if crawler.contains("google") {
            bot_totals.google = count;
        } else if crawler.contains("bing") {
            bot_totals.bing = count;
        } else if crawler.contains("semrush") {
            bot_totals.semrush = count;
        } else if crawler.contains("hrefs") {
            bot_totals.hrefs = count;
        } else if crawler.contains("moz") {
            bot_totals.moz = count;
        } else if crawler.contains("uptime") {
            bot_totals.uptime = count;
        } else if crawler.contains("openai") || crawler.contains("gpt") {
            bot_totals.openai = count;
        } else if crawler.contains("claude") {
            bot_totals.claude = count;
        }
    }

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
#[tauri::command]
pub fn get_distinct_bot_types() -> Result<Vec<String>, String> {
    let mut lock = DB_CONN.lock().unwrap();
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
    let mut lock = DB_CONN.lock().unwrap();
    let conn = match lock.as_mut() {
        Some(c) => c,
        None => return Ok(()),
    };

    conn.execute("DELETE FROM active_parsed_logs", [])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn clear_all_log_data_command() -> Result<(), String> {
    // Only clear the active session logs
    clear_active_db_command()?;
    Ok(())
}

use super::analyser::{BotStatsMap, LogAnalysisResult, SegmentSummary, StatusCodeCounts, Totals};
