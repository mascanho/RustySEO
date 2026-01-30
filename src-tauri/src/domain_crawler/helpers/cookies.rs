pub async fn extract_cookies(client: &reqwest::Client, url: &str) -> Result<Vec<String>, String> {
    let response = client.get(url).send().await.map_err(|e| e.to_string())?;
    let cookies = response
        .cookies()
        .map(|cookie| format!("{}={}", cookie.name(), cookie.value()))
        .collect();

    println!("Cookies: {:?}", cookies);

    Ok(cookies)
}
