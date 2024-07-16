use genai::chat::{ChatMessage, ChatRequest, ChatResponse};
use genai::client::Client;
use genai::utils::print_chat_stream;
use serde::{Deserialize, Serialize};
use std::error::Error;

pub async fn genai(query: String) -> Result<ChatResponse, Box<dyn Error>> {
    let client = Client::default();
    let chat_req = ChatRequest::new(vec![
        ChatMessage::system("Answer in one sentence"),
        ChatMessage::user(query.clone()),
    ]);
    let model = "llama3";
    println!("Using model: {}", model);
    let chat_res = client.exec_chat(model, chat_req.clone(), None).await?;
    println!("{}", chat_res.content.as_deref().unwrap_or("NO ANSWER"));
    Ok(chat_res)
}
