use directories::ProjectDirs;
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::{params, Connection, Result as RusqliteResult};
use serde::{Deserialize, Serialize};
use serde_json::{self, Value};
use std::fs;
use std::path::Path;
use std::sync::Arc;
use std::time::Duration;
use thiserror::Error;
use tokio::sync::Mutex;

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

    #[error("Lock error")]
    LockError,

    #[error("IO error: {0}")]
    NotFound(String), // Added

    #[error("IO error: {0}")]
    QueryError(String), // Added
    #[error("IO error: {0}")]
    JoinError(String), // Added

    #[error("Serialization Error")]
    SerializationError(String),

    #[error("Unknown error: {0}")]
    TransactionError(String),
}

#[derive(Serialize, Clone)]
pub struct DatabaseResults {
    pub url: String,
    pub data: Value,
}

#[derive(Clone)]
pub struct Database {
    pool: Arc<Pool<SqliteConnectionManager>>,
    initialized: Arc<Mutex<bool>>,
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
                initialized: Arc::new(Mutex::new(false)),
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

        let result = tokio::task::spawn_blocking(move || {
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
            initialized: Arc::new(Mutex::new(false)),
        })
    }

    pub async fn get_urls(&self) -> Result<Vec<String>, DatabaseError> {
        let pool = self.pool.clone();

        tokio::task::spawn_blocking(move || {
            let conn = pool.get()?;
            let mut stmt = conn.prepare("SELECT url FROM domain_crawl")?;
            let urls = stmt
                .query_map(params![], |row| row.get::<_, String>(0))?
                .collect::<Result<Vec<String>, _>>()?;

            println!(
                "Found {} urls in database, transferring them to the frontend",
                urls.len()
            );

            Ok(urls)
        })
        .await?
    }

    pub async fn clear(&self) -> Result<(), DatabaseError> {
        let initialized = self.initialized.lock().await;
        if !*initialized {
            return Err(DatabaseError::NotInitialized);
        }
        drop(initialized);

        let pool = self.pool.clone();

        tokio::task::spawn_blocking(move || {
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

        tokio::task::spawn_blocking(move || {
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
    let data_json = serde_json::to_string(&data.data)?;
    let url = data.url.clone();

    tokio::task::spawn_blocking(move || {
        let conn = pool.get().map_err(|e| {
            DatabaseError::ConnectionError(format!("Failed to get connection for insert: {}", e))
        })?;
        let mut stmt =
            conn.prepare_cached("INSERT OR REPLACE INTO domain_crawl (url, data) VALUES (?1, ?2)")?;
        let rows = stmt.execute(params![url, data_json])?;
        println!("Inserted data for URL: {}, rows affected: {}", url, rows);
        Ok(())
    })
    .await?
}

pub async fn insert_bulk_crawl_data(
    pool: Arc<Pool<SqliteConnectionManager>>,
    data: Vec<DatabaseResults>,
) -> Result<(), DatabaseError> {
    if data.is_empty() {
        println!("No data provided for bulk insert");
        return Ok(());
    }

    const CHUNK_SIZE: usize = 500;

    let data_len = data.len(); // Only keep the length
    let result = tokio::task::spawn_blocking(move || -> Result<usize, DatabaseError> {
        let mut conn = pool.get().map_err(|e| {
            DatabaseError::ConnectionError(format!(
                "Failed to get connection for bulk insert: {}",
                e
            ))
        })?;

        let tx = conn.transaction().map_err(|e| {
            DatabaseError::TransactionError(format!("Failed to start transaction: {}", e))
        })?;

        let mut total_rows = 0;

        {
            let mut stmt = tx
                .prepare_cached("INSERT OR REPLACE INTO domain_crawl (url, data) VALUES (?1, ?2)")
                .map_err(|e| {
                    DatabaseError::QueryError(format!("Failed to prepare statement: {}", e))
                })?;

            for chunk in data.chunks(CHUNK_SIZE) {
                let mut chunk_entries = Vec::with_capacity(chunk.len());

                for item in chunk {
                    let json = serde_json::to_string(&item.data)
                        .map_err(|e| DatabaseError::SerializationError(e.to_string()))?;
                    chunk_entries.push((item.url.clone(), json));
                }

                for (url, data_json) in &chunk_entries {
                    let rows = stmt
                        .execute(params![url, data_json])
                        .map_err(|e| DatabaseError::QueryError(e.to_string()))?;
                    total_rows += rows;
                }
            }
        }

        tx.commit().map_err(|e| {
            DatabaseError::TransactionError(format!("Failed to commit transaction: {}", e))
        })?;

        Ok(total_rows)
    })
    .await??;

    println!(
        "Bulk insert completed: {} entries total, {} rows affected",
        data_len, result
    );

    Ok(())
}

pub fn create_diff_tables() -> Result<(), DatabaseError> {
    let project_dirs = ProjectDirs::from("", "", "rustyseo").ok_or_else(|| {
        DatabaseError::DirectoryError("Failed to get project directories".to_string())
    })?;

    let data_dir = project_dirs.data_dir();
    let db_dir = data_dir.join("db");

    fs::create_dir_all(&db_dir).map_err(|e| {
        DatabaseError::DirectoryError(format!("Failed to create db directory: {}", e))
    })?;

    let conn = Connection::open(db_dir.join("diff.db"))?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS previous_crawl (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL UNIQUE,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
    )?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS current_crawl (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL UNIQUE,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
    )?;

    println!("Tables created successfully");
    Ok(())
}

pub async fn clone_batched_crawl_into_persistent_db() -> Result<(), DatabaseError> {
    let project_dirs = ProjectDirs::from("", "", "rustyseo").ok_or_else(|| {
        DatabaseError::DirectoryError("Failed to get project directories".to_string())
    })?;

    let data_dir = project_dirs.data_dir();
    let db_dir = data_dir.join("db");

    let db = Database::initialize_db(&db_dir.join("deep_crawl_batches.db")).await?;
    let urls = db.get_urls().await?;

    tokio::task::spawn_blocking(move || {
        let mut conn = Connection::open(db_dir.join("diff.db"))?;
        let tx = conn.transaction()?;

        tx.execute("DELETE FROM previous_crawl", [])?;
        tx.execute(
            "INSERT INTO previous_crawl (url) SELECT url FROM current_crawl",
            [],
        )?;

        tx.execute("DELETE FROM current_crawl", [])?;

        for url in &urls {
            tx.execute("INSERT INTO current_crawl (url) VALUES (?1)", params![url])?;
        }

        tx.commit()?;
        Ok(())
    })
    .await?
}

#[derive(Serialize, Debug, Deserialize)]
pub struct DiffAnalysis {
    added: Differential,
    removed: Differential,
}

#[derive(Serialize, Debug, Deserialize)]
pub struct Differential {
    url: Option<String>, // Use Option to handle cases where there is no URL
    pages: Vec<String>,
    number_of_pages: usize,
    timestamp: Option<String>,
    first_url: Option<String>,
    last_url: Option<String>,
}

//NOTE: This is the function that analyses the diffs

// Helper function to compare the fisr and last elemets of the tables
// it ensures that the domain is the same and if it isnt then use a specific one.
pub async fn check_diff_domains(urls: Vec<String>) -> Result<(), String> {
    Ok(())
}

pub async fn analyse_diffs() -> Result<DiffAnalysis, DatabaseError> {
    println!("Analyzing diffs");

    let project_dirs = ProjectDirs::from("", "", "rustyseo").ok_or_else(|| {
        DatabaseError::DirectoryError("Failed to get project directories".to_string())
    })?;

    let db_dir = project_dirs.data_dir().join("db");
    let db_path = db_dir.join("diff.db");

    if !db_path.exists() {
        return Err(DatabaseError::NotFound(
            "Database file not found".to_string(),
        ));
    }

    let result = tokio::task::spawn_blocking(move || {
        let conn = Connection::open(&db_path).map_err(|e| {
            DatabaseError::ConnectionError(format!("Failed to open database: {}", e))
        })?;

        // Check if tables exist
        let tables: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table'")?
            .query_map([], |row| row.get(0))?
            .collect::<Result<_, _>>()?;

        if !tables.contains(&"current_crawl".to_string())
            || !tables.contains(&"previous_crawl".to_string())
        {
            return Err(DatabaseError::NotFound(
                "Required tables not found in database".to_string(),
            ));
        }

        #[derive(Debug)]
        struct UrlRecord {
            url: String,
            timestamp: Option<String>,
        }

        // Get first and last entries from current_crawl (clone them immediately)
        let (current_first, current_last) = {
            let (first, last) = conn.query_row(
                "SELECT 
                    (SELECT url FROM current_crawl LIMIT 1),
                    (SELECT url FROM current_crawl ORDER BY timestamp DESC LIMIT 1)",
                [],
                |row| {
                    Ok((
                        row.get::<_, Option<String>>(0)?,
                        row.get::<_, Option<String>>(1)?,
                    ))
                },
            )?;
            (first.clone(), last.clone())
        };

        // Get first and last entries from previous_crawl (clone them immediately)
        let (previous_first, previous_last) = {
            let (first, last) = conn.query_row(
                "SELECT 
                    (SELECT url FROM previous_crawl LIMIT 1),
                    (SELECT url FROM previous_crawl ORDER BY timestamp DESC LIMIT 1)",
                [],
                |row| {
                    Ok((
                        row.get::<_, Option<String>>(0)?,
                        row.get::<_, Option<String>>(1)?,
                    ))
                },
            )?;
            (first.clone(), last.clone())
        };

        println!(
            "Current crawl - First: {:?}, Last: {:?}",
            current_first, current_last
        );
        println!(
            "Previous crawl - First: {:?}, Last: {:?}",
            previous_first, previous_last
        );

        // Get added URLs with timestamps
        let mut added_records = Vec::new();
        let mut stmt = conn.prepare(
            "SELECT url, timestamp FROM current_crawl
                 WHERE url NOT IN (SELECT url FROM previous_crawl)",
        )?;

        let mut rows = stmt.query([])?;
        while let Some(row) = rows.next()? {
            added_records.push(UrlRecord {
                url: row.get(0)?,
                timestamp: row.get(1)?,
            });
        }

        // Get removed URLs with timestamps
        let mut removed_records = Vec::new();
        let mut stmt = conn.prepare(
            "SELECT url, timestamp FROM previous_crawl
                 WHERE url NOT IN (SELECT url FROM current_crawl)",
        )?;

        let mut rows = stmt.query([])?;
        while let Some(row) = rows.next()? {
            removed_records.push(UrlRecord {
                url: row.get(0)?,
                timestamp: row.get(1)?,
            });
        }

        // Get most recent timestamp from added records
        let added_timestamp = added_records
            .iter()
            .filter_map(|r| r.timestamp.as_ref())
            .max()
            .cloned();

        // Get most recent timestamp from removed records
        let removed_timestamp = removed_records
            .iter()
            .filter_map(|r| r.timestamp.as_ref())
            .max()
            .cloned();

        // Create differentials with first/last entries included
        let added_differential = Differential {
            url: added_records
                .first()
                .map(|r| r.url.clone())
                .or_else(|| current_first.clone())
                .or_else(|| previous_first.clone()),
            pages: {
                let mut pages: Vec<String> = added_records.iter().map(|r| r.url.clone()).collect();
                if let Some(ref first) = current_first {
                    if !pages.contains(first) {
                        pages.push(first.clone());
                    }
                }
                if let Some(ref last) = current_last {
                    if !pages.contains(last) {
                        pages.push(last.clone());
                    }
                }
                pages
            },
            number_of_pages: added_records.len(),
            timestamp: added_timestamp,
            first_url: current_first.clone(),
            last_url: current_last.clone(),
        };

        let removed_differential = Differential {
            url: removed_records
                .first()
                .map(|r| r.url.clone())
                .or_else(|| previous_first.clone())
                .or_else(|| current_first.clone()),
            pages: {
                let mut pages: Vec<String> =
                    removed_records.iter().map(|r| r.url.clone()).collect();
                if let Some(ref first) = previous_first {
                    if !pages.contains(first) {
                        pages.push(first.clone());
                    }
                }
                if let Some(ref last) = previous_last {
                    if !pages.contains(last) {
                        pages.push(last.clone());
                    }
                }
                pages
            },
            number_of_pages: removed_records.len(),
            timestamp: removed_timestamp,
            first_url: previous_first.clone(),
            last_url: previous_last.clone(),
        };

        Ok(DiffAnalysis {
            added: added_differential,
            removed: removed_differential,
        })
    })
    .await
    .map_err(|e| DatabaseError::JoinError(format!("Task join error: {}", e)))??;

    Ok(result)
}
