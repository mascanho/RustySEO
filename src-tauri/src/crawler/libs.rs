use chrono::Utc;
use directories::ProjectDirs;
use google_sheets4::api::Response;
use hyper::Client as HyperClient;
use hyper_rustls::HttpsConnectorBuilder;
use reqwest::Client;
use rusqlite::{Connection, Result};
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use serde_json::{json, Value};
use std::fmt::format;
use std::{error::Error, path::PathBuf};
use sysinfo::{ProcessExt, ProcessStatus, System, SystemExt};
use tauri::Config;
use tokio::fs;
use url::{ParseError, Url};
use yup_oauth2 as oauth2;
use yup_oauth2::{InstalledFlowAuthenticator, InstalledFlowReturnMethod};

use reqwest::header::{HeaderMap, HeaderValue};
use toml::de::Error as TomlError;

use crate::crawler::db::{self, refresh_links_table};
use crate::server;

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
#[tauri::command]
pub async fn load_api_keys() -> Result<ApiKeys, String> {
    let config_dir =
        ProjectDirs::from("", "", "rustyseo").ok_or_else(|| "Failed to get project directories")?;
    let config_file = config_dir.config_dir().join("api_keys.toml");

    // Create the config directory if it doesn't exist
    fs::create_dir_all(config_dir.config_dir())
        .await
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    // Check if file exists, create it with empty values if it doesn't
    if !config_file.exists() {
        let default_api_keys = ApiKeys {
            page_speed_key: String::new(),
        };
        let default_content = toml::to_string(&default_api_keys)
            .map_err(|e| format!("Failed to serialize default config: {}", e))?;
        fs::write(&config_file, default_content)
            .await
            .map_err(|e| format!("Failed to write default config file: {}", e))?;
    }

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

pub async fn check_links(url: String) -> Result<Vec<LinkStatus>, String> {
    // --------------------- MAKE SURE THE LINKS TABLE HAS BEEN CLEARED -------------------------

    let client = reqwest::Client::new(); // Initialize reqwest client
    let mut results = Vec::new(); // To store the results

    // Convert the provided URL into a base URL
    let base_url = Url::parse(&url).map_err(|e| e.to_string())?;

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
            .header(
                "User-Agent",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            )
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let status_code = response.status().as_u16(); // Get the status code

        results.push(LinkStatus {
            url: absolute_url,
            status_code,
            description: format!("{}", link_text),
            is_external,
        });
    }

    // println!("CHECKING LINK STATUS: {:?}", results);
    Ok(results)
}

// ------------- CHECK IF OLLAMA IS INSTALLED & RUNNING ON THE SYSTEM
pub fn check_ollama() -> bool {
    let ollama = String::from("ollama");
    let mut system = System::new();
    system.refresh_processes();

    for process in system.processes_by_name(&ollama) {
        if process.name() == ollama {
            return true;
        }
    }
    false
}

// ------ CONNECT TO GOOGLE SEARCH CONSOLE
#[derive(Deserialize, Serialize, Debug)]
struct SearchAnalyticsQuery {
    #[serde(rename = "startDate")]
    pub start_date: String,
    #[serde(rename = "endDate")]
    pub end_date: String,
    pub dimensions: Vec<String>,
    #[serde(rename = "rowLimit")]
    pub row_limit: i32,
    #[serde(rename = "type")]
    pub search_type: String,
    #[serde(rename = "aggregationType")]
    pub aggregation_type: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct ClientSecret {
    installed: InstalledInfo,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct InstalledInfo {
    pub client_id: String,
    pub project_id: String,
    pub auth_uri: String,
    pub token_uri: String,
    pub auth_provider_x509_cert_url: String,
    pub client_secret: String,
    pub redirect_uris: Vec<String>,
    pub aggregationType: String,
    pub range: String,
    pub search_type: String,
    pub url: String,
    pub rows: String,
    pub token: Option<String>,
    pub refresh_token: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GA4Credentials {
    pub client_id: String,
    pub project_id: String,
    pub client_secret: String,
    pub property_id: String,
    pub token: Option<String>,
    pub refresh_token: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
struct SearchAnalyticsResponse {
    rows: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Credentials {
    pub clientId: String,
    pub projectId: String,
    pub clientSecret: String,
    pub url: String,
    pub propertyType: String,
    pub range: String,
    pub rows: String,
    pub token: Option<String>,
    pub refresh_token: Option<String>,
}

// helper function to move credentials around
#[tauri::command]
pub async fn read_credentials_file() -> Result<InstalledInfo, String> {
    let config_dirs =
        ProjectDirs::from("", "", "rustyseo").expect("Failed to get project directories");
    let config_dir = config_dirs.data_dir();
    let secret_file = config_dir.join("client_secret.json");

    let data = fs::read_to_string(&secret_file)
        .await
        .expect("Failed to read client secret file");
    let secret: ClientSecret =
        serde_json::from_str(&data).expect("Failed to parse client secret file");

    let result = InstalledInfo {
        client_id: secret.installed.client_id,
        project_id: secret.installed.project_id,
        auth_uri: secret.installed.auth_uri,
        token_uri: secret.installed.token_uri,
        auth_provider_x509_cert_url: secret.installed.auth_provider_x509_cert_url,
        client_secret: secret.installed.client_secret,
        redirect_uris: secret.installed.redirect_uris,
        aggregationType: secret.installed.aggregationType,
        range: secret.installed.range,
        search_type: secret.installed.search_type,
        url: secret.installed.url,
        rows: secret.installed.rows,
        token: secret.installed.token,
        refresh_token: secret.installed.refresh_token,
    };

    println!("Search Console Config: {:?}", result);
    Ok(result)
}

// FUNCTION TO SET GOOGLE SEARCH CONSOLE DATA ON THE DISK
pub async fn set_search_console_credentials(credentials: Credentials) -> Result<PathBuf, String> {
    println!("libs: set_search_console_credentials starting...");
    let credentials_client_id = credentials.clientId;
    let credentials_project_id = credentials.projectId;
    let credentials_client_secret = credentials.clientSecret;
    let credentials_url = credentials.url;
    let credentials_search_type = credentials.propertyType;
    let credentials_range = credentials.range;
    let credentials_rows = credentials.rows;

    // Define the JSON structure
    let client_secret = ClientSecret {
        installed: InstalledInfo {
            aggregationType: "byPage".to_string(),
            client_id: credentials_client_id.to_string(),
            project_id: credentials_project_id.to_string(),
            client_secret: credentials_client_secret.to_string(),
            // client_secret: "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".to_string(),   // CLIENT SECRET BACKUP
            auth_uri: "https://accounts.google.com/o/oauth2/auth".to_string(),
            token_uri: "https://oauth2.googleapis.com/token".to_string(),
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs".to_string(),
            redirect_uris: vec![
                "urn:ietf:wg:oauth:2.0:oob".to_string(),
                "http://localhost".to_string(),
            ],
            url: credentials_url.to_string(),
            search_type: credentials_search_type.to_string(),
            range: credentials_range.to_string(),
            rows: credentials_rows.to_string(),
            token: credentials.token,
            refresh_token: credentials.refresh_token,
        },
    };

    // Serialize the JSON data
    let json_data = match serde_json::to_string_pretty(&client_secret) {
        Ok(data) => data,
        Err(e) => return Err(format!("Failed to serialize JSON: {}", e)),
    };

    // Get the project directories
    let config_dirs = match ProjectDirs::from("", "", "rustyseo") {
        Some(dirs) => dirs,
        None => return Err("Failed to get project directories".to_string()),
    };

    let config_dir = config_dirs.data_dir();

    // Create the config directory if it doesn't exist
    if let Err(e) = fs::create_dir_all(config_dir).await {
        return Err(format!("Failed to create config directory: {}", e));
    }

    // create the file
    let secret_file = config_dir.join("client_secret.json");

    // Write the JSON data to the file
    if let Err(e) = fs::write(&secret_file, json_data).await {
        return Err(format!("Failed to write client secret: {}", e));
    }

    println!("Client secret written to: {}", secret_file.display());

    Ok(secret_file)
}

pub async fn get_google_search_console() -> Result<Vec<JsonValue>, Box<dyn std::error::Error>> {
    // READ THE FILE ON THE DISK
    let gsc_settings_info = read_credentials_file()
        .await
        .expect("Failed to read credentials file");
    let credentials_url = gsc_settings_info.url;
    let search_type = gsc_settings_info.search_type;
    let credentials_project_id = gsc_settings_info.project_id;
    let credentials_client_id = gsc_settings_info.client_id;
    let credentials_client_secret = gsc_settings_info.client_secret;
    let credentials_range = gsc_settings_info.range;
    let credentials_rows = gsc_settings_info.rows;
    let credentials_token = gsc_settings_info.token;

    // Create an authorized client
    let https = HttpsConnectorBuilder::new()
        .with_native_roots()
        .https_only()
        .enable_http1()
        .build();
    let client = HyperClient::builder().build(https);

    // Get the token (either from credentials or from auth flow)
    let mut final_token = if let Some(token_str) = credentials_token {
        println!("Using token from credentials");
        token_str
    } else {
        // Set up the OAuth2 flow
        let secret_path = directories::ProjectDirs::from("", "", "rustyseo")
            .expect("Failed to get project directories")
            .data_dir()
            .join("client_secret.json");
        let secret = yup_oauth2::read_application_secret(&secret_path).await?;

        // Create an authenticator
        let auth_path = directories::ProjectDirs::from("", "", "rustyseo")
            .expect("Failed to get project directories")
            .data_dir()
            .join("tokencache.json");
        let auth = InstalledFlowAuthenticator::builder(secret, InstalledFlowReturnMethod::HTTPRedirect)
            .persist_tokens_to_disk(&auth_path)
            .build()
            .await
            .map_err(|e| {
                eprintln!("Failed to create authenticator: {}", e);
                format!("Failed to create authenticator: {}", e)
            })?;

        let token = auth
            .token(&["https://www.googleapis.com/auth/webmasters.readonly"])
            .await?;
        token.token().unwrap().to_string()
    };

    let refresh_token = gsc_settings_info.refresh_token;

    // Initialize variables
    let mut domain = false;
    let mut site = false;

    // Set the end date to TODAY's date
    let finish_date = Utc::now().format("%Y-%m-%d").to_string();

    // Prepare the request

    let (start_date, end_date) = match credentials_range.as_str() {
        "1 month" => {
            let end_date = Utc::now().format("%Y-%m-%d").to_string();
            let start_date = (Utc::now() - chrono::Duration::days(30))
                .format("%Y-%m-%d")
                .to_string();
            (start_date, end_date)
        }
        "3 months" => {
            let end_date = Utc::now().format("%Y-%m-%d").to_string();
            let start_date = (Utc::now() - chrono::Duration::days(90))
                .format("%Y-%m-%d")
                .to_string();
            (start_date, end_date)
        }
        "6 months" => {
            let end_date = Utc::now().format("%Y-%m-%d").to_string();
            let start_date = (Utc::now() - chrono::Duration::days(180))
                .format("%Y-%m-%d")
                .to_string();
            (start_date, end_date)
        }
        "12 months" => {
            let end_date = Utc::now().format("%Y-%m-%d").to_string();
            let start_date = (Utc::now() - chrono::Duration::days(365))
                .format("%Y-%m-%d")
                .to_string();
            (start_date, end_date)
        }
        "16 months" => {
            let end_date = Utc::now().format("%Y-%m-%d").to_string();
            let start_date = (Utc::now() - chrono::Duration::days(730))
                .format("%Y-%m-%d")
                .to_string();
            (start_date, end_date)
        }
        _ => {
            let end_date = Utc::now().format("%Y-%m-%d").to_string();
            let start_date = (Utc::now() - chrono::Duration::days(365))
                .format("%Y-%m-%d")
                .to_string();
            (start_date, end_date)
        }
    };

    // let site_url = "sc-domain:algarvewonders.com";
    let query = SearchAnalyticsQuery {
        start_date,
        end_date,
        dimensions: vec![
            "query".to_string(),
            "page".to_string(),
        ],
        search_type: "web".to_string(),
        row_limit: credentials_rows.parse::<i32>().unwrap_or(1000),
        aggregation_type: "auto".to_string(),
    };
    let body = serde_json::to_string(&query)?;
    println!("GSC Request Body: {}", body);

    // Make the API request
    let site_url = match search_type.as_str() {
        "domain" => {
            domain = true;
            println!("Domain selected, URL: {}", &credentials_url);
            if credentials_url.starts_with("sc-domain:") {
                credentials_url.clone()
            } else {
                format!("sc-domain:{}", &credentials_url)
            }
        }
        "site" => {
            site = true;
            println!("Site selected, URL: {}", &credentials_url);
            credentials_url.clone()
        }
        _ => {
            println!("Search type: Unknown");
            credentials_url.clone()
        }
    };

    // Retry loop for handling 401 Unauthorized
    let mut gsc_data = Vec::new();
    let max_retries = 1;
    
    for attempt in 0..=max_retries {
        let request = hyper::Request::builder()
            .method("POST")
            .uri(format!(
                "https://searchconsole.googleapis.com/webmasters/v3/sites/{}/searchAnalytics/query",
                urlencoding::encode(&site_url)
            ))
            .header(
                "Authorization",
                format!("Bearer {}", final_token),
            )
            .header("Content-Type", "application/json")
            .body(hyper::Body::from(body.clone()))?;

        let response = client.request(request).await?;
        let status = response.status();
        
        // If successful, proceed to parse
        if status.is_success() {
            let body_bytes = hyper::body::to_bytes(response.into_body()).await?;
            let body_str = String::from_utf8(body_bytes.to_vec())?;
            println!("GSC Response Status: {}", status);
            
            // Parse and print the results
            let data: JsonValue = serde_json::from_str(&body_str)?;
            
            println!("Parsed GSC Data successfully. Rows found: {}", data["rows"].as_array().map(|a| a.len()).unwrap_or(0));
            // Add data to DB
            gsc_data.push(data);
            if let Err(e) = db::push_gsc_data_to_db(&gsc_data) {
                eprintln!("Failed to push GSC data to database: {}", e);
                return Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to save data to database: {}", e))));
            }
            
            // Successfully fetched and saved, break loop
            return Ok(gsc_data);
        } else if status == hyper::StatusCode::UNAUTHORIZED && attempt < max_retries {
            println!("GSC API returned 401 Unauthorized. Attempting to refresh token...");
            
            if let Some(ref r_token) = refresh_token {
                println!("Refresh token found. Refreshing...");
                match refresh_google_token(&credentials_client_id, &credentials_client_secret, r_token).await {
                    Ok(new_token) => {
                        println!("Token refreshed successfully. Retrying request...");
                        final_token = new_token;
                        continue; // Retry loop with new token
                    },
                    Err(e) => {
                        eprintln!("Failed to refresh token: {}", e);
                        // Fall through to error return below
                    }
                }
            } else {
                eprintln!("No refresh token available to handle 401 error.");
            }
        }
        
        // If we get here, it means we failed and ran out of retries or it's a non-recoverable error
        let body_bytes = hyper::body::to_bytes(response.into_body()).await?;
        let body_str = String::from_utf8(body_bytes.to_vec())?;
        eprintln!("GSC API Error: {}", body_str);
        return Err(format!("Google Search Console API error ({}): {}", status, body_str).into());
    }

    Ok(gsc_data)
}

// ------------ FUNCTION TO GET THE GOOGLE ANALYTICS DATA

#[derive(Serialize, Debug)]
pub struct AnalyticsData {
    pub response: Vec<Value>,
}

pub async fn refresh_google_token(client_id: &str, client_secret: &str, refresh_token: &str) -> Result<String, String> {
    let client = reqwest::Client::new();
    let response = client.post("https://oauth2.googleapis.com/token")
        .form(&[
            ("client_id", client_id),
            ("client_secret", client_secret),
            ("refresh_token", refresh_token),
            ("grant_type", "refresh_token"),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
    
    if let Some(access_token) = json.get("access_token").and_then(|v| v.as_str()) {
        Ok(access_token.to_string())
    } else {
        Err(format!("Failed to refresh token: {:?}", json))
    }
}

// ------ GA4 CREDENTIALS MANAGEMENT

pub async fn set_google_analytics_credentials(credentials: GA4Credentials) -> Result<(), String> {
    let config_dir = ProjectDirs::from("", "", "rustyseo")
        .ok_or_else(|| "Failed to get project directories".to_string())?;
    let config_dir = config_dir.data_dir();
    let file_path = config_dir.join("ga4_credentials.json");

    let json = serde_json::to_string_pretty(&credentials)
        .map_err(|e| format!("Failed to serialize GA4 credentials: {}", e))?;

    fs::write(&file_path, json).await
        .map_err(|e| format!("Failed to write GA4 credentials: {}", e))?;

    // Also update the legacy ga_id.json for backward compatibility if needed
    let ga_id_path = config_dir.join("ga_id.json");
    let _ = fs::write(&ga_id_path, credentials.property_id).await;

    Ok(())
}

pub async fn read_ga4_credentials_file() -> Result<GA4Credentials, String> {
    let config_dir = ProjectDirs::from("", "", "rustyseo")
        .ok_or_else(|| "Failed to get project directories".to_string())?;
    let data_dir = config_dir.data_dir(); // Use data_dir as the base for credentials
    let file_path = data_dir.join("ga4_credentials.json");

    // Ensure the data directory exists
    tokio::fs::create_dir_all(data_dir)
        .await
        .map_err(|e| format!("Failed to create data directory: {}", e))?;

    if !file_path.exists() {
        // Create a default empty credentials file if it doesn't exist
        let default_credentials = GA4Credentials {
            client_id: String::new(),
            project_id: String::new(),
            client_secret: String::new(),
            property_id: String::new(),
            token: None,
            refresh_token: None,
        };
        let default_content = serde_json::to_string_pretty(&default_credentials)
            .map_err(|e| format!("Failed to serialize default GA4 credentials: {}", e))?;
        fs::write(&file_path, default_content)
            .await
            .map_err(|e| format!("Failed to write default GA4 credentials file: {}", e))?;
    }

    let content = fs::read_to_string(&file_path).await
        .map_err(|e| format!("Failed to read GA4 credentials: {}", e))?;

    let credentials: GA4Credentials = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse GA4 credentials: {}", e))?;

    Ok(credentials)
}

pub async fn get_ga4_properties(token: String) -> Result<Vec<Value>, String> {
    let client = reqwest::Client::new();
    
    // 1. List accounts
    // Using v1beta as it is more stable than v1alpha
    let accounts_url = "https://analyticsadmin.googleapis.com/v1beta/accountSummaries";
    
    let response_res = client
        .get(accounts_url)
        .bearer_auth(&token)
        .send()
        .await;

    let response: Value = match response_res {
        Ok(res) => {
            let status = res.status();
            let text = res.text().await.unwrap_or_default();
            println!("GA4 Account Summaries Status: {}", status);
            println!("GA4 Account Summaries Response: {}", text);
            
            if !status.is_success() {
                let error_json: Value = serde_json::from_str(&text).unwrap_or(json!({}));
                let message = error_json["error"]["message"].as_str().unwrap_or("Unknown error");
                return Err(format!("GA4 API Error: {}", message));
            }

            serde_json::from_str(&text)
                .map_err(|e| format!("Failed to parse accounts JSON: {} (Content: {})", e, text))?
        }
        Err(e) => return Err(format!("Failed to fetch accounts: {}", e)),
    };

    let mut all_properties = Vec::new();

    if let Some(accounts) = response["accountSummaries"].as_array() {
        for account in accounts {
            if let Some(properties) = account["propertySummaries"].as_array() {
                for property in properties {
                    all_properties.push(property.clone());
                }
            }
        }
    } else {
         println!("No 'accountSummaries' found in response");
    }

    Ok(all_properties)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DateRange {
    pub start_date: String,
    pub end_date: String,
}

pub async fn get_google_analytics(
    search_type: Vec<serde_json::Value>,
    date_ranges: Vec<DateRange>,
) -> Result<AnalyticsData, Box<dyn std::error::Error>> {
    println!("Search Type: {:#?}", search_type[0]);
    println!("Date Ranges: {:#?}", date_ranges[0]);

    // Set the directories for the client_secret.json file
    let config_dir =
        ProjectDirs::from("", "", "rustyseo").ok_or_else(|| "Failed to get project directories")?;
    let config_dir = config_dir.data_dir();
    let secret_path = config_dir.join("client_secret.json");

    // Set up the OAuth2 client
    let secret = oauth2::read_application_secret(&secret_path)
        .await
        .expect("Where is the client_secret.json file?");

    // Create an authenticator that persists tokens
    let auth_path = config_dir.join("ga_tokencache.json");
    
    // Try to read the new credentials first
    let credentials = read_ga4_credentials_file().await.ok();
    
    let token_str = if let Some(ref creds) = credentials {
        if let Some(ref t) = creds.token {
            Some(t.clone())
        } else {
            None
        }
    } else {
        None
    };

    let mut token_val = if let Some(t) = token_str {
        t
    } else {
        let secret = oauth2::read_application_secret(&secret_path)
            .await
            .expect("Where is the client_secret.json file?");

        let auth = oauth2::InstalledFlowAuthenticator::builder(
            secret,
            oauth2::InstalledFlowReturnMethod::HTTPRedirect,
        )
        .persist_tokens_to_disk(auth_path)
        .build()
        .await?;

        // Get an access token
        let scopes = &["https://www.googleapis.com/auth/analytics.readonly"];
        let token = auth.token(scopes).await?;
        token.token().unwrap().to_string()
    };

    // Create a client
    let client = reqwest::Client::new();

    // Prepare the request body
    // let body = json!({
    //     "dateRanges": [
    //         {
    //             "startDate": "2024-01-01",
    //             "endDate": "today"
    //         }
    //     ],
    //     "dimensions": [
    //         {"name": "fullPageUrl"},
    //         // {"name": "sourceMedium"},

    //     ],
    //     "metrics": [
    //         {"name": "sessions"},
    //         {"name": "newUsers"},
    //         {"name": "totalUsers"},
    //         {"name": "bounceRate"},
    //        {"name": "scrolledUsers"},
    //     ]
    // });

    let body = &search_type[0];

    let id = if let Some(ref creds) = credentials {
        creds.property_id.clone()
    } else {
        // Fallback to legacy if possible, but for now let's just error if no credentials
        return Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other, "GA4 Property ID not found. Please connect GA4 first.")));
    };

    println!("Using GA4 ID: {} to fetch Analytics data", id);

    // let client_id = "423125701".to_string();
    let client_id = id;
    let analytics_url = format!(
        "https://analyticsdata.googleapis.com/v1beta/properties/{}:runReport",
        client_id
    );

    // Make the request
    let mut response_res = client
        .post(&analytics_url)
        .bearer_auth(token_val.clone())
        .json(&body)
        .send()
        .await;

    // If 401 Unauthorized, try to refresh the token
    if let Ok(ref res) = response_res {
        if res.status() == reqwest::StatusCode::UNAUTHORIZED {
            if let Some(ref creds) = credentials {
                if let Some(ref refresh) = creds.refresh_token {
                    println!("Access token expired, attempting to refresh...");
                    match refresh_google_token(&creds.client_id, &creds.client_secret, refresh).await {
                        Ok(new_token) => {
                            println!("Token refreshed successfully!");
                            // Update the token in memory for the retry
                            token_val = new_token.clone();
                            
                            // Save the new token to disk
                            let mut updated_creds = creds.clone();
                            updated_creds.token = Some(new_token);
                            let _ = set_google_analytics_credentials(updated_creds).await;
                            
                            // Retry the request
                            response_res = client
                                .post(&analytics_url)
                                .bearer_auth(token_val.clone())
                                .json(&body)
                                .send()
                                .await;
                        }
                        Err(e) => {
                            println!("Failed to refresh token: {}", e);
                        }
                    }
                }
            }
        }
    }

    let response: Value = match response_res {
        Ok(res) => {
            let status = res.status();
            let text = res.text().await.unwrap_or_default();
            println!("GA4 API Status: {}", status);
            // println!("GA4 API Response: {}", text);
            serde_json::from_str(&text).unwrap_or(json!({"error": {"message": format!("Failed to parse GA4 response: {}", text)}}))
        }
        Err(e) => {
            println!("GA4 API Request Error: {}", e);
            json!({"error": {"message": e.to_string()}})
        }
    };

    // Process and print the results
    if let Some(rows) = response["rows"].as_array() {
        for row in rows {
            let page = &row["dimensionValues"][0]["value"];
            let _views = &row["metricValues"][0]["value"];
            // println!("Page: {}, Views: {}", page, views);
        }
    }

    let mut vec_response = Vec::new();
    vec_response.push(response);

    let response_clone = AnalyticsData {
        response: vec_response,
    };

    println!("Analytics Data: {:#?}", &response_clone);

    Ok(response_clone)
}

// -------- FUNCTION TO SET THE MICROSOFTY CLARITY DATA
#[derive(Serialize, Deserialize, Debug)]
pub struct ClarityData {
    pub response: Vec<Value>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ClarityCredentials {
    pub endpoint: String, // API Endpoint
    pub token: String,    // API Token
}

pub async fn set_microsoft_clarity_credentials(
    endpoint: String,
    token: String,
) -> Result<String, String> {
    // set the directories
    let config_dir = ProjectDirs::from("", "", "rustyseo")
        .ok_or_else(|| "Failed to get project directories".to_string())?;
    let config_dir = config_dir.data_dir();
    let file_path = config_dir.join("clarity.toml");

    let credentials = ClarityCredentials { endpoint, token };

    // Serialize to TOML string
    let toml_str = toml::to_string(&credentials)
        .map_err(|e| format!("Failed to serialize credentials: {}", e))?;

    // write the TOML to the file
    if let Err(e) = fs::write(&file_path, &toml_str).await {
        return Err(format!("Failed to write Microsoft Clarity ID: {}", e));
    }

    Ok(toml_str)
}

// ------ GET THE MICROSOFTY CLARITY CREDENTIALS
pub async fn get_microsoft_clarity_credentials() -> Result<Vec<String>, String> {
    let config_dir = ProjectDirs::from("", "", "rustyseo")
        .ok_or_else(|| "Failed to get project directories".to_string())?;
    let config_dir = config_dir.data_dir();
    let file_path = config_dir.join("clarity.toml");

    // read the file
    let file_toml = fs::read_to_string(file_path)
        .await
        .map_err(|e| format!("Failed to read Microsoft Clarity ID file: {}", e))?;

    println!("File content: {:#?}", file_toml);

    let credentials: ClarityCredentials =
        toml::from_str(&file_toml).map_err(|e| format!("Failed to parse credentials: {}", e))?;

    let mut creds = Vec::new();
    creds.push(credentials.endpoint);
    creds.push(credentials.token);

    println!("Clarity Credentials:{:#?}", creds);

    Ok(creds)
}

// ----- MAKE THE API CALL TO MICROSOFT CLARITY

pub async fn get_microsoft_clarity_data() -> Result<Vec<Value>, String> {
    let credentials_str = get_microsoft_clarity_credentials().await?;

    let endpoint = credentials_str[0].clone(); // Get endpoint from first element
    let token = credentials_str[1].clone(); // Get token from second element

    let credentials = ClarityCredentials { endpoint, token };

    println!("Making the API call with credentials: {:?}", &credentials);

    let client = reqwest::Client::new();

    let mut headers = HeaderMap::new();
    headers.insert(
        "Authorization",
        HeaderValue::from_str(&format!("Bearer {}", credentials.token))
            .map_err(|e| format!("Invalid header value: {}", e))?,
    );

    // Make API request
    let response = client
        .get(&format!("https://{}", credentials.endpoint))
        .headers(headers)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    // Check if request was successful
    if !response.status().is_success() {
        return Err(format!("Request failed with status: {}", response.status()));
    }

    // Parse JSON response
    let json_response: Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let mut response_data = Vec::new();

    response_data.push(json_response);

    println!("Response: {:#?}", response_data);

    Ok(response_data)
}
