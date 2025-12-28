use directories::ProjectDirs;
use genai::chat::{ChatMessage, ChatRequest, ChatResponse};
use genai::client::Client;
use std::error::Error;

use crate::gemini::{self};

use crate::globals::actions;

// ------- Page Summary ------------
#[tauri::command]
pub fn get_ai_model() -> String {
    // Check in the directories for the model being used and return it
    ProjectDirs::from("", "", "rustyseo")
        .map(|project_dirs| project_dirs.data_dir().join("models").join("ai.toml"))
        .and_then(|model_path| std::fs::read_to_string(model_path).ok())
        .unwrap_or_else(|| {
            eprintln!("Failed to read AI model file, using default model");
            String::from("default_model")
        })
        .trim()
        .to_string()
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

// ------------- GENERATE TOPICS ---------------------
pub async fn generate_topics(body: String) -> Result<ChatResponse, Box<dyn Error>> {
    // Check the Global Model Selection
    let global_model_selected = actions::ai_model_read();
    println!(
        "Global AI Model Selected for Topics : {:?}",
        global_model_selected
    );

    if global_model_selected == "gemini" {
        let gemini_response = gemini::generate_topics(body).await;

        let gemini_response = ChatResponse {
            content: Some(gemini_response.unwrap()),
            ..Default::default()
        };
        println!("Gemini selected, not using Ollama");
        Ok(gemini_response)
    } else {
        // get the Ollama model selection
        let model_selection = get_ai_model().trim().to_string(); // Ensure it's a String

        // Initialize the HTTP client
        let client = Client::default();

        // Create the chat request
        let prompt = format!(
              "You are an amazing SEO expert. Given the body of this page, generate a list of long tail keywords that can be derived from this page, generate the topics based on those keywords, a page title, a page description and a page H1 to create more content that is SEO friendly and complements this current page, , do not output backticks nor any strage characters! output in JSON format And do not mention anything else on your reply. The output should be {{keyword:, topic:, title: , description:, h1:}} give me 1 result only, the body of the page to be analysed by you is :{} and you should output only the JSON format, do not say or add anything else to your reply.", body
          );
        let chat_req = ChatRequest::new(vec![
            // ChatMessage::system("Output a JSON format, do not add anything else to your reply if it is not inside the JSON format"),
            ChatMessage::user(prompt),
        ]);

        // Retrieve and trim the model selection
        let model = model_selection;
        println!("Using model: {}", model);

        // Execute the chat request
        let chat_res = client.exec_chat(&model, chat_req.clone(), None).await?;

        // Print the response for debugging
        println!("Ollama Topics: {:#?}", chat_res);
        println!("{}", chat_res.content.as_deref().unwrap_or("NO ANSWER"));

        // Return the response
        Ok(chat_res)
    }
}

// ------------- GENERATE Headings ---------------------
pub async fn generate_headings(headings: String) -> Result<ChatResponse, Box<dyn Error>> {
    // Check the Global Model Selection
    let global_model_selected = actions::ai_model_read();
    println!(
        "Global AI Model Selected for Headings : {:?}",
        global_model_selected
    );

    if global_model_selected == "gemini" {
        let gemini_response = gemini::generate_headings(headings).await;

        let gemini_response = ChatResponse {
            content: Some(gemini_response.unwrap()),
            ..Default::default()
        };
        println!("Gemini selected, not using Ollama");
        Ok(gemini_response)
    } else {
        // get the Ollama model selection
        let model_selection = get_ai_model().trim().to_string(); // Ensure it's a String

        // Initialize the HTTP client
        let client = Client::default();

        // Create the chat request
        let prompt = format!(
        "You are an amazing SEO expert, given the headings provided improve them and make them better to have better changes of ranking on search engines, and more importantly on google. Follow the latest SEO best practices and use the keywords wisely, output it the same format as submited, do not output anything else besides the headings, if there are duplicated headings ensure to try and make them different whilst keeping the same semanting meaning. The headings are: {:#?}", headings
    );
        let chat_req = ChatRequest::new(vec![
            // ChatMessage::system("Output a JSON format, do not add anything else to your reply if it is not inside the JSON format"),
            ChatMessage::user(prompt),
        ]);

        // Retrieve and trim the model selection
        let model = model_selection;
        println!("Using model: {}", model);

        // Execute the chat request
        let chat_res = client.exec_chat(&model, chat_req.clone(), None).await?;

        // Print the response for debugging
        println!("Ollama Topics: {:#?}", chat_res);
        println!("{}", chat_res.content.as_deref().unwrap_or("NO ANSWER"));

        // Return the response
        Ok(chat_res)
    }
}

// ------------- GENERATE STRUCTURED DATA JSON-LD ---------------------
pub async fn generate_jsonld(jsonld: String) -> Result<ChatResponse, Box<dyn Error>> {
    // Check the Global Model Selection
    let global_model_selected = actions::ai_model_read();
    println!(
        "Global AI Model Selected for Headings : {:?}",
        global_model_selected
    );

    if global_model_selected == "gemini" {
        let gemini_response = gemini::generate_headings(jsonld).await;

        let gemini_response = ChatResponse {
            content: Some(gemini_response.unwrap()),
            ..Default::default()
        };
        println!("Gemini selected, not using Ollama");
        Ok(gemini_response)
    } else {
        // get the Ollama model selection
        let model_selection = get_ai_model().trim().to_string(); // Ensure it's a String

        // Initialize the HTTP client
        let client = Client::default();

        // Create the chat request
        let prompt = format!(
        "You are an amazing SEO expert, given the JSON-LD provided improve it and make it better to have better changes of ranking on search engines, and more importantly on google. Follow the latest SEO best practices and use the keywords wisely, output it the same format as submited, do not output anything else besides it. the json-ld (structured data) is: {:#?}, in case I have no json-ld I'll submit a page body HTML for you to generate the best json-ld for it, below the JSON-Ld output a brief explanation of what the improvements were, do not include ** in your explanation", jsonld
    );
        let chat_req = ChatRequest::new(vec![
            // ChatMessage::system("Output a JSON format, do not add anything else to your reply if it is not inside the JSON format"),
            ChatMessage::user(prompt),
        ]);

        // Retrieve and trim the model selection
        let model = model_selection;
        // println!("Using model: {}", model);

        // Execute the chat request
        let chat_res = client.exec_chat(&model, chat_req.clone(), None).await?;

        // Print the response for debugging
        println!("Ollama Topics: {:#?}", chat_res);
        println!("{}", chat_res.content.as_deref().unwrap_or("NO ANSWER"));

        // Return the response
        Ok(chat_res)
    }
}
