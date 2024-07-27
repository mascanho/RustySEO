use chrono::{NaiveDateTime, Utc};
use directories::ProjectDirs;
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use serde_json;
use std::fs;

mod models;

#[derive(Debug, Serialize, Deserialize)]
pub struct ResultRecord {
    pub id: Option<i64>,                   // For INTEGER PRIMARY KEY AUTOINCREMENT
    pub date: String,                      // For TEXT (assuming ISO 8601 format for date)
    pub url: String,                       // For TEXT NOT NULL
    pub strategy: Option<String>,          // For TEXT
    pub performance: Option<f64>,          // For FLOAT
    pub fcp: Option<f64>,                  // For FLOAT
    pub lcp: Option<f64>,                  // For FLOAT
    pub tti: Option<f64>,                  // For FLOAT
    pub tbt: Option<f64>,                  // For FLOAT
    pub cls: Option<f64>,                  // For FLOAT
    pub dom_size: Option<f64>,             // For FLOAT
    pub speed_index: Option<f64>,          // For FLOAT
    pub server_response_time: Option<f64>, // For FLOAT
    pub total_byte_weight: Option<f64>,    // For FLOAT
}

pub fn open_db_connection() -> Result<Connection> {
    // Retrieve the config directory for the application
    let project_dirs = ProjectDirs::from("com", "YourCompany", "YourAppName")
        .ok_or_else(|| rusqlite::Error::QueryReturnedNoRows)?;

    // Define the directory for the DB file
    let db_dir = project_dirs.data_dir(); // Use data_dir() for application data
    let db_path = db_dir.join("crawl_results.db");

    // Ensure the directory exists
    if !db_dir.exists() {
        fs::create_dir_all(db_dir).expect("Failed to create directory");
    }

    // Create a new SQLite database connection
    Connection::open(&db_path)
}

pub fn create_results_table() -> Result<()> {
    let conn = open_db_connection()?;

    // Create the results table if it does not exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            url TEXT NOT NULL,
            strategy TEXT,
            performance FLOAT,
            fcp FLOAT,
            lcp FLOAT,
            tti FLOAT,
            tbt FLOAT,
            cls FLOAT,
            dom_size FLOAT,
            speed_index FLOAT,
            server_response_time FLOAT,
            total_byte_weight FLOAT
        )",
        [],
    )?;
    println!("Results table created");
    Ok(())
}

pub fn create_technical_data_table() -> Result<()> {
    let conn = open_db_connection()?;

    // Create the technical_data table if it does not exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS technical_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            url TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT
        )",
        [],
    )
    .expect("Failed to create table");
    println!("Technical data table created");
    Ok(())
}

// Function to read data from the database
pub fn read_data_from_db() -> Result<Vec<ResultRecord>> {
    let conn = open_db_connection()?;
    let mut stmt = conn.prepare("SELECT * FROM results")?;

    let results = stmt.query_map([], |row| {
        Ok(ResultRecord {
            id: row.get(0)?,
            date: row.get(1)?,
            url: row.get(2)?,
            strategy: row.get(3)?,
            performance: row.get(4)?,
            fcp: row.get(5)?,
            lcp: row.get(6)?,
            tti: row.get(7)?,
            tbt: row.get(8)?,
            cls: row.get(9)?,
            dom_size: row.get(10)?,
            speed_index: row.get(11)?,
            server_response_time: row.get(12)?,
            total_byte_weight: row.get(13)?,
        })
    })?;

    let mut data = Vec::new();
    for result in results {
        data.push(result?);
    }

    Ok(data)
}

pub fn add_data_from_pagespeed(data: &str, strategy: &str, url: &str) -> Result<()> {
    // Open the database connection
    let conn = open_db_connection()?;

    // Attempt to parse the JSON data
    let parsed_data: models::PageSpeedResponse = serde_json::from_str(data).expect("Invalid JSON");

    // Extract response values
    let audits = parsed_data.lighthouse_result.audits;
    let score = parsed_data.lighthouse_result.categories.performance.score;
    let fcp = audits.first_contentful_paint.score;
    let lcp = audits.largest_contentful_paint.score;
    let tti = audits.interactive.score;
    let tbt = audits.total_blocking_time.score;
    let cls = audits.cumulative_layout_shift.score;
    let dom_size = audits.dom_size.numeric_value; // Adjust as necessary
    let speed_index = audits.speed_index.score;
    let server_response_time = audits.server_response_time.numeric_value;
    let total_byte_weight = audits.total_byte_weight.score;
    let performance = format!("{}", score);
    let date = Utc::now().naive_utc().to_string();

    // Ensure the results table exists
    create_results_table()?;

    // Insert new record into results table
    conn.execute(
        "INSERT INTO results (date, url, strategy, performance, fcp, lcp, tti, tbt, cls, dom_size, speed_index, server_response_time, total_byte_weight) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![date, url, strategy, performance, fcp, lcp, tti, tbt, cls, dom_size, speed_index, server_response_time, total_byte_weight],
    )?;

    println!("PageSpeed data inserted successfully");

    Ok(())
}

pub fn add_technical_data(data: Vec<&String>, url: &str) -> Result<()> {
    // Ensure the technical_data table exists
    create_technical_data_table()?;

    let date = Utc::now().naive_utc().to_string();
    let (title, description) = (data[0], data[1]);

    let conn = open_db_connection()?;

    // Insert new record into technical_data table
    conn.execute(
        "INSERT INTO technical_data (date, url, title, description) VALUES (?1, ?2, ?3, ?4)",
        params![date, url, title, description],
    )
    .expect("Failed to insert data into technical_data table");

    println!("Data: {:#?}", data[0]);

    Ok(())
}
