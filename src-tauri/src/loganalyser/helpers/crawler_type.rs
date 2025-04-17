pub fn is_crawler(user_agent: &str) -> bool {
    let crawler_indicators = [
        "bot",
        "crawler",
        "spider",
        "google",
        "bing",
        "yahoo",
        "duckduck",
        "baidu",
        "yandex",
        "uptimerobot",
    ];

    let ua_lower = user_agent.to_lowercase();
    crawler_indicators
        .iter()
        .any(|indicator| ua_lower.contains(indicator))
}
