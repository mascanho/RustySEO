use directories::ProjectDirs;
use genai::chat::{ChatMessage, ChatRequest, ChatResponse};
use genai::client::Client;
use genai::utils::print_chat_stream;
use scraper::{ElementRef, Html, Selector};
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::io::Write;

// ------------ AI GENERATED PAGE TITLE -----------
#[tauri::command]
pub async fn generated_page_title(query: String) -> Result<String, String> {
    match generate_page_title(query).await {
        Ok(title) => Ok(title),
        Err(e) => Err(e.to_string()),
    }
}

pub async fn generate_page_title(query: String) -> Result<String, Box<dyn Error>> {
    let client = Client::default();
    let chat_req = ChatRequest::new(vec![
        ChatMessage::system("Answer in one line, provide a reply that is improves the SEO changes and is no longer than 60 characters, provide just the answer, no other details, remove the quotes"),
        ChatMessage::user(query.clone()),
    ]);
    let model = "llama3";
    println!("Model use to generate title: {}", model);
    let chat_res = client.exec_chat(model, chat_req.clone(), None).await?;
    println!("Chat request: {:#?}", chat_res);
    println!("{}", chat_res.content.as_deref().unwrap_or("NO ANSWER"));
    Ok(chat_res.content.unwrap_or_default())
}

// ------------ AI GENERATED PAGE DESCRIPTION -----------

#[tauri::command]
pub async fn generated_page_description(query: String) -> Result<String, String> {
    match generate_page_description(query).await {
        Ok(title) => Ok(title),
        Err(e) => Err(e.to_string()),
    }
}

pub async fn generate_page_description(query: String) -> Result<String, Box<dyn Error>> {
    let client = Client::default();
    let chat_req = ChatRequest::new(vec![
        ChatMessage::system("Answer in one line, provide a reply that is improves the SEO changes and is no longer than 160 characters, provide just the answer, no other details, remove the quotes"),
        ChatMessage::user(query.clone()),
    ]);
    let model = "llama3";
    println!("Model use to generate title: {}", model);
    let chat_res = client.exec_chat(model, chat_req.clone(), None).await?;
    println!("Chat request: {:#?}", chat_res);
    println!("{}", chat_res.content.as_deref().unwrap_or("NO ANSWER"));
    Ok(chat_res.content.unwrap_or_default())
}

// ------- Page Summary ------------

pub fn get_ai_model() -> String {
    // Check in the directories for the model being used and return it
    let project_dirs = ProjectDirs::from("", "", "rustyseo").unwrap();
    let model_dir = project_dirs.data_dir().join("models");
    let model_path = model_dir.join("ai.toml");
    let ai_model = std::fs::read_to_string(model_path).unwrap();
    let model = ai_model;
    model
}

pub async fn genai(query: String) -> Result<ChatResponse, Box<dyn Error>> {
    // Initialize the HTTP client
    let client = Client::default();

    // Create the chat request
    let chat_req = ChatRequest::new(vec![
        ChatMessage::system("Answer in one sentence"),
        ChatMessage::user(query.clone()),
    ]);

    // Retrieve and trim the model selection
    let model_selection = get_ai_model().trim().to_string(); // Ensure it's a String
    let model = model_selection;
    println!("Using model: {}", model);

    // Execute the chat request
    let chat_res = client.exec_chat(&model, chat_req.clone(), None).await?;

    // Print the response for debugging
    println!("Chat request: {:#?}", chat_res);
    println!("{}", chat_res.content.as_deref().unwrap_or("NO ANSWER"));

    // Return the response
    Ok(chat_res)
}
