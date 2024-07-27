use core::fmt;
use reqwest::Client;
use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use std::error::Error;
use url::{ParseError, Url};

use scraper::{Html, Selector};

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
