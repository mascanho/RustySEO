use scraper::{Html, Selector};

pub fn get_word_count(body: &str) -> usize {
    let document = Html::parse_document(&body);

    // More precise selectors (avoiding elements that shouldn't be counted)
    let selectors = vec![
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "li",         // List items are often content-bearing
        "blockquote", // For quoted text
    ];

    let mut word_count = 0;

    for selector_str in selectors {
        let selector = Selector::parse(selector_str).unwrap();
        for element in document.select(&selector) {
            let text = element.text(); // Get an iterator over the text segments

            for word in text.collect::<String>().split_whitespace() {
                // More precise word counting (e.g., handle hyphens, contractions)
                let cleaned_word = word.trim_matches(|c: char| !c.is_alphanumeric());
                if !cleaned_word.is_empty() {
                    word_count += 1;
                }
            }
        }
    }

    word_count
}
