use scraper::{Html, Selector};

pub async fn is_html_page(body: &str, content_type: Option<&str>) -> bool {
    // Check the content-type header for HTML MIME types
    let is_html_header = content_type
        .map(|content_type| content_type.contains("text/html"))
        .unwrap_or(false);

    // CHECK THE RESPONSE BODY FOR HTML-LIKE CONTENT
    let is_html_body = {
        let document = Html::parse_document(body);
        let selectors = [
            Selector::parse("html").ok(),
            Selector::parse("head").ok(),
            Selector::parse("body").ok(),
        ];

        // If any of the selectors find a match, consider it HTML
        selectors.iter().any(|selector| {
            selector
                .as_ref()
                .map_or(false, |s| document.select(s).next().is_some())
        })
    };

    // If content-type is explicitly NOT html (e.g. image, pdf, zip), trust it
    if let Some(ct) = content_type {
        if !ct.contains("text/html") && !ct.contains("application/xhtml+xml") && (
            ct.contains("image/") || 
            ct.contains("video/") || 
            ct.contains("audio/") ||
            ct.contains("application/pdf") ||
            ct.contains("application/zip") ||
            ct.contains("application/octet-stream")
        ) {
            return false;
        }
    }

    // Otherwise, if header says HTML, or if body looks like HTML, accept it
    is_html_header || is_html_body
}
