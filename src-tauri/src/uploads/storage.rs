use crate::crawler::db::open_db_connection;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

#[derive(Debug)]
pub struct Storage {
    pub conn: Connection,
    pub db_name: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ExcelUpload {
    pub id: i32,
    pub date: String,
    pub url: String,
    pub position: i32,
    pub clicks: i32,
    pub impressions: i32,
}

impl Storage {
    pub fn new(db_name: &str) -> Result<Self, String> {
        let conn = open_db_connection(db_name).map_err(|e| e.to_string())?;
        Ok(Self {
            conn,
            db_name: db_name.to_string(),
        })
    }

    pub fn create_table(&self) -> Result<(), String> {
        self.conn
            .execute(
                // CORRECTED: position NOT postiion
                "CREATE TABLE IF NOT EXISTS gsc_excel_upload (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                url TEXT NOT NULL,
                position INTEGER NOT NULL,
                clicks INTEGER NOT NULL,
                impressions INTEGER NOT NULL
            )",
                [],
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn add_data(&self, data: &ExcelUpload) -> Result<(), String> {
        self.conn.execute(
            // CORRECTED: position NOT postiion
            "INSERT INTO gsc_excel_upload (date, url, position, clicks, impressions) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                data.date,
                data.url,
                data.position,
                data.clicks,
                data.impressions
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn print_table(&self) -> Result<(), String> {
        let mut stmt = self
            .conn
            .prepare("SELECT * FROM gsc_excel_upload")
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], |row| {
                Ok(ExcelUpload {
                    id: row.get(0)?,
                    date: row.get(1)?,
                    url: row.get(2)?,
                    position: row.get(3)?,
                    clicks: row.get(4)?,
                    impressions: row.get(5)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut count = 0;
        for row_result in rows {
            match row_result {
                Ok(row) => {
                    println!("Row {}: {:?}", count, row);
                    count += 1;
                }
                Err(e) => println!("Error reading row: {}", e),
            }
        }

        println!("Total rows printed: {}", count);
        Ok(())
    }

    // Helper to drop and recreate the table (for testing)
    pub fn reset_table(&self) -> Result<(), String> {
        self.conn
            .execute("DROP TABLE IF EXISTS gsc_excel_upload", [])
            .map_err(|e| e.to_string())?;
        self.create_table()
    }
}
