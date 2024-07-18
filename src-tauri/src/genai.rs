use genai::chat::{ChatMessage, ChatRequest, ChatResponse};
use genai::client::Client;
use genai::utils::print_chat_stream;
use scraper::{ElementRef, Html, Selector};
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::sync::Arc;
use tokio::task;

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

pub async fn pass_title(
    document: Arc<Html>,
    page_title: Arc<tokio::sync::Mutex<Vec<String>>>,
) -> Result<(), String> {
    let title_selector = Selector::parse("title").map_err(|e| format!("Selector error: {}", e))?;
    let mut titles = page_title.lock().await;
    for element in document.select(&title_selector) {
        let title = element.text().collect::<Vec<_>>().join(" ");
        titles.push(title);
    }
    Ok(())
}
