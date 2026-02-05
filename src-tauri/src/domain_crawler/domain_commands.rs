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
    let db = database::Database::new("deep_crawl_batches.db").map_err(|e| e.to_string())?;
    db.get_url_data(url).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_aggregated_crawl_data_command(data_type: String) -> Result<Value, String> {
    let db = database::Database::new("deep_crawl_batches.db").map_err(|e| e.to_string())?;
    db.get_aggregated_crawl_data(data_type).await.map_err(|e| e.to_string())
}
