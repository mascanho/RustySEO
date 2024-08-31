use directories::ProjectDirs;
use genai::chat::{ChatMessage, ChatRequest, ChatResponse};
use genai::client::Client;
use genai::utils::print_chat_stream;
use scraper::{ElementRef, Html, Selector};
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::io::Write;

use crate::gemini;

use crate::globals::actions;

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
    // Get the AI Global model selection
    let global_model_selected = actions::ai_model_read();
    println!("Global AI Model Selected : {:?}", global_model_selected);

    if global_model_selected == "gemini" {
        // Create a dummy ChatResponse for Gemini

        let gemini_response = gemini::ask_gemini(&query).await;

        let gemini_response = ChatResponse {
            content: Some(gemini_response.unwrap()),
            ..Default::default()
        };
        println!("Gemini selected, not using Ollama");
        Ok(gemini_response)
    } else {
        // get the Ollama model selection
        let model_selection = get_ai_model().trim().to_string(); // Ensure it's a String

        // Generate GEMINI and get the results
        let results = gemini::greet(&query)
            .await
            .expect("Failed to generate gemini");
        println!("{:?}", results);

        // Initialize the HTTP client
        let client = Client::default();

        // Create the chat request
        let chat_req = ChatRequest::new(vec![
            ChatMessage::system("Answer in one sentence"),
            ChatMessage::user(query.clone()),
        ]);

        // Retrieve and trim the model selection
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
}
