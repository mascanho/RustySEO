use directories::ProjectDirs;
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use tokio::task;

pub struct DomainDataBase {
    conn: Connection,
    db_name: String,
}

impl DomainDataBase {
    pub fn new(db_name: &str) -> Result<Self> {
        let conn = open_domain_db_connection(db_name)?;

        Ok(Self {
            conn,
            db_name: db_name.to_string(),
        })
    }
}

pub fn open_domain_db_connection(db_name: &str) -> Result<Connection> {
    let project_dirs =
        ProjectDirs::from("", "", "rustyseo").expect("Error creating directory for DB");

    // Define the directory of the domain db file
    let db_dir = project_dirs.data_dir().join("db"); // appends /db to the data dir
    let db_path = db_dir.join(db_name);

    println!("Opening domain db at {:?}", db_path);

    // Ensure the directory exists
    if !db_dir.exists() {
        std::fs::create_dir_all(&db_dir).expect("Failed to create directory");
    }

    // Create a new SQLite database connection
    Connection::open(db_path)
}

#[tauri::command]
pub fn create_domain_results_table() -> Result<(), String> {
    let conn = open_domain_db_connection("deep_crawl.db").map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS deep_crawls_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            domain TEXT NOT NULL,
            date TEXT NOT NULL,
            pages INTEGER NOT NULL,
            errors INTEGER NOT NULL,
            status TEXT NOT NULL,
            total_links INTEGER NOT NULL,
            total_internal_links INTEGER NOT NULL,
            total_external_links INTEGER NOT NULL,
            indexable_pages INTEGER NOT NULL,
            not_indexable_pages INTEGER NOT NULL,
            total_css INTEGER NOT NULL DEFAULT 0,
            total_javascript INTEGER NOT NULL DEFAULT 0,
            total_images INTEGER NOT NULL DEFAULT 0,
            total_redirects INTEGER NOT NULL DEFAULT 0,
            missing_title INTEGER NOT NULL DEFAULT 0,
            missing_description INTEGER NOT NULL DEFAULT 0,
            avg_response_time INTEGER NOT NULL DEFAULT 0,
            max_crawl_depth INTEGER NOT NULL DEFAULT 0,
            total_secure_pages INTEGER NOT NULL DEFAULT 0,
            total_schema_pages INTEGER NOT NULL DEFAULT 0,
            total_mobile_pages INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    // Safe schema migration for existing databases
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN total_css INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN total_javascript INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN total_images INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN total_redirects INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN missing_title INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN missing_description INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN avg_response_time INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN max_crawl_depth INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN total_secure_pages INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN total_schema_pages INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN total_mobile_pages INTEGER NOT NULL DEFAULT 0", []);

    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeepCrawlHistory {
    pub id: i32,
    pub domain: String,
    pub date: String,
    pub pages: i32,
    pub errors: i32,
    pub status: String,
    pub total_links: i32,
    pub total_internal_links: i32,
    pub total_external_links: i32,
    pub indexable_pages: i32,
    pub not_indexable_pages: i32,
    pub total_css: i32,
    pub total_javascript: i32,
    pub total_images: i32,
    pub total_redirects: i32,
    pub missing_title: i32,
    pub missing_description: i32,
    pub avg_response_time: i32,
    pub max_crawl_depth: i32,
    pub total_secure_pages: i32,
    pub total_schema_pages: i32,
    pub total_mobile_pages: i32,
}

#[tauri::command]
pub fn read_domain_results_history_table() -> Result<Vec<DeepCrawlHistory>, String> {
    // Open the database connection
    let conn = open_domain_db_connection("deep_crawl.db").map_err(|e| e.to_string())?;

    // Prepare the SQL query to read data
    let mut stmt = conn
        .prepare(
            "SELECT id, domain, date, pages, errors, status, total_links, total_internal_links, total_external_links, indexable_pages, not_indexable_pages, total_css, total_javascript, total_images, total_redirects, missing_title, missing_description, avg_response_time, max_crawl_depth, total_secure_pages, total_schema_pages, total_mobile_pages
             FROM deep_crawls_history",
        )
        .map_err(|e| e.to_string())?;

    // Execute the query and map the results to the `DeepCrawlHistory` struct
    let rows = stmt
        .query_map([], |row| {
            Ok(DeepCrawlHistory {
                id: row.get(0)?,
                domain: row.get(1)?,
                date: row.get(2)?,
                pages: row.get(3)?,
                errors: row.get(4)?,
                status: row.get(5)?,
                total_links: row.get(6)?,
                total_internal_links: row.get(7)?,
                total_external_links: row.get(8)?,
                indexable_pages: row.get(9)?,
                not_indexable_pages: row.get(10)?,
                total_css: row.get(11)?,
                total_javascript: row.get(12)?,
                total_images: row.get(13)?,
                total_redirects: row.get(14)?,
                missing_title: row.get(15)?,
                missing_description: row.get(16)?,
                avg_response_time: row.get(17)?,
                max_crawl_depth: row.get(18)?,
                total_secure_pages: row.get(19)?,
                total_schema_pages: row.get(20)?,
                total_mobile_pages: row.get(21)?,
            })
        })
        .map_err(|e| e.to_string())?;

    // Collect the results into a vector
    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }

    println!("Data read from the database successfully");

    Ok(results)
}

#[tauri::command]
pub fn create_domain_results_history(data: Vec<DeepCrawlHistory>) -> Result<String, String> {
    println!("Data to insert: {:?}", &data);

    // Open the database connection
    let conn = open_domain_db_connection("deep_crawl.db").map_err(|e| e.to_string())?;

    // Write each object in the array to the database
    for item in &data {
        conn.execute(
            "INSERT INTO deep_crawls_history (
                domain, date, pages, errors, status, total_links, total_internal_links, total_external_links, indexable_pages, not_indexable_pages, total_css, total_javascript, total_images, total_redirects, missing_title, missing_description, avg_response_time, max_crawl_depth, total_secure_pages, total_schema_pages, total_mobile_pages
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21)",
            [
                &item.domain,
                &item.date,
                &item.pages.to_string(),
                &item.errors.to_string(),
                &item.status,
                &item.total_links.to_string(),
                &item.total_internal_links.to_string(),
                &item.total_external_links.to_string(),
                &item.indexable_pages.to_string(),
                &item.not_indexable_pages.to_string(),
                &item.total_css.to_string(),
                &item.total_javascript.to_string(),
                &item.total_images.to_string(),
                &item.total_redirects.to_string(),
                &item.missing_title.to_string(),
                &item.missing_description.to_string(),
                &item.avg_response_time.to_string(),
                &item.max_crawl_depth.to_string(),
                &item.total_secure_pages.to_string(),
                &item.total_schema_pages.to_string(),
                &item.total_mobile_pages.to_string(),
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    println!("Data written to the database successfully");

    // Return a success message
    Ok("Data inserted successfully".to_string())
}

// HANDLE THE EXTRACTORS
#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct ExtractorConfig {
    #[serde(rename = "type")]
    pub config_type: String,
    pub config: InnerConfig,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct InnerConfig {
    #[serde(rename = "type")]
    pub inner_type: Option<String>, // Optional nested type field
    pub selector: String,
    pub attribute: String,
}

#[tauri::command]
pub fn store_custom_search(data: Vec<ExtractorConfig>) -> Result<(), String> {
    // Open the connection
    let conn = open_domain_db_connection("deep_crawl.db").map_err(|e| e.to_string())?;

    // Create the table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS custom_search (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            selector TEXT NOT NULL,
            search_text TEXT NOT NULL
        );",
        [],
    )
    .map_err(|e| e.to_string())?;

    // Delete the first row if it exists
    conn.execute("DELETE FROM custom_search WHERE id = 1", [])
        .map_err(|e| e.to_string())?;

    // Insert a new row
    for item in &data {
        conn.execute(
            "INSERT INTO custom_search (id, type, selector, search_text) VALUES (1, ?, ?, ?)",
            params![
                &item.config_type,
                &item.config.selector,
                &item.config.attribute
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    println!("Replacing data in the DB: {:#?}", data);

    Ok(())
}

// GET THE RESULTS STORED IN THE DB
// Uses a direct Connection instead of creating a pool every time,
// since this is called for every URL during crawling.
pub async fn fetch_custom_search() -> Result<Vec<ExtractorConfig>, String> {
    let project_dirs =
        ProjectDirs::from("", "", "rustyseo").expect("Failed to get project directories");

    let db_dir = project_dirs.data_dir().join("db");
    let db_path = db_dir.join("deep_crawl.db");

    if !db_dir.exists() {
        std::fs::create_dir_all(&db_dir).expect("Failed to create directory");
    }

    let configs = task::spawn_blocking(move || {
        let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT type, selector, search_text FROM custom_search")
            .map_err(|e| e.to_string())?;

        let config_iter = stmt
            .query_map(params![], |row| {
                Ok(ExtractorConfig {
                    config_type: row.get(0)?,
                    config: InnerConfig {
                        inner_type: None,
                        selector: row.get(1)?,
                        attribute: row.get(2)?,
                    },
                })
            })
            .map_err(|e| e.to_string())?;

        let configs: Result<Vec<_>, _> = config_iter.collect();
        configs.map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())??;

    Ok(configs)
}

// ENSURE THE THE DATA IS DELETED ON APP LAUNCH
#[tauri::command]
pub fn clear_custom_search() -> Result<(), String> {
    // Open the connection
    let conn = open_domain_db_connection("deep_crawl.db").map_err(|e| e.to_string())?; // Use ? to propagate the error

    // Delete the first row if it exists
    conn.execute("DELETE FROM custom_search WHERE id = 1", [])
        .map_err(|e| e.to_string())?; // Use ? to propagate the error

    Ok(())
}
