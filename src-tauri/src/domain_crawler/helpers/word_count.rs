use once_cell::sync::Lazy;
use scraper::{Html, Selector};

static CONTENT_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("p, h1, h2, h3, h4, h5, h6, li, blockquote").unwrap());

pub fn get_word_count(document: &Html) -> usize {
    let mut word_count = 0;

    for element in document.select(&CONTENT_SELECTOR) {
        let text = element.text(); // Get an iterator over the text segments

        for word in text.collect::<String>().split_whitespace() {
            // More precise word counting (e.g., handle hyphens, contractions)
            let cleaned_word = word.trim_matches(|c: char| !c.is_alphanumeric());
            if !cleaned_word.is_empty() {
                word_count += 1;
            }
        }
    }

    word_count
}

