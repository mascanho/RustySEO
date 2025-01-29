use reqwest::Client;

// ASYNC VERSION: CHECK IF THE RESPONSE IS AN HTML PAGE
pub async fn is_html_page(body: &str, content_type: Option<&str>) -> bool {
    // Check the content-type header for HTML MIME types
    let is_html_header = content_type
        .map(|content_type| {
            content_type.contains("text/html")
                || content_type.contains("application/xhtml+xml")
                || content_type.contains("application/xml")
                || content_type.contains("application/rss+xml")
                || content_type.contains("application/atom+xml")
        })
        .unwrap_or(false);

    // CHECK THE RESPONSE BODY FOR HTML-LIKE CONTENT USING A LIGHTWEIGHT HTML PARSER
    let is_html_body = {
        let document = scraper::Html::parse_document(body);
        let selector = scraper::Selector::parse("html, head, body").unwrap(); // Check for common HTML tags
        document.select(&selector).next().is_some()
    };

    // PERFORM AN ASYNC OPERATION (EXAMPLE: FETCHING ADDITIONAL DATA)
    // let client = Client::new();
    // let _response = client.get("https://example.com").send().await;

    // CONSIDER THE PAGE HTML IF EITHER THE HEADER OR BODY SUGGESTS IT
    is_html_header || is_html_body
}
