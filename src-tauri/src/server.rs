use crate::gemini;
use crate::globals;
use actix_web::{web, App, HttpServer, Responder};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tokio::fs;

//----------- Get the AI MODEL -------------
// Read the file
async fn read_model_file() -> Result<String, Box<dyn std::error::Error>> {
    let config_dir = directories::ProjectDirs::from("", "", "rustyseo")
        .ok_or("Failed to get project directories")?;
    let models_dir = config_dir.data_dir().join("models");

    // Read the file
    let model_file = models_dir.join("ai.toml");

    if !model_file.exists() {
        return Err("No file available".into());
    }

    println!("Ai File is: {:#?}", model_file);

    let file_toml = fs::read_to_string(model_file).await?;

    println!("This is the content of the file {:#?}", file_toml);

    Ok(file_toml)
}

async fn model() -> impl Responder {
    let model = read_model_file().await;
    model
}

pub async fn gsc(response: String) -> impl Responder {
    response
}

pub async fn rusty_server() {
    // Start the Actix Web server asynchronously

    println!("Starting Rusty's server");

    // getting the stored model

    tokio::spawn(async {
        HttpServer::new(|| {
            App::new()
                .route("/hello", web::get().to(model))
                .route("/gsc", web::get().to(gsc))
        })
        .bind("127.0.0.1:8080")
        .expect("Failed to bind address")
        .run()
        .await
        .expect("Failed to run server");
    });
}

#[derive(Serialize)]
struct GenerateRequest {
    model: String,
    prompt: String,
}

#[derive(Deserialize, Debug)]
struct GenerateResponse {
    response: String,
}

// ------------- RUSTY CHAT FUNCTION ------------
#[tauri::command]
pub async fn ask_rusty_command(prompt: String) -> Result<String, String> {
    let result = ask_rusty(prompt).await;
    match result {
        Ok(response) => Ok(response),
        Err(err) => Err(err.to_string()),
    }
}

// ---- Check which provider to use
pub async fn ask_rusty(prompt: String) -> Result<String, Box<dyn std::error::Error>> {
    let ai_model_selected = globals::actions::ai_model_read();
    println!(
        "AI Model Selected for Rusty Chat is : {:?}",
        ai_model_selected
    );

    match ai_model_selected.as_str() {
        "ollama" => {
            let result = ask_ollama(prompt).await;
            match result {
                Ok(response) => Ok(response),
                Err(err) => Err(err),
            }
        }
        "gemini" => {
            let result = ask_gemini(prompt).await;
            match result {
                Ok(response) => Ok(response),
                Err(err) => Err(err),
            }
        }
        _ => {
            let result = ask_ollama(prompt).await;
            match result {
                Ok(response) => Ok(response),
                Err(err) => Err(err),
            }
        }
    }
}

pub async fn ask_gemini(prompt: String) -> Result<String, Box<dyn std::error::Error>> {
    let client = Client::new();

    // Gemini API endpoint
    // let api_key = "AIzaSyALVt4Dn2GjjOZDBHyglejbQEWHrOnq_sU".to_string();
    let api_key = gemini::get_gemini_api_key()
        .expect("Failed to get Gemini API key for the RUsty Chat Gemini");
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key={}",
        api_key
    );

    // Prepare request body for Gemini
    let request_body = serde_json::json!({
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    });

    let response = client.post(&url).json(&request_body).send().await?;

    let response_json: serde_json::Value = response.json().await?;

    let full_response = response_json["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or("No response")
        .to_string();

    println!("Response: {}", full_response);

    Ok(full_response)
}

pub async fn ask_ollama(prompt: String) -> Result<String, Box<dyn std::error::Error>> {
    let client = Client::new();

    let request = GenerateRequest {
        model: "llama3.1".to_string(), // Changed to "llama2" as "llama3.1" might not exist
        prompt,
    };

    let mut response = client
        .post("http://localhost:11434/api/generate")
        .json(&request)
        .send()
        .await?;

    let mut full_response = String::new();

    while let Some(chunk) = response.chunk().await? {
        let chunk_str = String::from_utf8(chunk.to_vec())?;
        for line in chunk_str.lines() {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(line) {
                if let Some(response) = json.get("response") {
                    if let Some(text) = response.as_str() {
                        full_response.push_str(text);
                    }
                }
            }
        }
    }

    println!("Response: {}", full_response);

    Ok(full_response)
}
