use anyhow::{anyhow, Result};
use directories::ProjectDirs;
use reqwest;
use serde::{Deserialize, Serialize};
use serde_json::json;

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
    let client = reqwest::Client::new();

    let my_prompt = format!("explain this title in just one sentence: {}", &prompt);

    println!("Sending request to Gemini: {}", my_prompt);

    let request = GeminiRequest::new(&my_prompt);

    let response = client
        .post(API_ENDPOINT)
        .query(&[("key", API_KEY)])
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
pub fn set_gemini_api_key(key: String) -> Result<(), String> {
    // create the config directory if it doesn't exist
    let config_dirs = ProjectDirs::from("", "", "rustyseo")
        .ok_or_else(|| "Failed to get project directories".to_string())?;

    let config_dir = config_dirs.data_dir();

    // create the file if it does not exit
    let secret_file = config_dir.join("gemini_api_key.txt");
    if !secret_file.exists() {
        std::fs::write(&secret_file, key).map_err(|e| format!("Failed to write file: {}", e))?;
    }
    Ok(())
}
