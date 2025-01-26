pub fn extract_page_description(html: &str) -> Option<String> {
    html.find("<meta name=\"description\" content=\"")
        .map(|start| {
            let start = start + "<meta name=\"description\" content=\"".len();
            let end = html[start..].find('"');
            end.map(|end| html[start..start + end].to_string())
        })
        .flatten()
}
