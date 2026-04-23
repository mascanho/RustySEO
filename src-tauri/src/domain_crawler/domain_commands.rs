use std::{
    collections::HashMap,
    sync::{Arc, RwLock},
};

use rust_xlsxwriter::XlsxError;
use serde_json::Value;

use crate::{domain_crawler::domain_crawler, settings::settings::Settings, AppState};

use super::{
    database::{self, analyse_diffs, DiffAnalysis, Differential},
    excel::create_xlsx::{
        generate_css_table, generate_excel_main_table, generate_excel_two_cols,
        generate_keywords_excel, generate_links_table_excel, generate_xlsx,
    },
    models::DomainCrawlResults,
};

#[tauri::command]
pub async fn domain_crawl_command(
    domain: String,
    app_handle: tauri::AppHandle,
    settings_state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    // Create and initialize the database
    let mut db = match database::Database::new("deep_crawl_batches.db") {
        Ok(db) => db,
        Err(e) => {
            let error_msg = format!("Failed to create database: {}", e);
            eprintln!("{}", error_msg);
            return Err(error_msg);
        }
    };

    // Initialize the database (create tables)
    if let Err(e) = db.initialize().await {
        let error_msg = format!("Failed to initialize database: {}", e);
        eprintln!("{}", error_msg);
        return Err(error_msg);
    }

    // Clear existing data from the database
    if let Err(e) = db.clear().await {
        let error_msg = format!("Failed to clear database: {}", e);
        eprintln!("{}", error_msg);
        return Err(error_msg);
    }

    // Call the crawl_domain function with a clone of the database
    match domain_crawler::crawl_domain(&domain, app_handle, Ok(db.clone()), settings_state).await {
        Ok(_) => {
            println!("Crawl finished successfully.");
            // Verify database contents using the original db
            match db.count_rows().await {
                Ok(count) => println!("Database contains {} rows after crawl", count),
                Err(e) => eprintln!("Failed to count rows: {}", e),
            }
            Ok(())
        }
        Err(e) => {
            eprintln!("Crawl error: {}", e);
            Err(e)
        }
    }
}

#[tauri::command]
pub async fn create_excel(data: Vec<Value>) -> Result<Vec<u8>, String> {
    // Call the export_to_excel function and handle its result
    match generate_xlsx(data) {
        Ok(file) => Ok(file),
        Err(e) => {
            eprintln!("Error: {}", e);
            // Explicitly return the error
            Err(e)
        }
    }
}

// GENERATE THE EXCEL FROM THE MAIN TABLE
#[tauri::command]
pub async fn create_excel_main_table(data: Vec<Value>) -> Result<Vec<u8>, String> {
    match generate_excel_main_table(data) {
        Ok(file) => Ok(file),
        Err(e) => {
            // eprintln!("Error: {}", e);
            // Explicitly return the error
            Err(e)
        }
    }
}

// GENERATE EXCEL DIRECTLY FROM SQLITE WITHOUT FRONTEND LIMITS
#[tauri::command]
pub async fn export_full_crawl_to_excel_command() -> Result<Vec<u8>, String> {
    let db = database::get_or_create_shared_db().await.map_err(|e| e.to_string())?;
    
    // Fetch all raw data from SQLite (bypassing frontend memory limits)
    let all_data: Vec<Value> = db.get_all_crawl_data().await
        .map_err(|e| e.to_string())?;

    // Generate Excel
    match generate_excel_main_table(all_data) {
        Ok(file) => Ok(file),
        Err(e) => Err(e),
    }
}

// CREATE THE EXCEL FROM THE TABLE
#[tauri::command]
pub async fn create_excel_two_cols(data: Vec<Value>) -> Result<Vec<u8>, String> {
    match generate_excel_two_cols(data) {
        Ok(file) => Ok(file),
        Err(e) => {
            eprintln!("Error: {}", e);
            Err(e)
        }
    }
}

// CREATE THE CSS EXCEL FROM THE TABLE
#[tauri::command]
pub async fn create_css_excel(data: Vec<Value>) -> Result<Vec<u8>, String> {
    match generate_css_table(data) {
        Ok(file) => Ok(file),
        Err(e) => {
            eprintln!("Error: {}", e);
            Err(e)
        }
    }
}

// CREATE THE EXCEL FROM THE KEYWORDS TABLE
#[tauri::command]
pub async fn create_keywords_excel_command(data: Vec<Value>) -> Result<Vec<u8>, String> {
    match generate_keywords_excel(data) {
        Ok(file) => Ok(file),
        Err(e) => {
            eprintln!("Error: {}", e);
            Err(e)
        }
    }
}

#[tauri::command]
pub async fn generate_links_table_xlsx_command(data: Vec<Value>) -> Result<Vec<u8>, String> {
    match generate_links_table_excel(data) {
        Ok(file) => Ok(file),
        Err(e) => {
            eprintln!("Error: {}", e);
            Err(e)
        }
    }
}

// GET THE DIFFERENCES BETWWEN THE CRAWLS
#[tauri::command]
pub async fn get_url_diff_command() -> Result<DiffAnalysis, String> {
    database::analyse_diffs().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn clone_crawl_data_command() -> Result<(), String> {
    database::clone_batched_crawl_into_persistent_db()
        .await
        .map_err(|e| e.to_string())
}
#[tauri::command]
pub async fn get_url_data_command(url: String) -> Result<Value, String> {
    let db = database::get_or_create_shared_db().await.map_err(|e| e.to_string())?;
    db.get_url_data(url).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_aggregated_crawl_data_command(data_type: String) -> Result<Value, String> {
    let db = database::get_or_create_shared_db().await.map_err(|e| e.to_string())?;
    db.get_aggregated_crawl_data(data_type).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_incoming_links_command(target_url: String) -> Result<Value, String> {
    let db = database::get_or_create_shared_db().await.map_err(|e| e.to_string())?;
    db.get_incoming_links(target_url).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_crawl_page_command(
    limit: i64,
    offset: i64,
    search: Option<String>,
) -> Result<Value, String> {
    let db = database::get_or_create_shared_db().await.map_err(|e| e.to_string())?;
    db.get_crawl_page(limit, offset, search).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_crawl_total_count_command(search: Option<String>) -> Result<i64, String> {
    let db = database::get_or_create_shared_db().await.map_err(|e| e.to_string())?;
    db.get_crawl_total_count(search).await.map_err(|e| e.to_string())
}

// EXPORT DATA DIRECTLY FROM DATABASE - BYPASS FRONTEND MEMORY LIMITS

#[tauri::command]
pub async fn export_images_to_excel_command() -> Result<Vec<u8>, String> {
    let db = database::get_or_create_shared_db().await.map_err(|e| e.to_string())?;
    let images_data = db.get_aggregated_crawl_data("images".to_string()).await
        .map_err(|e| e.to_string())?;
    
    match images_data {
        Value::Array(data) => {
            crate::domain_crawler::excel::create_xlsx::generate_images_excel(data)
        }
        _ => Err("Invalid data format for images".to_string()),
    }
}

#[tauri::command]
pub async fn export_keywords_to_excel_command() -> Result<Vec<u8>, String> {
    let db = database::get_or_create_shared_db().await.map_err(|e| e.to_string())?;
    let keywords_data = db.get_aggregated_crawl_data("keywords".to_string()).await
        .map_err(|e| e.to_string())?;
    
    match keywords_data {
        Value::Array(data) => {
            crate::domain_crawler::excel::create_xlsx::generate_keywords_excel(data)
        }
        _ => Err("Invalid data format for keywords".to_string()),
    }
}

#[tauri::command]
pub async fn export_redirects_to_excel_command() -> Result<Vec<u8>, String> {
    let db = database::get_or_create_shared_db().await.map_err(|e| e.to_string())?;
    let redirects_data = db.get_aggregated_crawl_data("redirects".to_string()).await
        .map_err(|e| e.to_string())?;
    
    match redirects_data {
        Value::Array(data) => {
            crate::domain_crawler::excel::create_xlsx::generate_redirects_excel(data)
        }
        _ => Err("Invalid data format for redirects".to_string()),
    }
}

#[tauri::command]
pub async fn export_internal_links_to_excel_command() -> Result<Vec<u8>, String> {
    let db = database::get_or_create_shared_db().await.map_err(|e| e.to_string())?;
    let links_data = db.get_aggregated_crawl_data("internal_links".to_string()).await
        .map_err(|e| e.to_string())?;
    
    match links_data {
        Value::Array(data) => {
            crate::domain_crawler::excel::create_xlsx::generate_links_table_excel(data)
        }
        _ => Err("Invalid data format for internal links".to_string()),
    }
}

#[tauri::command]
pub async fn export_external_links_to_excel_command() -> Result<Vec<u8>, String> {
    let db = database::get_or_create_shared_db().await.map_err(|e| e.to_string())?;
    let links_data = db.get_aggregated_crawl_data("external_links".to_string()).await
        .map_err(|e| e.to_string())?;
    
    match links_data {
        Value::Array(data) => {
            crate::domain_crawler::excel::create_xlsx::generate_links_table_excel(data)
        }
        _ => Err("Invalid data format for external links".to_string()),
    }
}

#[tauri::command]
pub async fn export_scripts_to_excel_command() -> Result<Vec<u8>, String> {
    let db = database::get_or_create_shared_db().await.map_err(|e| e.to_string())?;
    let scripts_data = db.get_aggregated_crawl_data("scripts".to_string()).await
        .map_err(|e| e.to_string())?;
    
    match scripts_data {
        Value::Array(data) => {
            crate::domain_crawler::excel::create_xlsx::generate_excel_two_cols(data)
        }
        _ => Err("Invalid data format for scripts".to_string()),
    }
}

#[tauri::command]
pub async fn export_files_to_excel_command() -> Result<Vec<u8>, String> {
    let db = database::get_or_create_shared_db().await.map_err(|e| e.to_string())?;
    let files_data = db.get_aggregated_crawl_data("files".to_string()).await
        .map_err(|e| e.to_string())?;
    
    match files_data {
        Value::Array(data) => {
            crate::domain_crawler::excel::create_xlsx::generate_files_excel(data)
        }
        _ => Err("Invalid data format for files".to_string()),
    }
}

#[tauri::command]
pub async fn export_cwv_to_excel_command() -> Result<Vec<u8>, String> {
    let db = database::get_or_create_shared_db().await.map_err(|e| e.to_string())?;
    let cwv_data = db.get_aggregated_crawl_data("cwv".to_string()).await
        .map_err(|e| e.to_string())?;
    
    match cwv_data {
        Value::Array(data) => {
            crate::domain_crawler::excel::create_xlsx::generate_cwv_excel(data)
        }
        _ => Err("Invalid data format for CWV".to_string()),
    }
}
