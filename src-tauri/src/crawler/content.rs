use html2text::from_read;
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
    let selector =
        Selector::parse("h1, h2, h3, h4, h5, h6, p, span, li, div, a, section, main").unwrap();
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
        "more", "your", "find", "here", "there", "when", "where", "why", "how", "all", "any",
        "that", "as", "is", "was", "were", "can", "could", "did", "do", "does", "did", "does",
        "have", "has", "had", "how", "why", "where", "when", "what", "which", "who", "whom",
    ]
    .into_iter()
    .collect();

    let mut occurrences = HashMap::new();

    // Use a more strict word definition
    let word_regex = Regex::new(r"\b[a-zA-Z]+\b").unwrap();

    println!("Original text length: {} characters", text.len());
    println!("Original word count: {}", text.split_whitespace().count());

    for word_match in word_regex.find_iter(text) {
        let word = word_match.as_str().to_lowercase();
        if word.len() > 1 && !stop_words.contains(word.as_str()) {
            *occurrences.entry(word).or_insert(0) += 1;
        }
    }

    println!(
        "Total unique words (excluding stop words and single-letter words): {}",
        occurrences.len()
    );

    // Convert to vec and sort
    let mut keywords: Vec<(String, usize)> = occurrences.into_iter().collect();
    keywords.sort_unstable_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));

    println!("Top 20 words before truncation:");
    for (word, count) in keywords.iter().take(20) {
        println!("  {} - {}", word, count);
    }

    // Truncate to top_n
    keywords.truncate(top_n);

    println!("Final top {} keywords:", top_n);
    for (word, count) in &keywords {
        println!("  {} - {}", word, count);
    }

    keywords
}

pub fn calculate_reading_time(text: &str) -> f64 {
    let words_count = text.split_whitespace().count();
    words_count as f64 / 200.0
}

// Function to calculate the reading level and classify it
pub fn calculate_reading_level(html: &str) -> (f64, String) {
    let text = from_read(html.as_bytes(), 80); // Convert HTML to plain text
    let sentences = text.split_terminator(['.', '!', '?']).count();
    let words: Vec<&str> = text.split_whitespace().collect();
    let syllables = words
        .iter()
        .map(|&word| count_syllables(word))
        .sum::<usize>();

    let words_count = words.len() as f64;
    let sentences_count = sentences as f64;
    let syllables_count = syllables as f64;

    let reading_score = 206.835
        - (1.015 * (words_count / sentences_count))
        - (84.6 * (syllables_count / words_count));
    let classification = classify_reading_level(reading_score);

    (reading_score, classification)
}

// Function to count syllables in a word
fn count_syllables(word: &str) -> usize {
    let word = word.to_lowercase();
    let mut count: usize = 0;
    let mut prev_char_is_vowel = false;
    let vowels = Regex::new(r"[aeiouy]").unwrap();

    for c in word.chars() {
        if vowels.is_match(&c.to_string()) {
            if !prev_char_is_vowel {
                count += 1;
                prev_char_is_vowel = true;
            }
        } else {
            prev_char_is_vowel = false;
        }
    }

    if word.ends_with('e') && count > 1 {
        count -= 1; // Adjust count for words ending with 'e'
    }

    count.max(1)
}

// Function to classify the reading score
fn classify_reading_level(score: f64) -> String {
    match score {
        90.0..=100.0 => "Very Easy".to_string(),
        80.0..=89.9 => "Easy".to_string(),
        70.0..=79.9 => "Fairly Easy".to_string(),
        60.0..=69.9 => "Standard".to_string(),
        50.0..=59.9 => "Fairly Difficult".to_string(),
        30.0..=49.9 => "Difficult".to_string(),
        0.0..=29.9 => "Very Confusing".to_string(),
        _ => "Unknown".to_string(),
    }
}
