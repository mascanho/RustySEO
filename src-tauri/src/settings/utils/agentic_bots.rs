pub fn agentic_bots() -> Vec<String> {
    vec![
        // --- Agentic Search & Deep Research ---
        "Perplexity-Comet".to_string(), // Perplexity's autonomous agentic browser
        "OAI-DeepResearch".to_string(), // OpenAI's multi-step reasoning & research agent
        "YouBot-ARI".to_string(),       // You.com's Advanced Research & Insights agent
        "Grok-DeepSearch".to_string(),  // xAI's high-reasoning retrieval agent
        "Claude-Researcher".to_string(), // Anthropic's agent for multi-source synthesis
        "DuckAssistBot".to_string(),    // DuckDuckGo’s agentic summarization bot
        // --- User-Delegated Agentic Browsing ---
        // These represent a human asking the AI to "go perform this task for me"
        "ChatGPT-User".to_string(), // Real-time browsing triggered by chat users
        "Claude-User".to_string(),  // Live retrieval for Claude web-enabled sessions
        "Gemini-Live-Bot".to_string(), // Google's agent for real-time video/voice context
        // --- Autonomous Knowledge Layers (The "AI Backbone") ---
        // These act as the "API" for other agents to find information
        "Tavily".to_string(), // The leading search engine built specifically for AI Agents
        "Search1api".to_string(), // Unified agentic search aggregator
        "JinaBot".to_string(), // Specialist in turning web pages into LLM-ready Markdown
        "Firecrawl".to_string(), // Recursive agentic scraper for RAG pipelines
        "Kadoa".to_string(),  // Self-healing autonomous web scraper
        // --- Enterprise & Developer Retrieval ---
        "Google-CloudVertexBot".to_string(), // Used by custom enterprise agentic workflows
        "LangChain-Agent".to_string(),       // Default UA for many LangGraph/LangChain agents
        "AutoGPT-Retrieval".to_string(),     // Autonomous agent specialized in web-tasks
    ]
}
