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
                date TEXT NOT NULL
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

// ADD LOGS TO THE DB
pub fn add_data_to_serverlog_db(db_name: &str, data: &LogInput, project: &str) {
    let today_date = chrono::Utc::now().to_rfc3339().to_string();
    let mut db = Database::new(db_name).unwrap();

    let tx = db.conn.transaction().unwrap(); // Start transaction

    for (filename, content) in &data.log_contents {
        if let Err(e) = tx.execute(
            "INSERT INTO server_logs (date, project, filename, log) VALUES (?1, ?2, ?3, ?4)",
            params![
                today_date,
                project,
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
}

// PROJECTS GO HERE
// Project-related functions
#[tauri::command]
pub fn create_project_command(name: &str) -> Result<(), String> {
    // Validate input first
    if name.trim().is_empty() {
        return Err("Project name cannot be empty".to_string());
    }

    // Initialize database (this creates tables if they don't exist)
    let db = Database::new("serverlog.db")
        .map_err(|e| format!("Database initialization failed: {}", e))?;

    let now = chrono::Utc::now().to_rfc3339();

    // Insert project with proper error handling
    match db.conn.execute(
        "INSERT INTO projects (name, date) VALUES (?1, ?2)",
        params![name, now],
    ) {
        Ok(_) => Ok(()),
        Err(e) => {
            if e.to_string().contains("UNIQUE constraint failed") {
                Err(format!("Project '{}' already exists", name))
            } else {
                Err(format!("Failed to create project: {}", e))
            }
        }
    }
}

// GET ALL THE PROJECTS INSIDE THE DB

#[tauri::command]
pub fn get_all_projects_command() -> Result<Vec<Project>, String> {
    // Initialize database
    let db = Database::new("serverlog.db")
        .map_err(|e| format!("Database initialization failed: {}", e))?;

    // Prepare the query to fetch all projects from the projects table
    let mut stmt = db
        .conn
        .prepare("SELECT id, name FROM projects")
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    // Execute the query and map the results
    let projects = stmt
        .query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
            })
        })
        .map_err(|e| format!("Query execution failed: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Result collection failed: {}", e))?;

    Ok(projects)
}

// FIND THE LOGS WITH THE PROJECT NAME
#[tauri::command]
pub fn get_logs_by_project_name_command(project: &str) -> Result<Vec<DatabaseResults>, String> {
    // Initialize database (creates tables if needed)
    let db = Database::new("serverlog.db")
        .map_err(|e| format!("Database initialization failed: {}", e))?;

    let mut stmt = db
        .conn
        .prepare("SELECT id, date, filename, log FROM server_logs WHERE project = ?1")
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let logs = stmt
        .query_map([project], |row| {
            let log_text: String = row.get(3)?;
            let log_value: serde_json::Value = serde_json::from_str(&log_text).map_err(|e| {
                rusqlite::Error::FromSqlConversionFailure(
                    3,
                    rusqlite::types::Type::Text,
                    Box::new(e),
                )
            })?;

            Ok(DatabaseResults {
                id: row.get(0)?,
                date: row.get(1)?,
                project: project.to_string(),
                filename: row.get(2)?,
                log: log_value,
            })
        })
        .map_err(|e| format!("Query execution failed: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Result collection failed: {}", e))?;

    Ok(logs)
}
