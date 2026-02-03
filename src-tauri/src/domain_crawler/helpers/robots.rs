use reqwest::Client;
use url::Url;

pub struct RobotsData {
    pub raw_text: Vec<String>,
    pub blocked_urls: Vec<String>,
}

pub async fn get_robots_data(base_url: &Url) -> Option<RobotsData> {
    let client = Client::new();
    let robots_url = base_url.join("robots.txt").ok()?;

    let response = client.get(robots_url).send().await.ok()?;
    if response.status() != 200 {
        return None;
    }

    let body = response.text().await.ok()?;
    if body.is_empty() {
        return None;
    }

    let mut blocked_urls = Vec::new();
    let lines = body.lines();

    for line in lines {
        let line = line.trim();
        if line.to_lowercase().starts_with("disallow:") {
            let path = line["disallow:".len()..].trim();
            if !path.is_empty() {
                if let Ok(full_url) = base_url.join(path) {
                    blocked_urls.push(full_url.to_string());
                }
            }
        }
    }

    Some(RobotsData {
        raw_text: vec![body],
        blocked_urls,
    })
}

pub async fn get_domain_robots(base_url: &Url) -> Option<Vec<String>> {
    get_robots_data(base_url).await.map(|d| d.raw_text)
}

pub async fn get_urls_from_robots(base_url: &Url) -> Option<Vec<String>> {
    get_robots_data(base_url).await.map(|d| d.blocked_urls)
}
