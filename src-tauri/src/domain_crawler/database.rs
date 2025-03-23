use crate::domain_crawler::models::DomainCrawlResults;
use directories::ProjectDirs;
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::{params, Result as RusqliteResult};
use serde::Serialize;
use serde_json::{self, Value};
use std::fs;
use tokio::task;
use thiserror::Error;

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

    #[error("Other error: {0}")]
    Other(String),
}

#[derive(Serialize, Clone)]
pub struct DatabaseResults {
    url: String,
    data: Value,
}

pub struct Database {
    pool: Pool<SqliteConnectionManager>,
    db_name: String,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self, DatabaseError> {
        let manager = SqliteConnectionManager::file(db_path);
        let pool = Pool::new(manager)?;
        Ok(Self {
            pool,
            db_name: db_path.to_string(),
        })
    }

    pub async fn create_tables(&self) -> Result<(), DatabaseError> {
        let pool = self.pool.clone();
        task::spawn_blocking(move || {
            let conn = pool.get()?;
            conn.execute(
                "CREATE TABLE IF NOT EXISTS domain_crawl (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    url TEXT NOT NULL,
                    data TEXT NOT NULL
                )",
                params![],
            )?;
            Ok::<(), DatabaseError>(())
        })
        .await??;
        Ok(())
    }

    pub async fn insert_data(&self, data: &DatabaseResults) -> Result<(), DatabaseError> {
        let pool = self.pool.clone();
        let data_json = serde_json::to_string(&data)?; // Propagate serialization errors
        let data = data.clone(); // Clone the data to make it owned
        task::spawn_blocking(move || {
            let conn = pool.get()?;
            conn.execute(
                "INSERT OR IGNORE INTO domain_crawl (url, data) VALUES (?1, ?2)",
                params![data.url, data_json],
            )?;
            Ok::<(), DatabaseError>(())
        })
        .await??;
        Ok(())
    }

    pub async fn clear_domain_crawl_table(&self) -> Result<(), DatabaseError> {
        let pool = self.pool.clone();
        task::spawn_blocking(move || {
            let conn = pool.get()?;
            conn.execute("DELETE FROM domain_crawl", params![])?;
            Ok::<(), DatabaseError>(())
        })
        .await??;
        Ok(())
    }
}
