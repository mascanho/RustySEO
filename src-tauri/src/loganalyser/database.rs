use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::crawler::db::open_db_connection;

use super::analyser::{LogAnalysisResult, LogInput};

#[derive(Serialize, Deserialize, Debug)]
pub struct DatabaseResults {
    pub id: i32,
    pub date: String,
    pub filename: String,
    pub log: serde_json::Value,
}

pub struct Database {
    conn: Connection,
    db_name: String,
}

impl Database {
    pub fn new(db_name: &str) -> Result<Self, String> {
        let conn = open_db_connection(db_name).map_err(|e| e.to_string())?;

        // Create the table if it doesn't exist
        conn.execute(
            "CREATE TABLE IF NOT EXISTS server_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                filename TEXT NOT NULL,
                log TEXT NOT NULL
            )",
            [], // no params
        )
        .map_err(|e| e.to_string())?;

        Ok(Self {
            conn,
            db_name: db_name.to_string(),
        })
    }
}

// CREATE THE DB
pub fn create_serverlog_db(db_name: &str) {
    if let Err(e) = Database::new(db_name) {
        eprintln!("Failed to create server log database: {}", e);
    }
}

// ADD LOGS TO THE DB
pub fn add_data_to_serverlog_db(db_name: &str, data: &LogInput) {
    let today_date = chrono::Utc::now().to_rfc3339().to_string();
    let mut db = Database::new(db_name).unwrap();

    let tx = db.conn.transaction().unwrap(); // Start transaction

    for (filename, content) in &data.log_contents {
        if let Err(e) = tx.execute(
            "INSERT INTO server_logs (date, filename, log) VALUES (?1, ?2, ?3)",
            params![
                today_date,
                filename,
                serde_json::to_string(&content).unwrap()
            ],
        ) {
            eprintln!("Failed to insert log: {}", e);
            tx.rollback().unwrap();
            return;
        }
    }

    tx.commit().unwrap();
}

// REMOVE ALL THE LOGS
#[tauri::command]
pub fn remove_all_logs_from_serverlog_db(db_name: &str) {
    let db = Database::new(db_name).unwrap();
    let _ = db.conn.execute("DELETE FROM server_logs", []);
}

pub fn remove_item_from_serverlog_db(db_name: &str, date: &str) {
    let db = Database::new(db_name).unwrap();
    let _ = db
        .conn
        .execute("DELETE FROM server_logs WHERE date = ?1", params![date]);
}

// GET A LIST OF ALL THE ENTRIES INSIDE THE TABLE
#[tauri::command]
pub fn read_logs_from_db() -> Result<Vec<LogMetadata>, String> {
    let db = Database::new("serverlog.db").map_err(|e| e.to_string())?;
    let mut stmt = db
        .conn
        .prepare("SELECT id, date, filename FROM server_logs") // Only select needed columns
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(LogMetadata {
                id: row.get(0)?,
                date: row.get(1)?,
                filename: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }

    Ok(results)
}

#[derive(Debug, serde::Serialize)]
pub struct LogMetadata {
    pub id: i64,
    pub date: String,
    pub filename: String,
}
// DELETE A SPECIFIC LOG USING THE ID
#[tauri::command]
pub fn delete_log_from_db(id: i32) {
    let db = Database::new("serverlog.db").unwrap();
    let _ = db
        .conn
        .execute("DELETE FROM server_logs WHERE id = ?1", params![id]);
}
