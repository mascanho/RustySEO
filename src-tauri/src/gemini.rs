use anyhow::{anyhow, Result};
use directories::ProjectDirs;
use reqwest;
use serde::{Deserialize, Serialize};

const API_KEY: &str = "AIzaSyAzGe221fKyFf8IgPNFAIpK7YfKugNSVhc"; // Replace with your actual API key
const API_ENDPOINT: &str =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

#[derive(Serialize)]
pub struct GeminiRequest {
    contents: Vec<RequestContent>,
}

#[derive(Serialize)]
pub struct RequestContent {
    parts: Vec<Part>,
}

#[derive(Serialize)]
struct Part {
    text: String,
}

#[derive(Deserialize)]
struct GeminiResponse {
    candidates: Vec<Candidate>,
}

#[derive(Deserialize)]
struct Candidate {
    content: ResponseContent,
}

#[derive(Deserialize)]
struct ResponseContent {
    parts: Vec<ResponsePart>,
}

#[derive(Deserialize)]
struct ResponsePart {
    text: String,
}

impl GeminiRequest {
    fn new(prompt: &str) -> Self {
        GeminiRequest {
            contents: vec![RequestContent {
                parts: vec![Part {
                    text: prompt.to_string(),
                }],
            }],
        }
    }
}

pub async fn ask_gemini(prompt: &str) -> Result<String> {
    // READ THE KEY IF IT EXISTS ELSE RETURN AN ERROR

    let key = get_gemini_api_key().expect("Failed to read Gemini API key");

    let client = reqwest::Client::new();

    let my_prompt = format!(
        "Given the page title, explain and summarize what this page is about in one sentence: {}",
        &prompt
    );

    println!("Sending request to Gemini: {}", my_prompt);

    let request = GeminiRequest::new(&my_prompt);

    let response = client
        .post(API_ENDPOINT)
        .query(&[("key", key)])
        .json(&request)
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(anyhow!(
            "Gemini API Request failed with status code: {}",
            response.status()
        ));
    }

    let gemini_response: GeminiResponse = response.json().await?;

    Ok(gemini_response.candidates[0].content.parts[0].text.clone())
}

//#[tauri::command]
pub async fn greet(prompt: &str) -> Result<(), String> {
    match ask_gemini(prompt).await {
        Ok(response) => println!("Gemini's response: {}", response),
        Err(e) => eprintln!("Error: {}", e),
    }
    Ok(())
}

// --------- Set up the Gemini API key

#[derive(Serialize, Deserialize)]
pub struct GeminiApiKey {
    key: String,
    api_type: String,
    gemini_model: String,
}

#[tauri::command]
pub fn set_gemini_api_key(
    key: String,
    api_type: String,
    gemini_model: String,
) -> Result<GeminiApiKey, String> {
    // create the config directory if it doesn't exist
    let config_dirs = ProjectDirs::from("", "", "rustyseo")
        .ok_or_else(|| "Failed to get project directories".to_string())?;

    let config_dir = config_dirs.config_dir();

    std::fs::create_dir_all(config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    // create the file if it does not exist
    let secret_file = config_dir.join("gemini_api_key.json");

    let gemini_api_key = GeminiApiKey {
        key,
        api_type,
        gemini_model,
    };

    let json = serde_json::to_string(&gemini_api_key)
        .map_err(|e| format!("Failed to serialize API key: {}", e))?;
    std::fs::write(&secret_file, json).map_err(|e| format!("Failed to write file: {}", e))?;

    println!(
        "Gemini API key set successfully in: {}",
        secret_file.display()
    );
    Ok(gemini_api_key)
}

// ----- RED THE API KEY FROM THE CONGIF FILE AND RETURN IT
pub fn get_gemini_api_key() -> Result<String, String> {
    // create the config directory if it doesn't exist
    let config_dirs = ProjectDirs::from("", "", "rustyseo")
        .ok_or_else(|| "Failed to get project directories".to_string())?;

    let config_dir = config_dirs.config_dir();

    // create the file if it does not exit
    let secret_file = config_dir.join("gemini_api_key.json");
    if !secret_file.exists() {
        return Err("Gemini API key not found".to_string());
    }

    let json_content = std::fs::read_to_string(&secret_file)
        .map_err(|e| format!("Failed to read Gemini API key file: {}", e))?;

    let gemini_api_key: GeminiApiKey = serde_json::from_str(&json_content)
        .map_err(|e| format!("Failed to parse Gemini API key JSON: {}", e))?;

    println!("Gemini API key loaded successfully");
    Ok(gemini_api_key.key)
}

// ---------------- Ask Gemini for TOPICS of a page
#[tauri::command]
pub async fn generate_topics(body: String) -> Result<String> {
    let key = get_gemini_api_key().expect("Failed to read Gemini API key To generate Topics");

    let client = reqwest::Client::new();

    let prompt = format!(
        "Given the body of this page, generate a list of long tail keywords that can be derived from this page and other content that can be created based on it, generate the topics based on those keywords, a page title, a page description to create more content that is SEO friendly and complements this current page, , do not output backticks nor any strage characters! And do not mention anything else on your reply. The output should be {{keyword:, title: , description:}} give me 10 results only, make sure to pass the JSON details in the same language as the content/copy inside the body provided, the body of the page is :{}", body
    );

    // println!("Sending Topic request to Gemini: {}", prompt);

    let request = GeminiRequest::new(&prompt);

    let response = client
        .post(API_ENDPOINT)
        .query(&[("key", key)])
        .json(&request)
        .send()
        .await
        .expect("Failed to generate Topics");

    if !response.status().is_success() {
        return Err(anyhow!(
            "Gemini API Request failed with status code: {}",
            response.status()
        ));
    }

    let gemini_response: GeminiResponse = response.json().await.unwrap();

    let topics = gemini_response.candidates[0].content.parts[0].text.clone();

    // println!("Topics: {:?}", topics);

    Ok(topics)
}

// ---------------- Ask Gemini for Headings of a page

#[derive(Debug, Serialize, Deserialize)]
pub struct Headings {
    pub new_headings: String,
    pub content: String,
}

#[tauri::command]
pub async fn get_headings_command(ai_headings: String) -> Result<String, String> {
    match generate_headings(ai_headings).await {
        Ok(response) => Ok(response),
        Err(e) => Err(e.to_string()),
    }
}

// ---------------- Ask Gemini for Headings of a page
pub async fn generate_headings(headings: String) -> Result<String> {
    let key = get_gemini_api_key().expect("Failed to read Gemini API key To generate SEO headings");

    let client = reqwest::Client::new();

    let prompt = format!(
        "You are an amazing SEO expert, given the headings provided improve them and make them better to have better changes of ranking on search engines, and more importantly on google. Follow the latest SEO best practices and use the keywords wisely, output it the same format as submited, do not output anything else besides the headings, the headings are: {:#?}", headings
    );

    println!("Sending headings request to Gemini: {}", prompt);

    let request = GeminiRequest::new(&prompt);

    let response = client
        .post(API_ENDPOINT)
        .query(&[("key", key)])
        .json(&request)
        .send()
        .await
        .expect("Failed to generate headings");

    if !response.status().is_success() {
        return Err(anyhow!(
            "Gemini API Request failed with status code: {}",
            response.status()
        ));
    }

    let gemini_response: GeminiResponse = response.json().await.unwrap();

    let ai_headings = gemini_response.candidates[0].content.parts[0].text.clone();

    println!("AI Headings: {:?}", ai_headings);

    Ok(ai_headings)
}

// ---------------- THE COMMAND TO ASK GEMINI FOR JSON-LD
#[tauri::command]
pub async fn get_jsonld_command(jsonld: String) -> Result<String, String> {
    match generate_jsonld(jsonld).await {
        Ok(response) => Ok(response),
        Err(e) => Err(e.to_string()),
    }
}

// ---------------- Ask Gemini for JSON-LD of a page
pub async fn generate_jsonld(jsonld: String) -> Result<String> {
    let key = get_gemini_api_key().expect("Failed to read Gemini API key To generate SEO headings");

    let client = reqwest::Client::new();

    let prompt = format!(
        "You are an amazing SEO expert, given the JSON-LD provided improve it and make it better to have better changes of ranking on search engines, and more importantly on google. Follow the latest SEO best practices and use the keywords wisely, output it the same format as submited, do not output anything else besides it. the json-ld (structured data) is: {:#?}, in case I have no json-ld I'll submit a page body HTML for you to generate the best json-ld for it, below the JSON-Ld output a brief explanation of what the improvements were, do not include ** in your explanation", jsonld
    );

    println!("Sending JSON-LD request to Gemini: {}", prompt);

    let request = GeminiRequest::new(&prompt);

    let response = client
        .post(API_ENDPOINT)
        .query(&[("key", key)])
        .json(&request)
        .send()
        .await
        .expect("Failed to generate headings");

    if !response.status().is_success() {
        return Err(anyhow!(
            "Gemini API Request failed with status code: {}",
            response.status()
        ));
    }

    let gemini_response: GeminiResponse = response.json().await.unwrap();

    let ai_jsonld = gemini_response.candidates[0].content.parts[0].text.clone();

    println!("JSOND-LD: {:?}", ai_jsonld);

    Ok(ai_jsonld)
}
