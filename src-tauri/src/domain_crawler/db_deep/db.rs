use directories::ProjectDirs;
use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};

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
            status TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

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
}

#[tauri::command]
pub fn read_domain_results_history_table() -> Result<Vec<DeepCrawlHistory>, String> {
    // Open the database connection
    let conn = open_domain_db_connection("deep_crawl.db").map_err(|e| e.to_string())?;

    // Prepare the SQL query to read data
    let mut stmt = conn
        .prepare("SELECT id, domain, date, pages, errors, status FROM deep_crawls_history")
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
            "INSERT INTO deep_crawls_history (domain, date, pages, errors, status) VALUES (?1, ?2, ?3, ?4, ?5)",
            [
                &item.domain,
                &item.date,
                &item.pages.to_string(),
                &item.errors.to_string(),
                &item.status,
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    println!("Data written to the database successfully");

    // Return a success message
    Ok("Data inserted successfully".to_string())
}
