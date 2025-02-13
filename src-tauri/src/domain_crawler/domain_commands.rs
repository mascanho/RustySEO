use crate::domain_crawler::domain_crawler;
use crate::domain_crawler::excel::create_xlsx::export_to_excel;

use super::{excel::create_xlsx::TableRow, models::DomainCrawlResults};

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
pub async fn export_to_excel_command(data: Vec<TableRow>) -> Result<(), String> {
    // Call the export_to_excel function and handle its result
    match export_to_excel(data) {
        Ok(_) => Ok(()),
        Err(e) => {
            eprintln!("Error: {}", e);
            // Explicitly return the error
            Err(e)
        }
    }
}
