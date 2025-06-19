use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{Emitter, Window};

use crate::{
    crawler::db::open_db_connection,
    loganalyser::{analyser::analyse_log, log_commands::check_logs_command},
};

use super::analyser::{LogAnalysisResult, LogInput};

#[derive(Serialize, Deserialize, Debug)]
pub struct DatabaseResults {
    pub id: i32,
    pub date: String,
    pub project: String,
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
                project TEXT NOT NULL,
                filename TEXT NOT NULL,
                log TEXT NOT NULL
            )",
            [], // no params
        )
        .map_err(|e| e.to_string())?;

     conn.execute(
            "CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                created_date TEXT NOT NULL,
                last_accessed_date TEXT NOT NULL
            )",
            [],
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

// CREATE THE PROJECT IN DB
pub fn create_project_in_db(db_name: &str, project_name: &str) {

    // CREATE THE DB IF IT DOESN'T EXIST
    

    let db = Database::new(db_name).unwrap();
    if let Err(e) = db.conn.execute(
        "INSERT INTO server_logs (date, project, filename, log) VALUES (?1, ?2, ?3, ?4)",
        params!["none", project_name, "none", "none"],
    ) {
        eprintln!("Failed to insert project into server_logs: {}", e);
    }
}

// ADD LOGS TO THE DB
pub fn add_data_to_serverlog_db(db_name: &str, data: &LogInput) {
    let today_date = chrono::Utc::now().to_rfc3339().to_string();
    let mut db = Database::new(db_name).unwrap();

    let tx = db.conn.transaction().unwrap(); // Start transaction

    for (filename, content) in &data.log_contents {
        if let Err(e) = tx.execute(
            "INSERT INTO server_logs (date, project, filename, log) VALUES (?1, ?2, ?3, ?4)",
            params![
                today_date,
                "none".to_string(),
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

#[derive(Serialize, Deserialize)]
pub struct StoredLogsData {
    pub id: i64,
    pub date: String,
    pub filename: String,
    pub log: String,
}

// Get the logs, convert them from strings and store them in a vec
#[tauri::command]
pub fn get_stored_logs_command(window: Window) -> Result<(), String> {
    let db = Database::new("serverlog.db").map_err(|e| e.to_string())?;
    let mut stmt = db
        .conn
        .prepare("SELECT id, date, filename, log FROM server_logs")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(StoredLogsData {
                id: row.get(0)?,
                date: row.get(1)?,
                filename: row.get(2)?,
                log: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    for row in rows {
        let log_data = row.map_err(|e| e.to_string())?;
        let log_json: serde_json::Value =
            serde_json::from_str(&log_data.log).map_err(|e| e.to_string())?;

        println!(
            "Log ID: {}, Date: {}, Filename: {}",
            log_data.id, log_data.date, log_data.filename
        );

        // Emit the log as an event
        window
            .emit("log-stream", &log_json)
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}


#[derive(Serialize, Deserialize, Debug)]
pub struct Project {
    pub id: i32,
    pub name: String,
    pub created_date: String,
    pub last_accessed_date: String,
}

// Project-related functions
pub fn create_project(conn: &Connection, name: &str) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO projects (name, created_date, last_accessed_date) VALUES (?1, ?2, ?3)",
        params![name, now, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_all_projects(conn: &Connection) -> Result<Vec<Project>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, created_date, last_accessed_date FROM projects")
        .map_err(|e| e.to_string())?;

    let projects = stmt
        .query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                created_date: row.get(2)?,
                last_accessed_date: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(projects)
}

pub fn update_project_access_time(conn: &Connection, project_id: i32) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE projects SET last_accessed_date = ?1 WHERE id = ?2",
        params![now, project_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_project(conn: &Connection, project_id: i32) -> Result<(), String> {
    // First delete all logs associated with this project
    conn.execute(
        "DELETE FROM server_logs WHERE project = (SELECT name FROM projects WHERE id = ?1)",
        params![project_id],
    )
    .map_err(|e| e.to_string())?;

    // Then delete the project itself
    conn.execute("DELETE FROM projects WHERE id = ?1", params![project_id])
        .map_err(|e| e.to_string())?;

    Ok(())
}