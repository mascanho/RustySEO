use scraper::{Html, Selector};

// ASYNC VERSION: CHECK IF THE RESPONSE IS AN HTML PAGE
pub async fn is_html_page(body: &str, content_type: Option<&str>) -> bool {
    // Check the content-type header for HTML MIME types
    let is_html_header = content_type
        .map(|content_type| {
            content_type.contains("text/html")
                || content_type.contains("application/xhtml+xml")
                || content_type.contains("text/plain") // Some servers return HTML as text/plain
        })
        .unwrap_or(false);

    // CHECK THE RESPONSE BODY FOR HTML-LIKE CONTENT USING A LIGHTWEIGHT HTML PARSER
    let is_html_body = {
        // Check for common HTML tags (e.g., <html>, <head>, <body>, <div>, <p>, <a>)
        let document = Html::parse_document(body);
        let selectors = [
            Selector::parse("html").ok(),
            Selector::parse("head").ok(),
            Selector::parse("body").ok(),
            Selector::parse("div").ok(),
            Selector::parse("p").ok(),
            Selector::parse("a").ok(),
        ];

        // If any of the selectors find a match, consider it HTML
        selectors.iter().any(|selector| {
            selector
                .as_ref()
                .map_or(false, |s| document.select(s).next().is_some())
        })
    };

    // CONSIDER THE PAGE HTML IF EITHER THE HEADER OR BODY SUGGESTS IT
    is_html_header || is_html_body
}
