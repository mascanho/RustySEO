pub async fn get_page_speed_insights(
    url: String,
    strategy: Option<String>,
) -> Result<(PageSpeedResponse, SeoPageSpeedResponse), String> {
    let api_key = get_api_key().await;
    let client = reqwest::Client::new();
    let mut url = format!(
        "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={}&key={}",
        url, api_key
    );

    if let Some(strategy) = strategy {
        url.push_str(&format!("&strategy={}", strategy));
    }

    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let status_code = response.status();

    if !status_code.is_success() {
        return Err(format!("Error: {}", status_code));
    }

    let body = response.text().await.map_err(|e| e.to_string())?;
    let page_speed_response: PageSpeedResponse =
        serde_json::from_str(&body).map_err(|e| e.to_string())?;

    let seo_response = SeoPageSpeedResponse::from_page_speed_response(&page_speed_response);

    Ok((page_speed_response, seo_response))
}
