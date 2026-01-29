use reqwest::Client;
use url::Url;

pub async fn get_domain_robots(base_url: &Url) -> Option<Vec<String>> {
    let client = Client::new();
    let robots_url = base_url.join("robots.txt").unwrap();

    let response = client.get(robots_url.clone()).send().await.ok()?;

    if response.status() != 200 {
        return None;
    }

    let body = response.text().await.ok()?;
    if body.is_empty() {
        return None;
    } else {
        let mut vec_robot = vec![];
        let robots = body;
        vec_robot.push(robots);
        Some(vec_robot)
    }
}

pub async fn get_urls_from_robots(base_url: &Url) -> Option<Vec<String>> {
    let client = Client::new();
    let robots_url = base_url.join("robots.txt").unwrap();

    let response = client.get(robots_url.clone()).send().await.ok()?;

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
            let path = line["Disallow:".len()..].trim();
            if !path.is_empty() {
                let full_url = base_url.join(path).ok()?;
                blocked_urls.push(full_url.to_string());
            }
        }
    }

    if blocked_urls.is_empty() {
        None
    } else {
        Some(blocked_urls)
    }
}
