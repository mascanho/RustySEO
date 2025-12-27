pub fn generate_default_user_bots() -> Vec<(String, String)> {
    let bots = vec![(
        "OpenAI SearchBot".to_string(),
        "https://openai.com/search".to_string(),
    )];

    bots
}
