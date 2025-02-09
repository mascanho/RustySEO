use scraper::{Html, Selector};

pub fn get_keywords(body: &str) -> Vec<String> {
    let document = Html::parse_docuemnt(&body);

    let selector = Selector::parse("body").unwrap();
    let body = document.select(&selector).next().unwrap();
}
