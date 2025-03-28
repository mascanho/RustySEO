use std::collections::HashMap;

use rust_xlsxwriter::XlsxError;
use serde_json::Value;

use crate::domain_crawler::domain_crawler;

use super::{
    excel::create_xlsx::{
        generate_css_table, generate_excel_main_table, generate_excel_two_cols,
        generate_links_excel, generate_xlsx,
    },
    models::DomainCrawlResults,
};

#[tauri::command]
pub async fn domain_crawl_command(
    domain: String,
    app_handle: tauri::AppHandle,
) -> Result<Vec<DomainCrawlResults>, String> {
    // Call the crawl_domain function and handle its result
    match domain_crawler::crawl_domain(&domain, app_handle).await {
        Ok(links) => {
            // println!("Discovered links with titles:");
            for data in &links {
                // println!(
                //     "URL: {:?}, Title: {:?} Description: {:?}",
                //     data.url, data.title, data.description
                // );
            }
            // Explicitly return the data crawled
            Ok(links)
        }
        Err(e) => {
            eprintln!("Error: {}", e);
            // Explicitly return the error
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
            eprintln!("Error: {}", e);
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
// CREATE THE EXCEL FROM THE LINKS TABLE
#[tauri::command]
pub async fn create_links_excel(data: Vec<Value>) -> Result<Vec<u8>, String> {
    match generate_links_excel(data) {
        Ok(file) => Ok(file),
        Err(e) => {
            eprintln!("Error: {}", e);
            Err(e)
        }
    }
}
