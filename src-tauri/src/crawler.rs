use reqwest::Client;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

// Manage state

#[derive(Serialize, Deserialize, Debug)]
pub struct LinksData {
    pub links: Vec<String>,
}

#[derive(Serialize)]
pub struct LinkResult {
    pub links: Vec<String>,
}

#[derive(Serialize)]
pub struct HeadingsResult {
    headings: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CrawlResult {
    pub links: Vec<String>,
    pub headings: Vec<String>,
}

pub async fn crawl(url: String) -> Result<CrawlResult, String> {
    let client = Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Request error: {}", e))?;

    let mut links = Vec::new();
    let mut headings = Vec::new();

    if response.status().is_success() {
        let body = response
            .text()
            .await
            .map_err(|e| format!("Response error: {}", e))?;
        let document = Html::parse_document(&body);

        // Fetch links
        let link_selector = Selector::parse("a").map_err(|e| format!("Selector error: {}", e))?;
        for element in document.select(&link_selector) {
            if let Some(link) = element.value().attr("href") {
                links.push(link.to_string());
            }
        }

        // Fetch headings
        for level in 1..=6 {
            let heading_selector = Selector::parse(&format!("h{}", level))
                .map_err(|e| format!("Selector error: {}", e))?;
            for element in document.select(&heading_selector) {
                let text = element.text().collect::<Vec<_>>().join(" ");
                headings.push(text);
            }
        }
    } else {
        return Err(format!("Failed to fetch the URL: {}", response.status()));
    }

    Ok(CrawlResult { links, headings })
}
