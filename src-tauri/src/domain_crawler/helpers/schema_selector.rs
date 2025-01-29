use scraper::Selector;

pub fn get_schema(html: &str) -> Option<String> {
    let document = scraper::Html::parse_document(html);
    let schema_selector = Selector::parse("head > meta[itemprop=name]").unwrap();
    let schema = document.select(&schema_selector).next();
    if let Some(schema) = schema {
        let schema = schema.value().attr("content").unwrap();
        Some(schema.to_string())
    } else {
        None
    }
}
