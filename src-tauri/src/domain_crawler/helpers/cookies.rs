pub fn extract_cookies(response: &reqwest::Response) -> Vec<String> {
    let cookies: Vec<String> = response
        .cookies()
        .map(|cookie| format!("{}={}", cookie.name(), cookie.value()))
        .collect();

    cookies
}
