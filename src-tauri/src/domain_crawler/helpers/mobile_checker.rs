use scraper::{Html, Selector};

pub fn is_mobile(body: &str) -> bool {
    let document = Html::parse_document(&body);

    let selector = Selector::parse("meta[name=\"viewport\"]").unwrap();

    document.select(&selector).next().is_some()
}
