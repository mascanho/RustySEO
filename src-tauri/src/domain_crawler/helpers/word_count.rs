use scraper::{Html, Selector};

pub fn get_word_count(body: &str) -> usize {
    let document = Html::parse_document(&body);

    let selectors = vec![
        "p",
        "h1",
        "span",
        "li",
        "td",
        "th",
        "tr",
        "caption",
        "blockquote",
        "em",
        "strong",
        "b",
        "i",
        "u",
        "strike",
        "s",
        "del",
        "ins",
        "sup",
        "sub",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
    ];

    let mut all_text = String::new();
    for selector in selectors {
        let selector = Selector::parse(selector).unwrap();
        for element in document.select(&selector) {
            all_text.push_str(&element.text().collect::<String>());
            all_text.push(' ');
        }
    }
    all_text.split_whitespace().count()
}
