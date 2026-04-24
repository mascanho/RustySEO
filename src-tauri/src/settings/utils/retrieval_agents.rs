pub fn generate_retrieval_agents() -> Vec<String> {
    vec![
        // --- OpenAI ---
        "GPTBot".to_string(),        // Main crawler for model training
        "OAI-SearchBot".to_string(), // Real-time indexer for ChatGPT Search
        "ChatGPT-User".to_string(),  // User-triggered browsing and RAG tasks
        "OAI-AdsBot".to_string(),    // Safety check bot for AI-driven ad systems
        // --- Anthropic (Claude) ---
        "ClaudeBot".to_string(),    // Primary training and knowledge bot
        "Claude-User".to_string(),  // Live retrieval triggered by Claude users
        "anthropic-ai".to_string(), // Legacy/Alternative agent for Claude research
        // --- Google AI (Distinguished from regular Googlebot) ---
        "Google-Extended".to_string(), // Opt-out token for Gemini training data
        "Google-NotebookLM".to_string(), // Specific retrieval for NotebookLM sources
        "Google-CloudVertexBot".to_string(), // Enterprise RAG via Vertex AI
        // --- Perplexity & Search AI ---
        "PerplexityBot".to_string(), // Main search engine for Perplexity answers
        "Perplexity-Comet".to_string(), // Perplexity's advanced autonomous agent
        "DuckAssistBot".to_string(), // DuckDuckGo's AI-answer crawler
        // --- Meta & ByteDance ---
        "Meta-ExternalAgent".to_string(), // Training & retrieval for Meta AI (Llama)
        "Bytespider".to_string(),         // ByteDance (TikTok) AI training bot
        // --- xAI (Grok) ---
        "GrokBot".to_string(),  // xAI's web training crawler
        "xAI-Grok".to_string(), // Grok real-time web retrieval
        // --- Common AI Data Layers & Open Source ---
        "CCBot".to_string(), // Common Crawl (The primary source for most LLMs)
        "Firecrawl".to_string(), // Agentic web-to-markdown data layer
        "Kadoa".to_string(), // Autonomous AI scraper
        "Exabot".to_string(), // Semantic search discovery bot
        "Tavily".to_string(), // LLM-native search API agent
    ]
}
