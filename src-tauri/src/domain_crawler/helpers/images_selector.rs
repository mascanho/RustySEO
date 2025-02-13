use futures::future::join_all;
use reqwest::StatusCode;
use scraper::{Html, Selector};
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
async fn fetch_image_size(url: &Url) -> Result<(u64, String), String> {
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
        // Check if the content type is an image
        let content_type = response
            .headers()
            .get(reqwest::header::CONTENT_TYPE)
            .and_then(|value| value.to_str().ok())
            .unwrap_or("")
            .to_string();

        if !content_type.contains("image") {
            return Err(format!("Non-image content type: {}", url));
        }

        // Get the content length in bytes
        let content_length = response
            .headers()
            .get(reqwest::header::CONTENT_LENGTH)
            .and_then(|value| value.to_str().ok())
            .and_then(|s| s.parse::<u64>().ok())
            .ok_or_else(|| format!("Missing or invalid Content-Length header for {}", url))?;

        // Convert to KB
        let size_kb = (content_length as f64) / 1024.0;

        Ok((size_kb as u64, content_type))
    } else {
        Err(format!(
            "Failed to fetch image: {} (status: {})",
            url,
            response.status()
        ))
    }
}

/// Main function to extract image URLs, alt tags, sizes, and content types.
pub async fn extract_images_with_sizes_and_alts(
    html: &str,
    base_url: &Url,
) -> Result<Vec<(String, String, u64, String)>, String> {
    // Extract image URLs and alt tags from the HTML
    let image_urls_and_alts = extract_image_urls_and_alts(html, base_url);

    // Create a list of futures to fetch image sizes and content types in parallel
    let fetch_futures = image_urls_and_alts
        .into_iter()
        .map(|(image_url, alt)| async move {
            match fetch_image_size(&image_url).await {
                Ok((size, content_type)) => Some((image_url.to_string(), alt, size, content_type)),
                Err(e) => {
                    eprintln!("{}", e); // Log the error but continue processing
                    None
                }
            }
        });

    // Execute all futures concurrently
    let results = join_all(fetch_futures).await;

    // Filter out `None` values (failed requests) and collect the results
    let image_details: Vec<_> = results.into_iter().flatten().collect();

    Ok(image_details)
}
