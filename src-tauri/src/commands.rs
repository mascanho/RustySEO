use crate::crawler::db;
use crate::schema;

// ---------------- READ SEO PAGE DATA FROM THE DB ----------------
#[tauri::command]
pub fn read_seo_data_from_db() -> Result<Vec<db::SEOResultRecord>, String> {
    let result = db::read_seo_data_from_db();
    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    }
}
