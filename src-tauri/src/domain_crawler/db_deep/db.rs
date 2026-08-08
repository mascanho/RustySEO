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
            total_mobile_pages INTEGER NOT NULL DEFAULT 0,
            missing_h1 INTEGER NOT NULL DEFAULT 0,
            missing_canonical INTEGER NOT NULL DEFAULT 0,
            thin_content_pages INTEGER NOT NULL DEFAULT 0,
            noindex_pages INTEGER NOT NULL DEFAULT 0,
            mixed_content_pages INTEGER NOT NULL DEFAULT 0,
            cookies_pages INTEGER NOT NULL DEFAULT 0,
            avg_word_count INTEGER NOT NULL DEFAULT 0,
            avg_readability INTEGER NOT NULL DEFAULT 0,
            avg_page_size_kb INTEGER NOT NULL DEFAULT 0,
            duplicate_titles INTEGER NOT NULL DEFAULT 0,
            duplicate_descriptions INTEGER NOT NULL DEFAULT 0,
            status_2xx INTEGER NOT NULL DEFAULT 0,
            status_3xx INTEGER NOT NULL DEFAULT 0,
            status_4xx INTEGER NOT NULL DEFAULT 0,
            status_5xx INTEGER NOT NULL DEFAULT 0
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
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN missing_h1 INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN missing_canonical INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN thin_content_pages INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN noindex_pages INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN mixed_content_pages INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN cookies_pages INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN avg_word_count INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN avg_readability INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN avg_page_size_kb INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN duplicate_titles INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN duplicate_descriptions INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN status_2xx INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN status_3xx INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN status_4xx INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE deep_crawls_history ADD COLUMN status_5xx INTEGER NOT NULL DEFAULT 0", []);

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
    pub missing_h1: i32,
    pub missing_canonical: i32,
    pub thin_content_pages: i32,
    pub noindex_pages: i32,
    pub mixed_content_pages: i32,
    pub cookies_pages: i32,
    pub avg_word_count: i32,
    pub avg_readability: i32,
    pub avg_page_size_kb: i32,
    pub duplicate_titles: i32,
    pub duplicate_descriptions: i32,
    pub status_2xx: i32,
    pub status_3xx: i32,
    pub status_4xx: i32,
    pub status_5xx: i32,
}

#[tauri::command]
pub fn read_domain_results_history_table() -> Result<Vec<DeepCrawlHistory>, String> {
    // Open the database connection
    let conn = open_domain_db_connection("deep_crawl.db").map_err(|e| e.to_string())?;

    // Prepare the SQL query to read data
    let mut stmt = conn
        .prepare(
            "SELECT id, domain, date, pages, errors, status, total_links, total_internal_links, total_external_links, indexable_pages, not_indexable_pages, total_css, total_javascript, total_images, total_redirects, missing_title, missing_description, avg_response_time, max_crawl_depth, total_secure_pages, total_schema_pages, total_mobile_pages, missing_h1, missing_canonical, thin_content_pages, noindex_pages, mixed_content_pages, cookies_pages, avg_word_count, avg_readability, avg_page_size_kb, duplicate_titles, duplicate_descriptions, status_2xx, status_3xx, status_4xx, status_5xx
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
                missing_h1: row.get(22)?,
                missing_canonical: row.get(23)?,
                thin_content_pages: row.get(24)?,
                noindex_pages: row.get(25)?,
                mixed_content_pages: row.get(26)?,
                cookies_pages: row.get(27)?,
                avg_word_count: row.get(28)?,
                avg_readability: row.get(29)?,
                avg_page_size_kb: row.get(30)?,
                duplicate_titles: row.get(31)?,
                duplicate_descriptions: row.get(32)?,
                status_2xx: row.get(33)?,
                status_3xx: row.get(34)?,
                status_4xx: row.get(35)?,
                status_5xx: row.get(36)?,
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
pub fn delete_domain_results_history(domain: String) -> Result<(), String> {
    let conn = open_domain_db_connection("deep_crawl.db").map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM deep_crawls_history WHERE domain = ?1",
        params![&domain],
    )
    .map_err(|e| e.to_string())?;

    println!("Deleted historical data for domain: {}", domain);

    Ok(())
}

#[tauri::command]
pub fn delete_domain_result_by_id(id: i32) -> Result<(), String> {
    let conn = open_domain_db_connection("deep_crawl.db").map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM deep_crawls_history WHERE id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;

    println!("Deleted history row id: {}", id);

    Ok(())
}

#[tauri::command]
pub fn delete_domain_results_by_ids(ids: Vec<i32>) -> Result<(), String> {
    if ids.is_empty() {
        return Ok(());
    }

    let conn = open_domain_db_connection("deep_crawl.db").map_err(|e| e.to_string())?;

    let placeholders: Vec<String> = ids.iter().map(|_| "?".to_string()).collect();
    let sql = format!(
        "DELETE FROM deep_crawls_history WHERE id IN ({})",
        placeholders.join(",")
    );

    let params: Vec<&dyn rusqlite::ToSql> =
        ids.iter().map(|id| id as &dyn rusqlite::ToSql).collect();

    conn.execute(&sql, params.as_slice())
        .map_err(|e| e.to_string())?;

    println!("Deleted {} history row(s): {:?}", ids.len(), ids);

    Ok(())
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
                domain, date, pages, errors, status, total_links, total_internal_links, total_external_links, indexable_pages, not_indexable_pages, total_css, total_javascript, total_images, total_redirects, missing_title, missing_description, avg_response_time, max_crawl_depth, total_secure_pages, total_schema_pages, total_mobile_pages, missing_h1, missing_canonical, thin_content_pages, noindex_pages, mixed_content_pages, cookies_pages, avg_word_count, avg_readability, avg_page_size_kb, duplicate_titles, duplicate_descriptions, status_2xx, status_3xx, status_4xx, status_5xx
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28, ?29, ?30, ?31, ?32, ?33, ?34, ?35, ?36)",
            params![
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
                &item.missing_h1.to_string(),
                &item.missing_canonical.to_string(),
                &item.thin_content_pages.to_string(),
                &item.noindex_pages.to_string(),
                &item.mixed_content_pages.to_string(),
                &item.cookies_pages.to_string(),
                &item.avg_word_count.to_string(),
                &item.avg_readability.to_string(),
                &item.avg_page_size_kb.to_string(),
                &item.duplicate_titles.to_string(),
                &item.duplicate_descriptions.to_string(),
                &item.status_2xx.to_string(),
                &item.status_3xx.to_string(),
                &item.status_4xx.to_string(),
                &item.status_5xx.to_string(),
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    println!("Data written to the database successfully");

    // Return a success message
    Ok("Data inserted successfully".to_string())
}

// HANDLE THE CUSTOM SEARCH RULES
//
// Multiple named rules, each independently enabled, persisted across app
// restarts (nothing here wipes the table on launch — see main.rs, which
// used to call a since-removed clear_custom_search() on every startup).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SearchMode {
    Css,
    Regex,
}

impl SearchMode {
    fn as_str(&self) -> &'static str {
        match self {
            SearchMode::Css => "css",
            SearchMode::Regex => "regex",
        }
    }

    fn from_str(s: &str) -> Self {
        match s {
            "regex" => SearchMode::Regex,
            _ => SearchMode::Css,
        }
    }
}

// Html/Attribute only apply in Css mode (element outerHTML / attribute
// value); Regex mode always matches against the page's visible text.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SearchTarget {
    Text,
    Html,
    Attribute,
}

impl SearchTarget {
    fn as_str(&self) -> &'static str {
        match self {
            SearchTarget::Text => "text",
            SearchTarget::Html => "html",
            SearchTarget::Attribute => "attribute",
        }
    }

    fn from_str(s: &str) -> Self {
        match s {
            "html" => SearchTarget::Html,
            "attribute" => SearchTarget::Attribute,
            _ => SearchTarget::Text,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CustomSearchRule {
    pub id: i64,
    pub name: String,
    pub mode: SearchMode,
    pub pattern: String, // CSS selector, or regex source
    pub search_text: Option<String>, // Css mode "contains" check; empty/None = "match if selector found"
    pub target: SearchTarget,
    pub attribute_name: Option<String>, // used when target == Attribute
    pub enabled: bool,
    pub created_at: String,
}

fn ensure_custom_search_rules_table(conn: &Connection) -> Result<(), String> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS custom_search_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            mode TEXT NOT NULL,
            pattern TEXT NOT NULL,
            search_text TEXT,
            target TEXT NOT NULL,
            attribute_name TEXT,
            enabled INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn row_to_rule(row: &rusqlite::Row) -> rusqlite::Result<CustomSearchRule> {
    let mode_str: String = row.get(2)?;
    let target_str: String = row.get(5)?;
    Ok(CustomSearchRule {
        id: row.get(0)?,
        name: row.get(1)?,
        mode: SearchMode::from_str(&mode_str),
        pattern: row.get(3)?,
        search_text: row.get(4)?,
        target: SearchTarget::from_str(&target_str),
        attribute_name: row.get(6)?,
        enabled: row.get::<_, i64>(7)? != 0,
        created_at: row.get(8)?,
    })
}

#[tauri::command]
pub fn list_custom_search_rules() -> Result<Vec<CustomSearchRule>, String> {
    let conn = open_domain_db_connection("deep_crawl.db").map_err(|e| e.to_string())?;
    ensure_custom_search_rules_table(&conn)?;

    let mut stmt = conn
        .prepare(
            "SELECT id, name, mode, pattern, search_text, target, attribute_name, enabled, created_at
             FROM custom_search_rules ORDER BY id ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], row_to_rule)
        .map_err(|e| e.to_string())?;

    let mut rules = Vec::new();
    for row in rows {
        rules.push(row.map_err(|e| e.to_string())?);
    }
    Ok(rules)
}

#[tauri::command]
pub fn create_custom_search_rule(rule: CustomSearchRule) -> Result<CustomSearchRule, String> {
    let conn = open_domain_db_connection("deep_crawl.db").map_err(|e| e.to_string())?;
    ensure_custom_search_rules_table(&conn)?;

    let created_at = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO custom_search_rules (name, mode, pattern, search_text, target, attribute_name, enabled, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            &rule.name,
            rule.mode.as_str(),
            &rule.pattern,
            &rule.search_text,
            rule.target.as_str(),
            &rule.attribute_name,
            rule.enabled as i64,
            &created_at,
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(CustomSearchRule {
        id,
        created_at,
        ..rule
    })
}

#[tauri::command]
pub fn update_custom_search_rule(rule: CustomSearchRule) -> Result<(), String> {
    let conn = open_domain_db_connection("deep_crawl.db").map_err(|e| e.to_string())?;
    ensure_custom_search_rules_table(&conn)?;

    conn.execute(
        "UPDATE custom_search_rules
         SET name = ?1, mode = ?2, pattern = ?3, search_text = ?4, target = ?5, attribute_name = ?6, enabled = ?7
         WHERE id = ?8",
        params![
            &rule.name,
            rule.mode.as_str(),
            &rule.pattern,
            &rule.search_text,
            rule.target.as_str(),
            &rule.attribute_name,
            rule.enabled as i64,
            rule.id,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn delete_custom_search_rule(id: i64) -> Result<(), String> {
    let conn = open_domain_db_connection("deep_crawl.db").map_err(|e| e.to_string())?;
    ensure_custom_search_rules_table(&conn)?;

    conn.execute("DELETE FROM custom_search_rules WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn set_custom_search_rule_enabled(id: i64, enabled: bool) -> Result<(), String> {
    let conn = open_domain_db_connection("deep_crawl.db").map_err(|e| e.to_string())?;
    ensure_custom_search_rules_table(&conn)?;

    conn.execute(
        "UPDATE custom_search_rules SET enabled = ?1 WHERE id = ?2",
        params![enabled as i64, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

// Used only by extractors/html.rs's per-crawl cache refresh — not a Tauri
// command. Uses a direct Connection instead of creating a pool every time,
// since this is called for every URL during crawling.
pub async fn fetch_enabled_custom_search_rules() -> Result<Vec<CustomSearchRule>, String> {
    let project_dirs =
        ProjectDirs::from("", "", "rustyseo").expect("Failed to get project directories");

    let db_dir = project_dirs.data_dir().join("db");
    let db_path = db_dir.join("deep_crawl.db");

    if !db_dir.exists() {
        std::fs::create_dir_all(&db_dir).expect("Failed to create directory");
    }

    let rules = task::spawn_blocking(move || {
        let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
        ensure_custom_search_rules_table(&conn)?;

        let mut stmt = conn
            .prepare(
                "SELECT id, name, mode, pattern, search_text, target, attribute_name, enabled, created_at
                 FROM custom_search_rules WHERE enabled = 1",
            )
            .map_err(|e| e.to_string())?;

        let rule_iter = stmt.query_map(params![], row_to_rule).map_err(|e| e.to_string())?;

        let rules: Result<Vec<_>, _> = rule_iter.collect();
        rules.map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())??;

    Ok(rules)
}
