use regex::Regex;
use reqwest;
use scraper::{Html, Selector};
use std::collections::{HashMap, HashSet};
use std::error::Error;

pub async fn fetch_url(url: &str) -> Result<String, Box<dyn Error>> {
    let response = reqwest::get(url).await?.text().await?;
    Ok(response)
}

pub fn extract_text(html: &Html) -> String {
    let document = html;
    let selector = Selector::parse("h1, h2, h3, h4, h5, h6, p, span, li, div, a").unwrap();
    let mut text = String::new();

    for element in document.select(&selector) {
        text.push_str(&element.text().collect::<Vec<_>>().join(" "));
    }

    text
}

pub fn get_top_keywords(text: &str, top_n: usize) -> Vec<(String, usize)> {
    // Define common words to ignore
    let stop_words: HashSet<&str> = vec![
        "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
        "from", "up", "about", "into", "over", "after", "we", "us", "you", "they", "them", "our",
        "more", "your", "find",
    ]
    .into_iter()
    .collect();
    let re = Regex::new(r"\b\w+\b").unwrap();
    let mut occurrences = HashMap::new();
    for word in re.find_iter(text) {
        let word = word.as_str().to_lowercase();
        if !stop_words.contains(word.as_str()) && word.len() > 1 {
            *occurrences.entry(word).or_insert(0) += 1;
        }
    }
    let mut occurrences: Vec<(String, usize)> = occurrences.into_iter().collect();
    occurrences.sort_unstable_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
    occurrences.truncate(top_n);

    occurrences
}

pub fn calculate_reading_time(text: &str) -> f64 {
    let words_count = text.split_whitespace().count();
    words_count as f64 / 200.0
}

pub fn calculate_reading_level(text: &str) -> f64 {
    let words = text.split_whitespace().collect::<Vec<_>>();
    let sentences = text.split_terminator(['.', '!', '?']).count();
    let syllables = words
        .iter()
        .map(|word| count_syllables(word))
        .sum::<usize>();

    let words_count = words.len() as f64;
    let sentences_count = sentences as f64;
    let syllables_count = syllables as f64;

    206.835 - (1.015 * (words_count / sentences_count)) - (84.6 * (syllables_count / words_count))
}

pub fn count_syllables(word: &str) -> usize {
    let vowels = "aeiouy";
    let mut count = 0;
    let mut prev_char = ' ';
    for c in word.chars() {
        if vowels.contains(c) && !vowels.contains(prev_char) {
            count += 1;
        }
        prev_char = c;
    }
    count.max(1)
}
