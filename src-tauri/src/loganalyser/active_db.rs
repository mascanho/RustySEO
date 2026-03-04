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
        
        DROP TABLE IF EXISTS active_parsed_logs;
        CREATE TABLE active_parsed_logs (
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
        CREATE INDEX idx_timestamp ON active_parsed_logs(timestamp);
        CREATE INDEX idx_status ON active_parsed_logs(status);
        CREATE INDEX idx_crawler ON active_parsed_logs(is_crawler, crawler_type);
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
        }
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
        "SELECT * FROM active_parsed_logs WHERE {} {}",
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
