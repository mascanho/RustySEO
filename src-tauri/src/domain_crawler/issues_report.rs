use directories::ProjectDirs;
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;

fn open_issues_db_connection() -> Result<Connection> {
    let project_dirs =
        ProjectDirs::from("", "", "rustyseo").expect("Error creating directory for DB");
    let db_dir = project_dirs.data_dir().join("db");

    if !db_dir.exists() {
        std::fs::create_dir_all(&db_dir).expect("Failed to create directory");
    }

    let db_path = db_dir.join("issues_reports.db");
    tracing::info!("Opening issues reports db at {:?}", db_path);

    Connection::open(db_path)
}

fn ensure_table(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS crawl_issues_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            domain TEXT NOT NULL,
            crawl_date TEXT NOT NULL DEFAULT (datetime('now')),
            total_urls_crawled INTEGER NOT NULL DEFAULT 0,
            total_issues_found INTEGER NOT NULL DEFAULT 0,
            report_json TEXT NOT NULL
        )",
        [],
    )?;
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IssuesReportRecord {
    pub id: i64,
    pub domain: String,
    pub crawl_date: String,
    pub total_urls_crawled: i64,
    pub total_issues_found: i64,
    pub report_json: Value,
}

#[tauri::command]
pub fn store_issues_report(
    domain: String,
    total_urls_crawled: i64,
    total_issues_found: i64,
    report_json: Value,
) -> Result<i64, String> {
    let conn = open_issues_db_connection().map_err(|e| e.to_string())?;
    ensure_table(&conn).map_err(|e| e.to_string())?;

    let json_str = serde_json::to_string(&report_json).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO crawl_issues_reports (domain, total_urls_crawled, total_issues_found, report_json)
         VALUES (?1, ?2, ?3, ?4)",
        params![domain, total_urls_crawled, total_issues_found, json_str],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    tracing::info!("Stored issues report id={} for domain={}", id, domain);

    Ok(id)
}

#[tauri::command]
pub fn get_issues_reports() -> Result<Vec<IssuesReportRecord>, String> {
    let conn = open_issues_db_connection().map_err(|e| e.to_string())?;
    ensure_table(&conn).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, domain, crawl_date, total_urls_crawled, total_issues_found, report_json
             FROM crawl_issues_reports
             ORDER BY id DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            let json_str: String = row.get(5)?;
            let report_json: Value =
                serde_json::from_str(&json_str).unwrap_or(Value::Null);

            Ok(IssuesReportRecord {
                id: row.get(0)?,
                domain: row.get(1)?,
                crawl_date: row.get(2)?,
                total_urls_crawled: row.get(3)?,
                total_issues_found: row.get(4)?,
                report_json,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }

    Ok(results)
}
