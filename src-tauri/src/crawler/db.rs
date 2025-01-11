use chrono::{NaiveDateTime, Utc};
use directories::ProjectDirs;
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use serde_json;
use std::fs;
use tauri::command;

use super::DBData;

mod models;

pub struct DataBase {
    conn: Connection,
    db_name: String,
}

// Need to check this
impl DataBase {
    pub fn new(db_name: &str) -> Result<Self> {
        let conn = open_db_connection(db_name)?;
        Ok(Self {
            conn,
            db_name: db_name.to_string(),
        })
    }
}

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

#[derive(Debug, Serialize, Deserialize)]
pub struct SEOResultRecord {
    id: Option<i64>,
    date: String,
    url: String,
    title: String,
    description: String,
    keywords: String,
    headings: String,
}

pub fn open_db_connection(db_name: &str) -> Result<Connection> {
    // Retrieve the config directory for the application
    let project_dirs = ProjectDirs::from("", "", "rustyseo")
        .ok_or_else(|| rusqlite::Error::QueryReturnedNoRows)?;

    // Define the directory for the DB file
    let db_dir = project_dirs.data_dir().join("db"); // Append /db to data dir
    let db_path = db_dir.join(db_name);

    println!("DB path: {:?}", db_path);

    // Ensure the directory exists
    if !db_dir.exists() {
        fs::create_dir_all(db_dir).expect("Failed to create directory");
    }

    // Create a new SQLite database connection
    Connection::open(&db_path)
}

pub fn create_results_table() -> Result<()> {
    let conn = open_db_connection("crawl_results.db")?;

    conn.execute_batch(
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
    )?;
    Ok(())
}

pub fn create_on_page_seo_table() -> Result<()> {
    let conn = open_db_connection("on_page_seo.db")?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS on_page_seo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            url TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            keywords TEXT,
            headings TEXT
        )",
    )?;

    Ok(())
}

//----------- Function to read data from the database -----------
pub fn read_data_from_db() -> Result<Vec<ResultRecord>> {
    let conn = open_db_connection("crawl_results.db")?;
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

// ---------------- READ DATA FROM THE SEO ON PAGE DATA ----------------
pub fn read_seo_data_from_db() -> Result<Vec<SEOResultRecord>> {
    let conn = open_db_connection("on_page_seo.db").expect("Failed to open database connection");
    let mut stmt = conn
        .prepare("SELECT * FROM on_page_seo")
        .expect("Failed to prepare statement");

    let results = stmt
        .query_map([], |row| {
            Ok(SEOResultRecord {
                id: row.get(0)?,
                date: row.get(1)?,
                url: row.get(2)?,
                title: row.get(3)?,
                description: row.get(4)?,
                keywords: row.get(5)?,
                headings: row.get(6)?,
            })
        })
        .expect("Failed to execute query");
    let mut data = Vec::new();

    for result in results {
        data.push(result?);
    }
    //println!("Page SEO Data: {:#?}", data);
    Ok(data)
}

//----------- Function to add page speed data to the database -----------
pub fn add_data_from_pagespeed(data: &str, strategy: &str, url: &str) -> Result<()> {
    // Open the database connection
    let conn = open_db_connection("crawl_results.db")?;

    // Attempt to parse the JSON data
    let parsed_data: models::PageSpeedResponse =
        serde_json::from_str(data).expect("Couldn't Insert Into DB - Invalid JSON");

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

//----------- Function to add technical data to the database -----------
pub fn add_technical_data(data: DBData, url: &str) -> Result<()> {
    // Ensure the on_page_seo table exists
    create_on_page_seo_table()?;

    let date = Utc::now().naive_utc().to_string();
    let (title, description, keywords, headings) =
        (data.title, data.description, data.keywords, data.headings);
    let keywords = serde_json::to_string(&keywords).unwrap();
    let headings = serde_json::to_string(&headings).unwrap();

    let conn = open_db_connection("on_page_seo.db")?;

    // Insert new record into on_page_seo table
    conn.execute(
        "INSERT INTO on_page_seo (date, url, title, description, keywords, headings) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![date, url, title, description, keywords, headings],
    )
    .expect("Failed to insert data into on_page_seo table");

    Ok(())
}

// ---------------- FUNCTION TO STORE THE LINKS IN THE DATABASE ----------------

pub fn refresh_links_table() -> Result<()> {
    let conn = open_db_connection("links_crawled.db")?;
    conn.execute("DELETE FROM links", [])?;
    Ok(())
}

pub fn create_links_table() -> Result<()> {
    let conn = open_db_connection("links_crawled.db")?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            links TEXT
        )",
    )?;
    Ok(())
}

pub fn store_links_in_db(links: Vec<(String, String)>) -> Result<()> {
    let mut conn = open_db_connection("links_crawled.db")?;
    create_links_table()?;

    // Begin transaction
    let tx = conn.transaction()?;

    {
        let mut stmt = tx.prepare("INSERT INTO links (url, links) VALUES (?1, ?2)")?;

        for (url, strategy) in links {
            stmt.execute(params![url, strategy])?;
        }
    }

    // Commit transaction
    tx.commit()?;

    Ok(())
}

// --------------- FUNCTION TO FETCH THE LINKS FROM THE DATABASE ---------------

pub fn read_links_from_db() -> Result<Vec<(String, String)>> {
    let conn = open_db_connection("links_crawled.db")?;
    let mut stmt = conn.prepare("SELECT url, links FROM links")?;

    let links = stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(links)
}

// --------- PUSH GOOGLE SEARCH CONSOLE DATA TO THE DATABASE ------------
pub fn push_gsc_data_to_db(data: &Vec<serde_json::Value>) -> Result<()> {
    let mut conn =
        open_db_connection("crawl_results.db").expect("Failed to open database connection");

    // Start transaction
    let tx = conn.transaction()?;

    // Clear the existing gsc_data table
    tx.execute("DROP TABLE IF EXISTS gsc_data", [])?;

    println!("Existing gsc_data table cleared");

    // CREATE NEW TABLE ON DB
    tx.execute(
        "CREATE TABLE IF NOT EXISTS gsc_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            url TEXT NOT NULL,
            query TEXT NOT NULL,
            impressions INTEGER,
            clicks INTEGER,
            ctr FLOAT,
            position INTEGER
        )",
        [],
    )?;

    let date = Utc::now().naive_utc().to_string();

    {
        // Prepare the insert statement once
        let mut stmt = tx.prepare(
            "INSERT INTO gsc_data (date, url, query, impressions, clicks, ctr, position)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        )?;

        for item in data {
            let objects = item["rows"].as_array().unwrap();

            for object in objects {
                let url = object["keys"][1].as_str().unwrap_or("");
                let query = object["keys"][0].as_str().unwrap_or("");
                let ctr = object["ctr"].as_f64().unwrap_or(0.0);
                let clicks = object["clicks"].as_i64().unwrap_or(0);
                let impressions = object["impressions"].as_i64().unwrap_or(0);
                let position = object["position"].to_string();

                stmt.execute(params![
                    date,
                    url,
                    query,
                    impressions,
                    clicks,
                    ctr,
                    position
                ])?;
            }
        }
    }

    // Commit transaction
    tx.commit()?;

    Ok(())
}

// ------------ QUERY THE GSC DB AND ISOLATE THE QUERY URL AND ITS PROPERTIES ------------

#[derive(Serialize, Deserialize, Debug)]
pub struct GscUrl {
    id: i32,
    url: String,
    query: String,
    ctr: f64,
    clicks: i64,
    impressions: i64,
    position: f64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GscMatched {
    id: i32,
    original_id: i32,
    url: String,
    query: String,
    ctr: f64,
    clicks: i64,
    impressions: i64,
    position: f64,
}

pub fn match_gsc_url(url: &str) -> Result<(), Box<dyn std::error::Error>> {
    // Connect to the database
    let conn = open_db_connection("crawl_results.db")?;

    // URL to query
    let url_to_query = url.to_string();

    // Prepare the SQL statement
    let mut stmt = conn.prepare(
        "SELECT id, url, query, ctr, clicks, impressions, position FROM gsc_data WHERE url = ?1",
    )?;

    // Execute the query and map the result to a GscUrl struct
    let matched_urls = stmt.query_map(params![url_to_query], |row| {
        Ok(GscUrl {
            id: row.get(0)?,
            url: row.get(1)?,
            query: row.get(2)?,
            ctr: row.get(3)?,
            clicks: row.get(4)?,
            impressions: row.get(5)?,
            position: row.get(6)?,
        })
    })?;

    // Convert the query result into a vector
    let matched_urls: Vec<GscUrl> = matched_urls.collect::<Result<Vec<_>, _>>()?;

    // Insert matched URLs into the 'gsc_matched' table
    insert_matched_urls(&conn, &matched_urls)?;

    Ok(())
}

// Function to insert matched URLs into the 'gsc_matched' table
fn insert_matched_urls(conn: &Connection, matched_urls: &[GscUrl]) -> Result<()> {
    // Create a new table 'gsc_matched' if it does not exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS gsc_matched (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_id INTEGER NOT NULL,
            url TEXT NOT NULL,
            query TEXT NOT NULL,
            ctr REAL,
            clicks INTEGER,
            impressions INTEGER,
            position INTEGER
        )",
        [],
    )?;

    // Prepare the insertion statement
    let mut insert_stmt = conn.prepare(
        "INSERT INTO gsc_matched (original_id, url, query, ctr, clicks, impressions, position)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
    )?;

    // REMOVE EXISTING DATA FROM THE gsc_matched TABLE
    conn.execute("DELETE FROM gsc_matched", [])?;

    // Insert each matched URL into the table
    for url in matched_urls {
        insert_stmt.execute(params![
            url.id,
            url.url,
            url.query,
            url.ctr,
            url.clicks,
            url.impressions,
            url.position
        ])?;
    }

    println!("Matched URLs have been inserted into the gsc_matched on the tables");

    Ok(())
}

pub fn read_gsc_matched_from_db() -> Result<Vec<GscMatched>> {
    let conn = open_db_connection("crawl_results.db")?;
    let mut stmt = conn.prepare("SELECT * FROM gsc_matched")?;

    let matched_urls = stmt.query_map([], |row| {
        Ok(GscMatched {
            id: row.get(0)?,
            original_id: row.get(1)?,
            url: row.get(2)?,
            query: row.get(3)?,
            ctr: row.get(4)?,
            clicks: row.get(5)?,
            impressions: row.get(6)?,
            position: row.get(7)?,
        })
    })?;

    let mut data = Vec::new();

    for url in matched_urls {
        data.push(url?);
    }
    // println!("Page SEO Data: {:#?}", data);
    Ok(data)
}

// -------FUNCTION TO DELETE/CLEAR all the results from the DB
#[command]
pub fn clear_table_command(table: &str) {
    let result = clear_table(table).expect("Failed to clear table");
}

pub fn clear_table(table: &str) -> Result<(), Box<dyn std::error::Error>> {
    let conn = open_db_connection("crawl_results.db")?;
    let sql = format!("DELETE FROM {}", table);
    conn.execute(&sql, [])?;
    println!("Table {} has been cleared", table);
    Ok(())
}

// --------- FUNCTION TO ADD GSC DATA TO THE KW TRACKING TABLE ------------

#[derive(Debug, Serialize, Deserialize)]
pub struct KwTrackingData {
    #[serde(default)]
    pub id: i64, // Changed to i64 to match SQLite's INTEGER PRIMARY KEY
    pub clicks: u32,      // Unsigned integer for clicks
    pub impressions: u32, // Unsigned integer for impressions
    pub position: f64,    // Floating point for position (since it has decimals)
    pub query: String,    // Keep as String
    pub url: String,      // Keep as String
    #[serde(default)]
    pub date: String,
}

pub fn add_gsc_data_to_kw_tracking(data: &KwTrackingData) -> Result<()> {
    let conn = open_db_connection("keyword_tracking.db")?;

    // create a timestamp with todays date in human readable format
    let date = Utc::now().naive_utc().to_string();

    // Create the keywords table if it does not exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS keywords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            query TEXT NOT NULL,
            clicks INTEGER,
            impressions INTEGER,
            position REAL,
            date TEXT
        )",
        [],
    )?;

    // Insert new record into keywords table
    conn.execute(
        "INSERT INTO keywords (url, query, clicks, impressions, position, date) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            data.url,
            data.query,
            data.clicks,
            data.impressions,
            data.position,
            date
        ],
    )?;

    println!("Keyword tracking data inserted successfully");
    println!("Data Inserted: {:#?}", data);

    Ok(())
}

// ----------- FUNCTION TO READ KEYWORD TRACKING DATA FROM THE DB
pub fn read_tracked_keywords_from_db() -> Result<Vec<KwTrackingData>> {
    let conn = open_db_connection("keyword_tracking.db")?;
    let mut stmt = conn.prepare("SELECT * FROM keywords")?;

    let keywords = stmt.query_map([], |row| {
        Ok(KwTrackingData {
            id: row.get(0)?,
            url: row.get(1)?,
            query: row.get(2)?,
            clicks: row.get::<_, i64>(3)? as u32,
            impressions: row.get::<_, i64>(4)? as u32,
            position: row.get(5)?,
            date: row.get(6)?,
        })
    })?;

    let mut data = Vec::new();

    for keyword in keywords {
        data.push(keyword?);
    }
    //println!("Page SEO Data: {:#?}", data);
    Ok(data)
}

// ----------- FUNCTION TO DELETE KEYWORD TRACKING DATA FROM THE DB
pub fn delete_keyword_from_db(id: &str) -> Result<()> {
    let conn = open_db_connection("keyword_tracking.db")?;
    conn.execute("DELETE FROM keywords WHERE id = ?", params![id])?;
    Ok(())
}

// ------ FIND THE KEYWORDS IN THE MAIN GSC_TABLE THAT MATCH THE EXISTING ONES IN KEYWORDS TABLE AND CREATE A NEW TABLE CALLED TRACKED_KW_GSC

#[derive(Debug, Serialize, Deserialize, Clone)]
struct TrackedKwGsc {
    id: i64,
    keyword: String,
    initial_impressions: i64,
    current_impressions: i64,
    initial_clicks: i64,
    current_clicks: i64,
    url: String,
    initial_position: i64,
    current_position: i64,
    date_added: String,
}

pub fn match_tracked_with_gsc() -> Result<()> {
    let conn_tracked = open_db_connection("keyword_tracking.db")?;
    let conn_gsc = open_db_connection("crawl_results.db")?;

    // Create the matched keywords table if it does not exist
    conn_tracked.execute(
        "CREATE TABLE IF NOT EXISTS keywords_tracked_gsc (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             tracked_url TEXT NOT NULL,
             tracked_query TEXT NOT NULL,
             tracked_clicks INTEGER,
             tracked_impressions INTEGER,
             tracked_position REAL,
             tracked_date TEXT NOT NULL,
             gsc_url TEXT NOT NULL,
             gsc_query TEXT NOT NULL,
             gsc_clicks INTEGER,
             gsc_impressions INTEGER,
             gsc_position REAL,
             gsc_date TEXT NOT NULL
         )",
        [],
    )?;

    println!("RustySEO is matching your tracked KWs with GSC data...");

    // Clear existing data
    conn_tracked.execute("DELETE FROM keywords_tracked_gsc", [])?;

    // Get tracked keywords
    let mut stmt = conn_tracked.prepare(
        "SELECT k.id, k.url, k.query, k.clicks, k.impressions, k.position, k.date
         FROM keywords k",
    )?;

    let tracked_keywords = stmt.query_map([], |row| {
        Ok(KwTrackingData {
            id: row.get(0)?,
            url: row.get(1)?,
            query: row.get(2)?,
            clicks: row.get::<_, i64>(3)? as u32,
            impressions: row.get::<_, i64>(4)? as u32,
            position: row.get(5)?,
            date: row.get(6)?,
        })
    })?;

    // Get matching GSC data
    for tracked_kw in tracked_keywords {
        let tracked_kw = tracked_kw?;

        let mut stmt = conn_gsc.prepare(
            "SELECT id, url, query, clicks, impressions, position
             FROM gsc_data
             WHERE LOWER(query) = LOWER(?1)",
        )?;

        let gsc_matches = stmt.query_map([&tracked_kw.query], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, i64>(3)?,
                row.get::<_, i64>(4)?,
                row.get::<_, f64>(5)?,
            ))
        })?;

        for gsc_match in gsc_matches {
            let gsc_data = gsc_match?;

            conn_tracked.execute(
                "INSERT INTO keywords_tracked_gsc (
                    tracked_url, tracked_query, tracked_clicks, tracked_impressions,
                    tracked_position, tracked_date, gsc_url, gsc_query, gsc_clicks,
                    gsc_impressions, gsc_position, gsc_date
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
                params![
                    tracked_kw.url,
                    tracked_kw.query,
                    tracked_kw.clicks as i64,
                    tracked_kw.impressions as i64,
                    tracked_kw.position,
                    tracked_kw.date,
                    gsc_data.1,
                    gsc_data.2,
                    gsc_data.3,
                    gsc_data.4,
                    gsc_data.5,
                    Utc::now().naive_utc().to_string(),
                ],
            )?;
        }
    }

    Ok(())
}
