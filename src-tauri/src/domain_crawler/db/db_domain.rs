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
    let project_dirs = ProjectDirs::from("", "", "rustyseo")
        .ok_or_else(|| rusqlite::Error::QueryReturnedNoRows)?;

    // Define the directory of the domain db file
    let db_dir = project_dirs.data_dir().join("db"); // appends /db to the data dir
    let db_path = db_dir.join(db_name);

    println!("Opening domain db at {:?}", db_path);

    // Ensure the directory exists
    if !db_dir.exists() {
        std::fs::create_dir_all(&db_dir).inspect_err("Failed to create directory");
    }

    // Create a new SQLite database connection
    Connection::open(db_path)
}
