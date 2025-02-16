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
