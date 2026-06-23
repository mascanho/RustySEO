use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{Emitter, Window};

use crate::{
    crawler::db::open_db_connection,
    loganalyser::analyser::analyse_log_from_paths,
    settings,
};

use super::analyser::LogInput;

#[derive(Serialize, Deserialize, Debug)]
pub struct DatabaseResults {
    pub id: i32,
    pub date: String,
    pub project: String,
    pub filename: String,
    // pub log: serde_json::Value,
}

pub struct Database {
    pub conn: Connection,
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
    let mut db = match Database::new(db_name) {
        Ok(db) => db,
        Err(e) => {
            eprintln!("Failed to open database {}: {}", db_name, e);
            return;
        }
    };

    let tx = match db.conn.transaction() {
        Ok(tx) => tx,
        Err(e) => {
            eprintln!("Failed to start transaction: {}", e);
            return;
        }
    };

    for (filename, content) in &data.log_contents {
        if let Err(e) = tx.execute(
            "INSERT INTO server_logs (date, project, filename, log) VALUES (?1, ?2, ?3, ?4)",
            params![
                today_date,
                project,
                filename,
                content // Raw text, no JSON encoding
            ],
        ) {
            eprintln!("Failed to insert log: {}", e);
            let _ = tx.rollback();
            return;
        }
    }

    let _ = tx.commit();
}

// REMOVE ALL THE LOGS
#[tauri::command]
pub fn remove_all_logs_from_serverlog_db(db_name: &str) {
    if let Ok(db) = Database::new(db_name) {
        let _ = db.conn.execute("DELETE FROM server_logs", []);
    }
}

pub fn remove_item_from_serverlog_db(db_name: &str, date: &str) {
    if let Ok(db) = Database::new(db_name) {
        let _ = db
            .conn
            .execute("DELETE FROM server_logs WHERE date = ?1", params![date]);
    }
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
    if let Ok(db) = Database::new("serverlog.db") {
        let _ = db
            .conn
            .execute("DELETE FROM server_logs WHERE id = ?1", params![id]);
    }
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
        // Content is now raw text, no need to parse as JSON
        let log_content = log_data.log;
        let log_json = serde_json::Value::String(log_content);

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
    pub date: String,
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
        .prepare("SELECT id, name, date FROM projects")
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    // Execute the query and map the results
    let projects = stmt
        .query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                date: row.get(2)?,
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
        .prepare("SELECT id, date, filename FROM server_logs WHERE project = ?1")
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let logs = stmt
        .query_map([project], |row| {
            Ok(DatabaseResults {
                id: row.get(0)?,
                date: row.get(1)?,
                project: project.to_string(),
                filename: row.get(2)?,
            })
        })
        .map_err(|e| format!("Query execution failed: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Result collection failed: {}", e))?;

    Ok(logs)
}

// GET THE LOGS FROM THE PROJECTS TO BE Processed
#[derive(Serialize, Deserialize, Debug)]
pub struct SelectedLogs {
    pub id: i32,
    pub date: String,
    pub project: String,
    pub filename: String,
    pub log: serde_json::Value,
}

#[tauri::command]
pub async fn get_logs_by_project_name_for_processing_command(
    project: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // NOTE: set the number of logs to stream to the front end
    let log_capacity = settings::settings::load_settings().await?.log_capacity;
    println!("Log capacity: {}", log_capacity);

    // Move all database operations to a blocking thread
    let logs_result = tokio::task::spawn_blocking(move || {
        let db = Database::new("serverlog.db")
            .map_err(|e| format!("Database initialization failed: {}", e))?;

        let mut stmt = db
            .conn
            .prepare("SELECT id, date, project, filename, log FROM server_logs WHERE project = ?1")
            .map_err(|e| format!("Failed to prepare query: {}", e))?;

        let mut rows = stmt
            .query([project.as_str()])
            .map_err(|e| format!("Query execution failed: {}", e))?;

        let mut batch = Vec::with_capacity(log_capacity);
        let mut all_logs = Vec::new();

        while let Some(row) = rows.next().map_err(|e| format!("Row error: {}", e))? {
            let id = row
                .get::<_, i32>(0)
                .map_err(|e| format!("Failed to get id: {}", e))?;
            let date = row
                .get::<_, String>(1)
                .map_err(|e| format!("Failed to get date: {}", e))?;
            let project = row
                .get::<_, String>(2)
                .map_err(|e| format!("Failed to get project: {}", e))?;
            let filename = row
                .get::<_, String>(3)
                .map_err(|e| format!("Failed to get filename: {}", e))?;
            let log_text = row
                .get::<_, String>(4)
                .map_err(|e| format!("Failed to get log text: {}", e))?;

            // Content is now raw text
            let log_value = Value::String(log_text);

            batch.push(SelectedLogs {
                id,
                date,
                project,
                filename,
                log: log_value,
            });

            if batch.len() >= log_capacity {
                all_logs.push(batch);
                batch = Vec::with_capacity(log_capacity);
            }
        }

        if !batch.is_empty() {
            all_logs.push(batch);
        }

        Ok::<_, String>(all_logs)
    })
    .await
    .map_err(|e| format!("Blocking task failed: {}", e))??;

    // Emit batches from the async context
    for batch in logs_result {
        app_handle
            .emit("project-logs-batch", &batch)
            .map_err(|e| format!("Failed to emit batch: {}", e))?;
    }

    app_handle
        .emit("project-logs-complete", true)
        .map_err(|e| format!("Failed to emit completion: {}", e))?;

    Ok(())
}

// DELETE A SPECIFIC PROJECT NAME USING THE ID
#[tauri::command]
pub fn delete_project_command(id: i32) {
    let db = Database::new("serverlog.db").unwrap();
    let _ = db
        .conn
        .execute("DELETE FROM projects WHERE id = ?1", params![id]);
}

/// Process logs from a saved project directly in Rust — no IPC round-trip.
///
/// This replaces the old flow where raw log text was:
///   1. Read from serverlog.db in Rust
///   2. Serialized and emitted to JS via IPC
///   3. Accumulated in a JS array (OOM risk)
///   4. Sent back to Rust via IPC for parsing (double serialization)
///
/// Now: DB → parse in Rust → active_logs.db → emit overview only.
#[tauri::command]
pub async fn process_project_logs_directly_command(
    project: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        let db = Database::new("serverlog.db")
            .map_err(|e| format!("Database initialization failed: {}", e))?;

        // Fetch only metadata first — no log content loaded yet
        let mut meta_stmt = db
            .conn
            .prepare("SELECT id, filename FROM server_logs WHERE project = ?1")
            .map_err(|e| format!("Failed to prepare metadata query: {}", e))?;

        let log_meta: Vec<(i64, String)> = meta_stmt
            .query_map(params![project.as_str()], |row| {
                Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))
            })
            .map_err(|e| format!("Metadata query failed: {}", e))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Metadata collection failed: {}", e))?;

        if log_meta.is_empty() {
            return Err("No logs found for this project".to_string());
        }

        println!(
            "Processing {} log file(s) for project '{}' — writing to temp files to avoid OOM",
            log_meta.len(),
            project
        );

        // Write each log to a temp file one at a time so only one log's content
        // is held in memory at a time instead of all files simultaneously.
        let temp_dir = std::env::temp_dir().join("rustyseo_project_logs");
        std::fs::create_dir_all(&temp_dir)
            .map_err(|e| format!("Failed to create temp dir: {}", e))?;

        let mut temp_paths: Vec<String> = Vec::with_capacity(log_meta.len());
        for (id, filename) in &log_meta {
            let log_text: String = db
                .conn
                .query_row(
                    "SELECT log FROM server_logs WHERE id = ?1",
                    params![id],
                    |row| row.get(0),
                )
                .map_err(|e| format!("Failed to read log id={}: {}", id, e))?;

            let safe_name = std::path::Path::new(filename)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or(filename.as_str());
            let temp_path = temp_dir.join(format!("{}_{}", id, safe_name));
            std::fs::write(&temp_path, log_text.as_bytes())
                .map_err(|e| format!("Failed to write temp file: {}", e))?;
            // Drop the large string immediately after writing
            drop(log_text);

            temp_paths.push(
                temp_path
                    .to_str()
                    .ok_or_else(|| "Non-UTF8 temp path".to_string())?
                    .to_string(),
            );
        }

        let result = analyse_log_from_paths(temp_paths.clone(), app);

        // Best-effort cleanup of temp files
        for p in &temp_paths {
            let _ = std::fs::remove_file(p);
        }

        result
    })
    .await
    .map_err(|e| format!("Blocking task failed: {}", e))?
}

#[tauri::command]
pub async fn process_single_log_from_db_command(
    log_id: i32,
    project: String,
    action: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        let db = Database::new("serverlog.db")
            .map_err(|e| format!("Database initialization failed: {}", e))?;

        let (filename, log_text): (String, String) = db
            .conn
            .query_row(
                "SELECT filename, log FROM server_logs WHERE id = ?1 AND project = ?2",
                params![log_id, project.as_str()],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .map_err(|_| "Log not found".to_string())?;

        println!(
            "Processing single log for project '{}' (action: {})",
            project, action
        );

        let temp_dir = std::env::temp_dir().join("rustyseo_project_logs");
        std::fs::create_dir_all(&temp_dir)
            .map_err(|e| format!("Failed to create temp dir: {}", e))?;

        let safe_name = std::path::Path::new(&filename)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or(filename.as_str());
        let temp_path = temp_dir.join(format!("{}_{}", log_id, safe_name));
        std::fs::write(&temp_path, log_text.as_bytes())
            .map_err(|e| format!("Failed to write temp file: {}", e))?;
        drop(log_text);

        let temp_path_str = temp_path
            .to_str()
            .ok_or_else(|| "Non-UTF8 temp path".to_string())?
            .to_string();

        let result = analyse_log_from_paths(vec![temp_path_str.clone()], app);
        let _ = std::fs::remove_file(&temp_path_str);
        result
    })
    .await
    .map_err(|e| format!("Blocking task failed: {}", e))?
}
