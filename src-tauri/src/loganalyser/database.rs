use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::crawler::db::open_db_connection;

use super::analyser::{LogAnalysisResult, LogInput};

#[derive(Serialize, Deserialize, Debug)]
pub struct DatabaseResults {
    pub id: i32,
    pub date: String,
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

pub fn create_serverlog_db(db_name: &str) {
    if let Err(e) = Database::new(db_name) {
        eprintln!("Failed to create server log database: {}", e);
    }
}

pub fn add_data_to_serverlog_db(db_name: &str, data: &LogInput) {
    let today_date = chrono::Utc::today().format("%Y-%m-%d").to_string();
    let db = Database::new(db_name).unwrap();

    for log in &data.log_contents {
        let _ = db.conn.execute(
            "INSERT INTO server_logs (date, log_name, log) VALUES (?1, ?2)",
            params![today_date, serde_json::to_string(&log).unwrap()],
        );
    }
}

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
