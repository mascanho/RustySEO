pub fn extract_cookies(response: &reqwest::Response) -> Vec<String> {
    let cookies: Vec<String> = response
        .cookies()
        .map(|cookie| format!("{}={}", cookie.name(), cookie.value()))
        .collect();

    if !cookies.is_empty() {
        println!("Cookies found for {}: {:?}", response.url(), cookies);
    }

    cookies
}
