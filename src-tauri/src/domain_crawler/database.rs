use directories::ProjectDirs;
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::{params, Connection, Result as RusqliteResult};
use serde::Serialize;
use serde_json::{self, Value};
use std::fs;
use std::path::Path;
use std::sync::Arc;
use std::time::Duration;
use thiserror::Error;
use tokio::sync::Mutex; // Added for thread-safe mutability
use tokio::task;

#[derive(Error, Debug)]
pub enum DatabaseError {
    #[error("Rusqlite error: {0}")]
    Rusqlite(#[from] rusqlite::Error),

    #[error("Serde JSON error: {0}")]
    SerdeJson(#[from] serde_json::Error),

    #[error("R2D2 pool error: {0}")]
    R2D2(#[from] r2d2::Error),

    #[error("Tokio task error: {0}")]
    TokioTask(#[from] tokio::task::JoinError),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Failed to create project directories: {0}")]
    DirectoryError(String),

    #[error("Database connection error: {0}")]
    ConnectionError(String),

    #[error("Database not initialized")]
    NotInitialized,
}

#[derive(Serialize, Clone)]
pub struct DatabaseResults {
    pub url: String,
    pub data: Value,
}

#[derive(Clone)]
pub struct Database {
    pool: Arc<Pool<SqliteConnectionManager>>,
    initialized: Arc<Mutex<bool>>, // Changed from Arc<bool> to Arc<Mutex<bool>>
}

impl Database {
    pub fn new(db_name: &str) -> Result<Self, DatabaseError> {
        let project_dirs = ProjectDirs::from("", "", "rustyseo").ok_or_else(|| {
            DatabaseError::DirectoryError("Failed to get project directories".to_string())
        })?;

        let data_dir = project_dirs.data_dir();
        let db_dir = data_dir.join("db");

        fs::create_dir_all(&db_dir).map_err(|e| {
            DatabaseError::DirectoryError(format!(
                "Failed to create database directory {}: {}",
                db_dir.display(),
                e
            ))
        })?;

        let metadata = fs::metadata(&db_dir).map_err(|e| {
            DatabaseError::DirectoryError(format!(
                "Failed to get directory metadata for {}: {}",
                db_dir.display(),
                e
            ))
        })?;

        if !metadata.permissions().readonly() {
            let db_path = db_dir.join(db_name);
            println!("Creating database at: {}", db_path.display());

            let manager = SqliteConnectionManager::file(&db_path).with_init(|conn| {
                conn.pragma_update(None, "journal_mode", "WAL")?;
                conn.pragma_update(None, "synchronous", "NORMAL")?;
                Ok(())
            });

            let pool = Pool::builder()
                .max_size(16)
                .connection_timeout(Duration::from_secs(60))
                .max_lifetime(Some(Duration::from_secs(1800)))
                .idle_timeout(Some(Duration::from_secs(300)))
                .build(manager)
                .map_err(|e| {
                    DatabaseError::ConnectionError(format!(
                        "Failed to create connection pool for {}: {}",
                        db_path.display(),
                        e
                    ))
                })?;

            let test_conn = pool.get().map_err(|e| {
                DatabaseError::ConnectionError(format!(
                    "Failed to get initial connection for {}: {}",
                    db_path.display(),
                    e
                ))
            })?;
            drop(test_conn);

            Ok(Self {
                pool: Arc::new(pool),
                initialized: Arc::new(Mutex::new(false)), // Initialize with Mutex
            })
        } else {
            Err(DatabaseError::DirectoryError(format!(
                "Database directory {} is not writable",
                db_dir.display()
            )))
        }
    }

    pub fn get_pool(&self) -> Arc<Pool<SqliteConnectionManager>> {
        self.pool.clone()
    }

    pub async fn initialize(&mut self) -> Result<(), DatabaseError> {
        let pool = self.pool.clone();
        let initialized = self.initialized.clone();

        let result = task::spawn_blocking(move || {
            let conn = pool.get().map_err(|e| {
                DatabaseError::ConnectionError(format!(
                    "Failed to get connection for initialization: {}",
                    e
                ))
            })?;
            conn.execute_batch(
                r#"
                CREATE TABLE IF NOT EXISTS domain_crawl (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    url TEXT NOT NULL UNIQUE,
                    data TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_domain_crawl_url ON domain_crawl(url);
                "#,
            )?;
            println!("Database schema initialized successfully");
            Ok(())
        })
        .await?;

        // Lock the mutex and update the value
        let mut initialized_guard = initialized.lock().await;
        *initialized_guard = true;

        result
    }

    pub async fn initialize_db(db_path: &Path) -> Result<Self, DatabaseError> {
        let manager = SqliteConnectionManager::file(db_path).with_init(|conn| {
            conn.pragma_update(None, "journal_mode", "WAL")?;
            conn.pragma_update(None, "synchronous", "NORMAL")?;
            Ok(())
        });

        let pool = Pool::builder()
            .max_size(16)
            .connection_timeout(Duration::from_secs(60))
            .max_lifetime(Some(Duration::from_secs(1800)))
            .idle_timeout(Some(Duration::from_secs(300)))
            .build(manager)
            .map_err(|e| {
                DatabaseError::ConnectionError(format!(
                    "Failed to create connection pool for {}: {}",
                    db_path.display(),
                    e
                ))
            })?;

        let test_conn = pool.get().map_err(|e| {
            DatabaseError::ConnectionError(format!(
                "Failed to get initial connection for {}: {}",
                db_path.display(),
                e
            ))
        })?;
        drop(test_conn);

        Ok(Self {
            pool: Arc::new(pool),
            initialized: Arc::new(Mutex::new(false)), // Initialize with Mutex
        })
    }

    pub async fn get_urls(&self) -> Result<Vec<String>, DatabaseError> {
        let conn = self.pool.get()?;
        let mut stmt = conn.prepare("SELECT url FROM domain_crawl")?;
        let urls = stmt
            .query_map(params![], |row| row.get::<_, String>(0))?
            .collect::<Result<Vec<String>, _>>()?;

        println!(
            "Found {} urls in database, trasnferring them to the frontend",
            urls.len()
        );

        Ok(urls)
    }

    pub async fn clear(&self) -> Result<(), DatabaseError> {
        let initialized = self.initialized.lock().await;
        if !*initialized {
            return Err(DatabaseError::NotInitialized);
        }
        drop(initialized); // Release the lock

        let pool = self.pool.clone();

        task::spawn_blocking(move || {
            let conn = pool.get().map_err(|e| {
                DatabaseError::ConnectionError(format!("Failed to get connection for clear: {}", e))
            })?;
            let rows_affected = conn.execute("DELETE FROM domain_crawl", params![])?;
            println!("Cleared database, affected {} rows", rows_affected);
            Ok(())
        })
        .await?
    }

    pub async fn count_rows(&self) -> Result<i64, DatabaseError> {
        let pool = self.pool.clone();

        task::spawn_blocking(move || {
            let conn = pool.get()?;
            let count: i64 =
                conn.query_row("SELECT COUNT(*) FROM domain_crawl", [], |row| row.get(0))?;
            Ok(count)
        })
        .await?
    }
}

pub async fn insert_crawl_data(
    pool: Arc<Pool<SqliteConnectionManager>>,
    data: DatabaseResults,
) -> Result<(), DatabaseError> {
    let data_json = serde_json::to_string(&data.data).map_err(|e| DatabaseError::SerdeJson(e))?;
    let url = data.url.clone();

    let result = task::spawn_blocking(move || {
        let conn = pool.get().map_err(|e| {
            DatabaseError::ConnectionError(format!("Failed to get connection for insert: {}", e))
        })?;
        let mut stmt =
            conn.prepare_cached("INSERT OR REPLACE INTO domain_crawl (url, data) VALUES (?1, ?2)")?;
        let rows = stmt.execute(params![url, data_json])?;
        println!("Inserted data for URL: {}, rows affected: {}", url, rows);
        Ok(())
    })
    .await?;

    result
}

pub async fn insert_bulk_crawl_data(
    pool: Arc<Pool<SqliteConnectionManager>>,
    data: Vec<DatabaseResults>,
) -> Result<(), DatabaseError> {
    if data.is_empty() {
        println!("No data provided for bulk insert");
        return Ok(());
    }

    let entries: Vec<(String, String)> = data
        .into_iter()
        .map(|d| {
            let json = serde_json::to_string(&d.data).expect("Failed to serialize data");
            (d.url, json)
        })
        .collect();

    let result = task::spawn_blocking(move || {
        let mut conn = pool.get().map_err(|e| {
            DatabaseError::ConnectionError(format!(
                "Failed to get connection for bulk insert: {}",
                e
            ))
        })?;
        let tx = conn.transaction().map_err(|e| DatabaseError::Rusqlite(e))?;

        let mut total_rows = 0;
        {
            let mut stmt = tx.prepare_cached(
                "INSERT OR REPLACE INTO domain_crawl (url, data) VALUES (?1, ?2)",
            )?;

            for (url, data_json) in &entries {
                let rows = stmt.execute(params![url, data_json])?;
                total_rows += rows;
            }
        }

        tx.commit().map_err(|e| DatabaseError::Rusqlite(e))?;

        println!(
            "Bulk insert completed: {} entries, {} rows affected",
            entries.len(),
            total_rows
        );

        Ok(())
    })
    .await?;

    let _create_diff_tables = create_diff_tables().expect("Unable to create the tables for Diffs");

    // now insert just the URLs into a different db and table
    let project_dirs = ProjectDirs::from("", "", "rustyseo").ok_or_else(|| {
        DatabaseError::DirectoryError("Failed to get project directories".to_string())
    })?;

    let data_dir = project_dirs.data_dir();
    let db_dir = data_dir.join("db");

    let db = Database::initialize_db(&db_dir.join("deep_crawl_batches.db")).await?;

    let conn_diffs = Connection::open(db_dir.join("diff.db"))?;

    let urls = db.get_urls().await?;

    conn_diffs.execute("DELETE FROM previous_crawl", params![])?;

    for url in &urls {
        conn_diffs.execute(
            "INSERT OR REPLACE INTO previous_crawl (url) VALUES (?1)",
            params![url],
        )?;
        conn_diffs.execute(
            "INSERT OR REPLACE INTO current_crawl (url) VALUES (?1)",
            params![url],
        )?;
    }

    result
}

// Create the tables for the diff crawler
pub fn create_diff_tables() -> Result<(), DatabaseError> {
    let project_dirs = ProjectDirs::from("", "", "rustyseo").ok_or_else(|| {
        DatabaseError::DirectoryError("Failed to get project directories".to_string())
    })?;

    let data_dir = project_dirs.data_dir();
    let db_dir = data_dir.join("db");

    // Ensure the directory exists
    fs::create_dir_all(&db_dir).map_err(|e| {
        DatabaseError::DirectoryError(format!("Failed to create db directory: {}", e))
    })?;

    let conn = Connection::open(db_dir.join("diff.db"))?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS previous_crawl (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL UNIQUE
        )",
    )?;

    conn.execute_batch(
        "

        CREATE TABLE IF NOT EXISTS current_crawl (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL UNIQUE
        )

        ",
    )?;

    println!("Tables created successfully");

    Ok(())
}

pub async fn analyse_diffs() -> Result<(), DatabaseError> {
    println!("Analyzing diffs");

    let project_dirs = ProjectDirs::from("", "", "rustyseo").ok_or_else(|| {
        DatabaseError::DirectoryError("Failed to get project directories".to_string())
    })?;

    let data_dir = project_dirs.data_dir();
    let db_dir = data_dir.join("db");

    let db = Database::initialize_db(&db_dir.join("deep_crawl_batches.db")).await?;

    let urls = db.get_urls().await?;

    for url in &urls {
        // Assuming you just want to print URLs for now since get_diff isn't defined
        println!("URL: {}", url);
    }

    Ok(()) // Return Ok(()) as per the function signature
}

pub async fn clone_batched_crawl_into_persistent_db() -> Result<(), DatabaseError> {
    let project_dirs = ProjectDirs::from("", "", "rustyseo").ok_or_else(|| {
        DatabaseError::DirectoryError("Failed to get project directories".to_string())
    })?;

    let data_dir = project_dirs.data_dir();
    let db_dir = data_dir.join("db");

    let db = Database::initialize_db(&db_dir.join("deep_crawl_batches.db")).await?;

    let conn_diffs = Connection::open(db_dir.join("diff.db"))?;

    let urls = db.get_urls().await?;

    for url in &urls {
        conn_diffs.execute(
            "INSERT OR REPLACE INTO previous_crawl (url) VALUES (?1)",
            params![url],
        )?;
        conn_diffs.execute(
            "INSERT OR REPLACE INTO current_crawl (url) VALUES (?1)",
            params![url],
        )?;
    }

    Ok(())
}
