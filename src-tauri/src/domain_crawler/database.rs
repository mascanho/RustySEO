use crate::domain_crawler::models::DomainCrawlResults;
use directories::ProjectDirs;
use rusqlite::{params, Connection, Result};
use serde_json;
use std::fs;

pub struct DatabaseResults {
    url: String,
    data: DomainCrawlResults,
}

pub struct Database {
    conn: Connection,
    db_name: String,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        Ok(Self {
            conn,
            db_name: db_path.to_string(),
        })
    }

    pub fn create_tables(&self) -> Result<()> {
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS domain_crawl (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL UNIQUE,
                data TEXT NOT NULL
            )",
            params![],
        )?;

        Ok(())
    }

    pub fn open_connection(db_name: &str) -> Result<Connection> {
        let project_dirs = ProjectDirs::from("", "", "rustyseo").unwrap();
        let db_dir = project_dirs.data_dir().join("db");

        // Ensure the database directory exists
        if !db_dir.exists() {
            fs::create_dir_all(&db_dir).expect("Failed to create directory");
        }

        let db_path = db_dir.join(db_name);
        Connection::open(db_path)
    }

    pub fn insert_data(&self, data: &DomainCrawlResults) -> Result<()> {
        let data_json = serde_json::to_string(&data).expect("Failed to serialize data");
        self.conn.execute(
            "INSERT INTO domain_crawl (url, data) VALUES (?1, ?2)",
            params![data.url, data_json],
        )?;
        Ok(())
    }

    pub fn clear_dommain_crawl_table(&self) -> Result<()> {
        self.conn
            .execute("DELETE FROM domain_crawl", params![])
            .unwrap();
        Ok(())
    }
}
