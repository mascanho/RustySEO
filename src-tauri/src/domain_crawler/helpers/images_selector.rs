use reqwest::StatusCode;
use scraper::{Html, Selector};
use std::error::Error;
use tokio::time::{timeout, Duration};
use url::Url;

/// Extracts image URLs and alt tags from the HTML content.
pub fn extract_image_urls_and_alts(html: &str, base_url: &Url) -> Vec<(Url, String)> {
    let document = Html::parse_document(html);
    let img_selector = Selector::parse("img").expect("Failed to parse img selector");

    document
        .select(&img_selector)
        .filter_map(|element| {
            // Check both `src` and `data-src` attributes
            let src = element
                .value()
                .attr("src")
                .or_else(|| element.value().attr("data-src"))?;

            // Convert relative URLs to absolute URLs
            let url = base_url.join(src).ok()?;

            // Get the `alt` attribute or use an empty string if it doesn't exist
            let alt = element.value().attr("alt").unwrap_or("").to_string();

            Some((url, alt))
        })
        .collect()
}

/// Fetches the size of an image using a HEAD request with a timeout.
async fn fetch_image_size(url: &Url) -> Result<u64, String> {
    // Set a timeout for the request (e.g., 5 seconds)
    let timeout_duration = Duration::from_secs(5);

    let response = timeout(
        timeout_duration,
        reqwest::Client::new().head(url.as_str()).send(),
    )
    .await
    .map_err(|_| format!("Timeout while fetching image: {}", url))?
    .map_err(|e| format!("Failed to send request for {}: {}", url, e))?;

    if response.status() == StatusCode::OK {
        let content_length = response
            .headers()
            .get(reqwest::header::CONTENT_LENGTH)
            .and_then(|value| value.to_str().ok())
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(0);

        Ok(content_length)
    } else {
        Err(format!(
            "Failed to fetch image: {} (status: {})",
            url,
            response.status()
        ))
    }
}

/// Main function to extract image URLs, alt tags, and their sizes.
pub async fn extract_images_with_sizes_and_alts(
    html: &str,
    base_url: &Url,
) -> Result<Vec<(String, String, u64)>, String> {
    // Extract image URLs and alt tags from the HTML
    let image_urls_and_alts = extract_image_urls_and_alts(html, base_url);

    // Fetch the size of each image
    let mut image_details = Vec::new();
    for (image_url, alt) in image_urls_and_alts {
        match fetch_image_size(&image_url).await {
            Ok(size) => image_details.push((image_url.to_string(), alt, size)),
            Err(e) => eprintln!("{}", e), // Log the error but continue processing
        }
    }

    Ok(image_details)
}
