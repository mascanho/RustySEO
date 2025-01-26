use crate::domain_crawler::domain_crawler;

use super::domain_crawler::DomainCrawlResults;

#[tauri::command]
pub async fn domain_crawl_command(domain: String) -> Result<Vec<DomainCrawlResults>, String> {
    // Call the crawl_domain function and handle its result
    match domain_crawler::crawl_domain(&domain).await {
        Ok(links) => {
            println!("Discovered links with titles:");
            for data in &links {
                println!(
                    "URL: {:?}, Title: {:?} Description: {:?}",
                    data.url, data.title, data.description
                );
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
