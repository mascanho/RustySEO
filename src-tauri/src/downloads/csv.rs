use csv::Writer;
use directories::ProjectDirs;
use rusqlite::Connection;
use std::{fs, path::Path};
use tauri::command;

// Define the ResultRecord struct
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

// Define the OnPageResults struct
pub struct OnPageResults {
    pub url: String,
    pub title: String,
    pub description: String,
    pub keywords: String,
    pub headings: String,
}

// Function to generate CSV file from data
pub fn generate_csv(data: Vec<Vec<String>>, file_path: &Path) -> Result<String, String> {
    // Create a new CSV writer that writes to the specified file path
    let mut wtr = Writer::from_path(file_path).map_err(|e| e.to_string())?;

    // Write each row of data
    for row in data.clone() {
        wtr.write_record(&row).map_err(|e| e.to_string())?;
    }

    // Ensure all data is written to the file
    wtr.flush().map_err(|e| e.to_string())?;
    println!("CSV file created at: {:?}", file_path);
    let csv = &data.clone();
    let csv_data = csv
        .iter()
        .map(|row| row.join(","))
        .collect::<Vec<_>>()
        .join("\n");
    Ok(csv_data)
}

// Initialize the database and create the `technical_data` table if it doesn't exist
fn initialize_db(db_path: &Path) -> Result<(), String> {
    // Ensure the directory exists
    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    // Create a new SQLite database connection
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    // Create the `technical_data` table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS technical_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            title TEXT,
            description TEXT,
            keywords TEXT,
            headings TEXT
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    // Create the `results` table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            url TEXT NOT NULL,
            strategy TEXT,
            performance REAL,
            fcp REAL,
            lcp REAL,
            tti REAL,
            tbt REAL,
            cls REAL,
            dom_size REAL,
            speed_index REAL,
            server_response_time REAL,
            total_byte_weight REAL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

// Fetch SEO ONPAGE data from the database and generate a CSV file
#[command]
pub fn generate_seo_csv() -> Result<String, String> {
    // Retrieve the config directory for the application
    let project_dirs = ProjectDirs::from("", "", "rustyseo")
        .ok_or_else(|| "Failed to get project directories".to_string())?;

    // Define the directory for the DB file
    let db_dir = project_dirs.data_dir();
    let db_path = db_dir.join("crawl_results.db");

    // Initialize the database (create tables if they don't exist)
    initialize_db(&db_path)?;

    // Create a new SQLite database connection
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    // Query the data
    let mut stmt = conn
        .prepare("SELECT url, title, description, keywords, headings FROM technical_data")
        .map_err(|e| e.to_string())?;

    let data_iter = stmt
        .query_map([], |row| {
            Ok(vec![
                row.get::<_, String>(0)?, // URL
                row.get::<_, String>(1)?, // Title
                row.get::<_, String>(2)?, // Description
                row.get::<_, String>(3)?, // Keywords
                row.get::<_, String>(4)?, // Headings
            ])
        })
        .map_err(|e| e.to_string())?;

    // Convert the data to a Vec<Vec<String>>
    let data: Vec<Vec<String>> = data_iter
        .map(|result| result.map_err(|e| e.to_string()))
        .collect::<Result<_, _>>()?;

    // Define the file path for the CSV file
    let file_path = project_dirs.data_dir().join("onpage_seo_output.csv");

    // Add headers
    let mut data_with_headers = vec![vec![
        "URL".to_string(),
        "Title".to_string(),
        "Description".to_string(),
        "Keywords".to_string(),
        "Headings".to_string(),
    ]];
    data_with_headers.extend(data);

    // Generate the CSV file
    generate_csv(data_with_headers, &file_path)
}

// Fetch data from SQLite and generate a CSV file
#[command]
pub fn generate_csv_command() -> Result<String, String> {
    // Retrieve the config directory for the application
    let project_dirs = ProjectDirs::from("", "", "rustyseo")
        .ok_or_else(|| "Failed to get project directories".to_string())?;

    // Define the directory for the DB file
    let db_dir = project_dirs.data_dir(); // Use data_dir() for application data
    let db_path = db_dir.join("crawl_results.db");

    // Initialize the database (create tables if they don't exist)
    initialize_db(&db_path)?;

    // Create a new SQLite database connection
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    // Query the data
    let mut stmt = conn
        .prepare("SELECT id, date, url, strategy, performance, fcp, lcp, tti, tbt, cls, dom_size, speed_index, server_response_time, total_byte_weight FROM results")
        .map_err(|e| e.to_string())?;

    let data_iter = stmt
        .query_map([], |row| {
            Ok(vec![
                row.get::<_, Option<i64>>(0)?
                    .map_or("".to_string(), |v| v.to_string()), // id
                row.get::<_, String>(1)?,                             // date
                row.get::<_, String>(2)?,                             // url
                row.get::<_, Option<String>>(3)?.unwrap_or_default(), // strategy
                row.get::<_, Option<f64>>(4)?
                    .map_or("".to_string(), |v| v.to_string()), // performance
                row.get::<_, Option<f64>>(5)?
                    .map_or("".to_string(), |v| v.to_string()), // fcp
                row.get::<_, Option<f64>>(6)?
                    .map_or("".to_string(), |v| v.to_string()), // lcp
                row.get::<_, Option<f64>>(7)?
                    .map_or("".to_string(), |v| v.to_string()), // tti
                row.get::<_, Option<f64>>(8)?
                    .map_or("".to_string(), |v| v.to_string()), // tbt
                row.get::<_, Option<f64>>(9)?
                    .map_or("".to_string(), |v| v.to_string()), // cls
                row.get::<_, Option<f64>>(10)?
                    .map_or("".to_string(), |v| v.to_string()), // dom_size
                row.get::<_, Option<f64>>(11)?
                    .map_or("".to_string(), |v| v.to_string()), // speed_index
                row.get::<_, Option<f64>>(12)?
                    .map_or("".to_string(), |v| v.to_string()), // server_response_time
                row.get::<_, Option<f64>>(13)?
                    .map_or("".to_string(), |v| v.to_string()), // total_byte_weight
            ])
        })
        .map_err(|e| e.to_string())?;

    // Convert the data to a Vec<Vec<String>>
    let data: Vec<Vec<String>> = data_iter
        .map(|result| result.map_err(|e| e.to_string()))
        .collect::<Result<_, _>>()?;

    // Define the file path for the CSV file
    let file_path = project_dirs.data_dir().join("Performance.csv");

    // Add headers
    let mut data_with_headers = vec![vec![
        "id".to_string(),
        "date".to_string(),
        "url".to_string(),
        "strategy".to_string(),
        "performance".to_string(),
        "fcp".to_string(),
        "lcp".to_string(),
        "tti".to_string(),
        "tbt".to_string(),
        "cls".to_string(),
        "dom_size".to_string(),
        "speed_index".to_string(),
        "server_response_time".to_string(),
        "total_byte_weight".to_string(),
    ]];
    data_with_headers.extend(data);

    // Generate the CSV file
    generate_csv(data_with_headers, &file_path)
}
