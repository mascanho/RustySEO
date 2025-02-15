use scraper::{Html, Selector};

pub fn detect_language(body: &str) -> Option<String> {
    let document = Html::parse_document(&body);

    // Check the <html> tag's lang attribute
    let language_selector = Selector::parse("html[lang]").unwrap();
    if let Some(lang) = document
        .select(&language_selector)
        .next()
        .and_then(|html_element| {
            html_element
                .value()
                .attr("lang")
                .map(|lang| lang.to_string())
        })
    {
        return Some(lang);
    }

    // Check the <meta> tag for Content-Language
    let meta_selector = Selector::parse(r#"meta[http-equiv="Content-Language"]"#).unwrap();
    if let Some(content) = document
        .select(&meta_selector)
        .next()
        .and_then(|meta_element| {
            meta_element
                .value()
                .attr("content")
                .map(|content| content.to_string())
        })
    {
        return Some(content);
    }

    // No language found
    None
}
