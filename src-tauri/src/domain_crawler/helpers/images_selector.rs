use futures::stream::{self, StreamExt};
use once_cell::sync::Lazy;
use reqwest::StatusCode;
use scraper::{Html, Selector};
use tokio::time::{timeout, Duration};
use url::Url;

/// Maximum number of concurrent image HEAD requests per page.
/// Prevents opening too many sockets at once.
const MAX_CONCURRENT_IMAGE_FETCHES: usize = 10;

static IMG_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("img").expect("Failed to parse img selector"));

/// Extracts image URLs, alt tags, and a boolean indicating if width or height is not specified.
///
/// # Arguments
/// * `document` - The parsed HTML document.
/// * `base_url` - The base URL used to resolve relative image URLs.
///
/// # Returns
/// A vector of tuples containing the image URL, alt text, and a boolean indicating if width or height is not specified.
pub fn extract_image_urls_and_alts(document: &Html, base_url: &Url) -> Vec<(Url, String, bool)> {
    document
        .select(&IMG_SELECTOR)
        .filter_map(|element| {
            let src = element
                .value()
                .attr("src")
                .or_else(|| element.value().attr("data-src"))?;

            let url = base_url.join(src).ok()?;
            let alt = element.value().attr("alt").unwrap_or("").to_string();
            let is_size_not_specified =
                element.value().attr("width").is_none() || element.value().attr("height").is_none();

            Some((url, alt, is_size_not_specified))
        })
        .collect()
}

/// Fetches the size, content type, and status code of an image using a HEAD request.
async fn fetch_image_size(client: &reqwest::Client, url: &Url) -> Result<(u64, String, u16), String> {
    let timeout_duration = Duration::from_secs(5);

    let response = timeout(
        timeout_duration,
        client.head(url.as_str()).send(),
    )
    .await
    .map_err(|_| format!("Timeout while fetching image: {}", url))?
    .map_err(|e| format!("Failed to send request for {}: {}", url, e))?;

    let status_code = response.status();
    let status_code_int = status_code.as_u16();

    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or("")
        .to_string();

    let mut content_length: u64 = 0;

    if status_code == StatusCode::OK {
        if !content_type.contains("image") {
            return Err(format!("Non-image content type: {}", url));
        }

        content_length = response
            .headers()
            .get(reqwest::header::CONTENT_LENGTH)
            .and_then(|value| value.to_str().ok())
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(0);
    }

    Ok((content_length, content_type, status_code_int))
}

/// Extracts image URLs, alt tags, sizes, content types, status codes, and a boolean indicating if width or height is not specified.
///
/// Uses bounded concurrency (buffer_unordered) and a global semaphore
/// to prevent opening too many sockets simultaneously across all pages.
pub async fn fetch_image_details(
    client: &reqwest::Client,
    image_urls_and_alts: Vec<(Url, String, bool)>,
    image_semaphore: std::sync::Arc<tokio::sync::Semaphore>,
) -> Result<Vec<(String, String, u64, String, u16, bool)>, String> {
    let client = client.clone();
    let results: Vec<_> = stream::iter(image_urls_and_alts.into_iter().enumerate())
        .map(|(index, (image_url, alt, is_size_not_specified))| {
            let client_ref = client.clone();
            let semaphore = image_semaphore.clone();
            async move {
                // Stagger image requests globally to prevent instantaneous bursts (100ms per index offset)
                // This spreads 50 images across 5 seconds instead of 0 seconds.
                tokio::time::sleep(tokio::time::Duration::from_millis((index as u64) * 100)).await;

                let url_string = image_url.to_string();

                let _permit = match semaphore.acquire().await {
                    Ok(p) => p,
                    Err(_) => return (url_string, alt, 0, String::new(), 0, is_size_not_specified),
                };

                match fetch_image_size(&client_ref, &image_url).await {
                    Ok((size, content_type, status_code)) => {
                        (
                            url_string,
                            alt,
                            size,
                            content_type,
                            status_code,
                            is_size_not_specified,
                        )
                    }
                    Err(e) => {
                        eprintln!("{}", e);
                        (url_string, alt, 0, String::new(), 0, is_size_not_specified)
                    }
                }
            }
        })
        .buffer_unordered(MAX_CONCURRENT_IMAGE_FETCHES)
        .collect()
        .await;

    Ok(results)
}
