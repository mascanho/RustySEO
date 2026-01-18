use crate::domain_crawler::db_deep::db::{fetch_custom_search, ExtractorConfig};
use scraper::{Html, Selector};
use std::sync::{Arc, Mutex};
use tokio::sync::OnceCell;

// Global cache for custom_search results
static CUSTOM_SEARCH_CACHE: OnceCell<Mutex<Option<Vec<ExtractorConfig>>>> = OnceCell::const_new();

async fn get_custom_search() -> &'static Mutex<Option<Vec<ExtractorConfig>>> {
    CUSTOM_SEARCH_CACHE
        .get_or_init(|| async {
            Mutex::new(None) // Initialize the cache as None
        })
        .await
}

async fn fetch_and_update_cache() -> Result<(), String> {
    // Fetch new data from the database (outside the Mutex lock)
    let new_data = fetch_custom_search().await.map_err(|e| e.to_string())?;

    // Acquire the Mutex lock
    let cache = get_custom_search().await;
    let mut cache_lock = cache.lock().unwrap();

    // Compare new data with cached data
    if let Some(cached_data) = &*cache_lock {
        if *cached_data == new_data {
            // println!("Data is the same, keeping the cache.");
            return Ok(());
        }
    }

    // Update the cache with new data
    println!("Data has changed, updating the cache.");
    *cache_lock = Some(new_data);
    Ok(())
}

pub async fn update_cache() -> Result<(), String> {
    fetch_and_update_cache().await
}

pub fn perform_extraction(document: &Html) -> bool {
    // Get the cached custom_search results
    let cache = match CUSTOM_SEARCH_CACHE.get() {
        Some(c) => c,
        None => return false,
    };
    
    let cache_lock = cache.lock().unwrap();
    let custom_search = match &*cache_lock {
        Some(data) => data,
        None => return false,
    };

    // Extract the first configuration (if it exists)
    let (text_value, element) = match custom_search.get(0) {
        Some(value) => (
            value.config.attribute.clone(),
            value.config.selector.clone(),
        ),
        None => return false,
    };

    // Early exit if text_value is empty string
    if text_value.is_empty() {
        return false;
    } else {
        // Create a selector for the specified element
        if let Ok(selector) = Selector::parse(&element) {
            // Extract text from the selected element if it exists
            if let Some(body) = document.select(&selector).next() {
                let extracted_text: String = body.text().collect();

                // Check if the extracted text contains the search term
                if extracted_text.contains(&text_value) {
                    return true;
                }
            }
        }

        // Return false if the extraction does not exist
        false
    }
}


