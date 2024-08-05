use crate::crawler::db;
use crate::crawler::libs;

// ---------------- READ SEO PAGE DATA FROM THE DB ----------------
#[tauri::command]
pub fn read_seo_data_from_db() -> Result<Vec<db::SEOResultRecord>, String> {
    let result = db::read_seo_data_from_db();
    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    }
}

// CHECK THE LINKS STATUS CODES
#[tauri::command]
pub async fn check_links() -> Result<Vec<libs::LinkStatus>, String> {
    let result = libs::check_links().await;
    match result {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
    }
}
