// database.rs
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::{params, Result as RusqliteResult};
use serde::Serialize;
use serde_json::{self, Value};
use std::sync::Arc;
use thiserror::Error;
use tokio::task;

#[derive(Error, Debug)]
pub enum DatabaseError {
    #[error("Rusqlite error: {0}")]
    Rusqlite(#[from] rusqlite::Error),

    #[error("Serde JSON error: {0}")]
    SerdeJson(#[from] serde_json::Error),

    #[error("R2D2 error: {0}")]
    R2D2(#[from] r2d2::Error),

    #[error("Tokio task error: {0}")]
    TokioTask(#[from] tokio::task::JoinError),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

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
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self, DatabaseError> {
        let manager = SqliteConnectionManager::file(db_path).with_init(|conn| {
            conn.pragma_update(None, "journal_mode", "WAL")?;
            conn.pragma_update(None, "synchronous", "NORMAL")?;
            Ok(())
        });

        let pool = Pool::builder()
            .max_size(16)
            .build(manager)?;

        Ok(Self {
            pool: Arc::new(pool),
        })
    }

    pub fn get_pool(&self) -> Arc<Pool<SqliteConnectionManager>> {
        self.pool.clone()
    }

    pub async fn initialize(&self) -> Result<(), DatabaseError> {
        let pool = self.pool.clone();

        task::spawn_blocking(move || {
            let conn = pool.get()?;
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
            Ok(())
        })
        .await?
    }

    pub async fn clear(&self) -> Result<(), DatabaseError> {
        let pool = self.pool.clone();

        task::spawn_blocking(move || {
            let conn = pool.get()?;
            conn.execute("DELETE FROM domain_crawl", params![])?;
            Ok(())
        })
        .await?
    }
}

pub async fn insert_crawl_data(
    pool: Arc<Pool<SqliteConnectionManager>>,
    data: &DatabaseResults,
) -> Result<(), DatabaseError> {
    let data_json = serde_json::to_string(data)?;
    let url = data.url.clone();

    task::spawn_blocking(move || {
        let conn = pool.get()?;
        let mut stmt = conn.prepare_cached(
            "INSERT OR REPLACE INTO domain_crawl (url, data) VALUES (?1, ?2)"
        )?;
        stmt.execute(params![url, data_json])?;
        Ok(())
    })
    .await?
}

pub async fn batch_insert_crawl_data(
    pool: Arc<Pool<SqliteConnectionManager>>,
    items: &[DatabaseResults],
) -> Result<(), DatabaseError> {
    if items.is_empty() {
        return Ok(());
    }

    let pool = pool.clone();
    let items = items.to_vec();

    task::spawn_blocking(move || {
        let conn = pool.get()?;
        let tx = conn.transaction()?;
        
        {
            let mut stmt = tx.prepare_cached(
                "INSERT OR REPLACE INTO domain_crawl (url, data) VALUES (?1, ?2)"
            )?;

            for item in items {
                let data_json = serde_json::to_string(&item.data)?;
                stmt.execute(params![item.url, data_json])?;
            }
        }
        
        tx.commit()?;
        Ok(())
    })
    .await?
}
