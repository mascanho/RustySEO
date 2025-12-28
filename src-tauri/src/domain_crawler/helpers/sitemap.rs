use reqwest::StatusCode;
use url::Url;

pub async fn get_sitemap(base: &Url) -> Result<Vec<String>, String> {
    // Multiple sitemap locations to check
    let paths = ["sitemap.xml", "sitemap_index.xml", "custom_sitemap.xml"];

    // Vector to store sitemap content
    let mut sitemaps = Vec::new();

    for path in paths {
        // Construct the full URL for the sitemap
        let sitemap_url = base.join(path).map_err(|e| e.to_string())?;
        println!("Checking sitemap at: {}", sitemap_url);

        // Send a GET request to the sitemap URL
        let response = reqwest::get(sitemap_url.as_str())
            .await
            .map_err(|e| e.to_string())?;

        // Check if the request was successful
        if response.status() != StatusCode::OK {
            println!("Sitemap not found at: {}", sitemap_url);
            continue; // Skip to the next path
        }

        // Read the response body as a string
        let body = response.text().await.map_err(|e| e.to_string())?;

        // Add the sitemap content to the vector
        sitemaps.push(body);
    }

    // Return the collected sitemap content
    Ok(sitemaps)
}
