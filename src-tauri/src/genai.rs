use genai::chat::{ChatMessage, ChatRequest, ChatResponse};
use genai::client::Client;
use genai::utils::print_chat_stream;
use scraper::{ElementRef, Html, Selector};
use serde::{Deserialize, Serialize};
use std::error::Error;

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

pub async fn genai(query: String) -> Result<ChatResponse, Box<dyn Error>> {
    let client = Client::default();
    let chat_req = ChatRequest::new(vec![
        ChatMessage::system("Answer in one sentence"),
        ChatMessage::user(query.clone()),
    ]);
    let model = "llama3";
    println!("Using model: {}", model);
    let chat_res = client.exec_chat(model, chat_req.clone(), None).await?;
    println!("Chat request: {:#?}", chat_res);
    println!("{}", chat_res.content.as_deref().unwrap_or("NO ANSWER"));
    Ok(chat_res)
}
