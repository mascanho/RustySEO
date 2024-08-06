use directories::ProjectDirs;
use reqwest::Client;
use rusqlite::{Connection, Result};
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::error::Error;
use tauri::Config;
use tokio::fs;
use url::{ParseError, Url};

use toml::de::Error as TomlError;

use super::crawler;

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiKeys {
    pub page_speed_key: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CoreWebVitals {
    pub lcp: Lcp,
    pub fid: String,
    pub cls: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Lcp {
    renderTime: f64,
    size: usize,
    element: String,
    id: String,
    url: String,
    loadTime: f64,
    startTime: f64,
    duration: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum MyError {
    Message(String),
    Other(String),
}

impl std::fmt::Display for MyError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MyError::Message(msg) => write!(f, "{}", msg),
            MyError::Other(msg) => write!(f, "{}", msg),
        }
    }
}

impl Error for MyError {}

impl From<Box<dyn Error>> for MyError {
    fn from(error: Box<dyn Error>) -> Self {
        MyError::Other(error.to_string())
    }
}

impl From<reqwest::Error> for MyError {
    fn from(error: reqwest::Error) -> Self {
        MyError::Other(error.to_string())
    }
}

impl From<url::ParseError> for MyError {
    fn from(error: url::ParseError) -> Self {
        MyError::Other(error.to_string())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LinkStatus {
    pub url: String,
    pub status_code: u16,
    pub description: String,
    pub is_external: bool,
}

// GET THE SITEMAP

pub async fn get_sitemap(url: &String) -> Result<(), Box<dyn Error>> {
    // Parse the input URL
    let url = Url::parse(&url)?;

    // Extract the domain
    let domain = url.domain().ok_or(ParseError::EmptyHost)?;

    // Construct the new URL with sitemap.xml appended
    let sitemap_url = format!("https://{}/sitemap.xml", domain);

    // Create a reqwest Client
    let client = Client::new();

    // Send GET request to fetch the sitemap.xml asynchronously
    let response = client.get(&sitemap_url).send().await?;

    // Check if the request was successful
    if !response.status().is_success() {
        println!(
            "Error: Request was not successful. Status code: {}",
            response.status()
        );
        return Ok(());
    }

    // Parse the XML response asynchronously
    let body = response.text().await?;

    // Print the sitemap XML to the user

    // Optionally, you can parse the XML content here if needed
    // let parser = EventReader::new(body.as_bytes());
    // let mut parser = parser.into_iter();
    // while let Some(event) = parser.next() {
    //     match event {
    //         Ok(XmlEvent::StartElement { name, .. }) => {
    //             println!("Start element: {}", name);
    //         }
    //         Ok(XmlEvent::EndElement { name }) => {
    //             println!("End element: {}", name);
    //         }
    //         Ok(XmlEvent::Characters(text)) => {
    //             println!("Text: {}", text);
    //         }
    //         Err(e) => {
    //             println!("Error parsing XML: {}", e);
    //             break;
    //         }
    //         _ => {}
    //     }
    // }

    println!("Sitemap parsing completed");

    Ok(())
}

// GET ROBOTS.TXT
pub async fn get_robots(domain_url: &String) -> Result<String, MyError> {
    // Parse the input URL
    let url = Url::parse(domain_url).map_err(MyError::from)?;
    println!("URL: {:?}", url);

    // Extract the scheme and domain and construct the robots.txt URL
    let scheme = url.scheme();
    println!("Scheme: {:?}", scheme);
    let domain = url
        .domain()
        .ok_or(MyError::Message("Invalid URL: No domain found".into()))?;
    println!("Domain: {:?}", domain);
    let robots_txt_url = format!("{}://{}/robots.txt", scheme, domain);
    println!("Robots.txt URL: {:?}", robots_txt_url);

    let robots_fixed = robots_txt_url.replace("https://www.", "https://");

    // Create a reqwest Client
    let client = Client::new();

    // Fetch the robots.txt file asynchronously
    let response = client
        .get(&robots_fixed)
        .send()
        .await
        .map_err(MyError::from)?;

    // Check if the request was successful
    if !response.status().is_success() {
        return Err(MyError::Message(format!(
            "Error: Request was not successful. Status code: {}",
            response.status()
        )));
    }

    // Read the response body as text
    let body = response.text().await.map_err(MyError::from)?;

    Ok(body)
}

// Function to check if a meta tag content indicates "noindex"
pub fn is_noindex(meta_content: &str) -> bool {
    meta_content.to_lowercase().contains("noindex")
}

// Function to get indexation status from the HTML document
pub fn get_indexation_status(document: &Html) -> String {
    let noindex_selector = match Selector::parse("meta[name=robots]") {
        Ok(selector) => selector,
        Err(_) => return String::from("Error parsing selector"), // Handle error internally
    };

    let mut index_status = String::from("Indexable");
    let mut noindex_found = false;

    for meta_tag in document.select(&noindex_selector) {
        if let Some(content) = meta_tag.value().attr("content") {
            if is_noindex(content) {
                index_status = String::from("Not Indexable");
                noindex_found = true;
                break;
            }
        } else {
            index_status = String::from("Not Available");
            noindex_found = true;
            break;
        }
    }

    if !noindex_found && index_status == "Indexed" {
        index_status = String::from("Indexed");
    }

    index_status
}

// Define the synchronous function to load API keys
pub async fn load_api_keys() -> Result<ApiKeys, Box<dyn Error>> {
    let config_dir =
        ProjectDirs::from("", "", "rustyseo").ok_or_else(|| "Failed to get project directories")?;
    let config_file = config_dir.config_dir().join("api_keys.toml");

    let config_content = fs::read_to_string(&config_file).await.map_err(|e| {
        format!(
            "Failed to read config file '{}': {}",
            config_file.display(),
            e
        )
    })?;

    let api_keys: ApiKeys =
        toml::from_str(&config_content).map_err(|e| format!("Failed to parse config: {}", e))?;

    // Only print the struct representation for debugging
    println!("Loaded API keys: {:?}", api_keys);

    Ok(api_keys)
}

// Function to check the status of links asynchronously

#[tauri::command]
pub async fn check_links(url: String) -> Result<Vec<LinkStatus>, String> {
    let client = reqwest::Client::new(); // Initialize reqwest client
    let mut results = Vec::new(); // To store the results

    // Convert the provided URL into a base URL
    let base_url = Url::parse(&url).map_err(|e| e.to_string())?;
    let base_str = base_url.as_str();

    let links = match crawler::db::read_links_from_db() {
        Ok(links) => links,
        Err(e) => return Err(e.to_string()),
    }; // Get links from the database

    // Helper function to convert relative URLs to absolute URLs
    fn resolve_url(base: &Url, relative: &str) -> Result<Url, url::ParseError> {
        let resolved_url = base.join(relative)?;
        Ok(resolved_url)
    }

    // Helper function to determine if a URL is external
    fn is_external(base_url: &Url, link_url: &Url) -> bool {
        base_url.domain() != link_url.domain()
    }

    for link in links {
        let link_url = link.0;
        let link_text = link.1;

        // Skip mailto: and other non-http(s) URLs
        if link_url.starts_with("mailto:")
            || link_url.starts_with("tel:")
            || link_url.starts_with("ftp:")
        {
            results.push(LinkStatus {
                url: link_url.clone(),
                status_code: 0,
                description: format!("Unsupported URL scheme: {}", link_url),
                is_external: false, // Unsupported URLs are not flagged as external
            });
            continue;
        }

        // Resolve URL to handle both relative and absolute URLs
        let absolute_url = if link_url.starts_with("http://") || link_url.starts_with("https://") {
            link_url // Full URL
        } else {
            let resolved_url = resolve_url(&base_url, &link_url).map_err(|e| e.to_string())?;
            resolved_url.to_string()
        };

        // Parse absolute URL to determine if it is external
        let link_url = Url::parse(&absolute_url).map_err(|e| e.to_string())?;
        let is_external = is_external(&base_url, &link_url);

        // Send the request and get the response
        let response = client
            .get(&absolute_url)
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3")
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let status_code = response.status().as_u16(); // Get the status code

        results.push(LinkStatus {
            url: absolute_url,
            status_code,
            description: format!("{} {}", link_text, status_code),
            is_external,
        });
    }

    println!("CHECKING LINK STATUS: {:?}", results);
    Ok(results)
}
