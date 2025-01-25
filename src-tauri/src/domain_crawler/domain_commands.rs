use crate::domain_crawler::domain_crawler;

#[tauri::command]
pub async fn domain_crawl_command(domain: String) -> Result<Vec<(String, String)>, String> {
    // Call the crawl_domain function and handle its result
    match domain_crawler::crawl_domain(&domain).await {
        Ok(links_with_titles) => {
            println!("Discovered links with titles:");
            for (url, title) in &links_with_titles {
                println!("URL: {}, Title: {}", url, title);
            }
            // Explicitly return the links with titles
            Ok(links_with_titles)
        }
        Err(e) => {
            eprintln!("Error: {}", e);
            // Explicitly return the error
            Err(e)
        }
    }
}
