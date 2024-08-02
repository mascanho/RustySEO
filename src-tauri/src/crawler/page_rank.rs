use reqwest;
use serde::Deserialize;
use std::error::Error;

// Define the structs for the API response
#[derive(Debug, Deserialize)]
struct ApiResponse {
    status_code: u16,
    response: Vec<ResponseEntry>,
    last_updated: String,
}

#[derive(Debug, Deserialize)]
struct ResponseEntry {
    status_code: u16,
    error: String,
    page_rank_integer: u8,
    page_rank_decimal: f32,
    rank: String,
    domain: String,
}

// Function to fetch and return page_rank_decimal
pub async fn fetch_page_rank(url: &str) -> Result<f32, Box<dyn Error>> {
    let api_key = "44ss8gok0oo0c8kcckog0sgg8sswoswccgo08g80";
    let api_url = format!(
        "https://openpagerank.com/api/v1.0/getPageRank?domains[]={}",
        url
    );

    // Create HTTP client
    let client = reqwest::Client::new();

    // Send the GET request
    let response = client
        .get(&api_url)
        .header("API-OPR", api_key)
        .send()
        .await?;

    if response.status().is_success() {
        let body = response.text().await?;

        // Deserialize the JSON response into ApiResponse struct
        let api_response: ApiResponse = serde_json::from_str(&body)?;

        // Access the first entry in the response
        if let Some(entry) = api_response.response.first() {
            // Return the page_rank_decimal
            Ok(entry.page_rank_decimal)
        } else {
            Err("No response entries found".into())
        }
    } else {
        Err(format!("Failed to fetch data. Status: {}", response.status()).into())
    }
}
