use html2text::from_read;
use regex::Regex;
use reqwest;
use scraper::{ElementRef, Html, Selector};
use std::collections::{HashMap, HashSet};
use std::error::Error;

pub async fn fetch_url(url: &str) -> Result<String, Box<dyn Error>> {
    let response = reqwest::get(url).await?.text().await?;
    Ok(response)
}
// TODO: make this more accurate
// --------------------------------- WORD COUNT ---------------------------------
pub fn count_words_accurately(document: &Html) -> (usize, Vec<String>) {
    let text_selector = Selector::parse("h1, h2, h3, h4, h5, h6, p, span").unwrap();
    let word_regex = Regex::new(r"\p{L}+(?:[-']\p{L}+)*").unwrap();

    let mut word_count = 0;
    let mut words = Vec::new();

    for element in document.select(&text_selector) {
        if should_skip_element(&element) {
            continue;
        }

        let text = get_visible_text(&element);
        let cleaned_text = clean_text(&text);

        if cleaned_text.trim().is_empty() {
            continue;
        }

        let element_words: Vec<String> = word_regex
            .find_iter(&cleaned_text)
            .map(|m| m.as_str().to_lowercase())
            .collect();

        word_count += element_words.len();

        if !cleaned_text.trim().is_empty() {
            words.push(cleaned_text.trim().to_string());
        }
    }

    // Remove duplicate entries and very short entries
    words.retain(|w| w.split_whitespace().count() > 3);
    words.sort();
    words.dedup();

    (word_count, words)
}

fn should_skip_element(element: &ElementRef) -> bool {
    let tag_name = element.value().name();
    let skip_tags = [
        "script", "style", "noscript", "iframe", "img", "svg", "path", "meta", "link", "footer",
        "form", "nav", "header", "head", "a", "button", "input", "select", "textarea",
    ];

    if skip_tags.contains(&tag_name) {
        return true;
    }

    element
        .value()
        .attr("aria-hidden")
        .map_or(false, |value| value == "true")
}

fn get_visible_text(element: &ElementRef) -> String {
    element.text().collect::<Vec<_>>().join(" ")
}

fn clean_text(text: &str) -> String {
    text.replace('\n', " ")
        .replace('\r', " ")
        .replace('\t', " ")
        .replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&apos;", "'")
        .replace("   ", " ")
        .replace("  ", " ")
        .trim()
        .to_string()
}

pub fn extract_text(html: &Html) -> String {
    let document = html;
    let selector = Selector::parse("h1, h2, h3, h4, h5, h6, p, span, blockquote").unwrap();
    let mut text = String::new();

    for element in document.select(&selector) {
        text.push_str(&element.text().collect::<Vec<_>>().join(" "));
    }
    println!("Extracted HTML: {}", document.html().len());
    println!("Extracted text: {}", text.len());
    text
}

//CALCULATE HTML TO TEXT RATIO
pub fn html_to_text_ratio(html: &Html) -> (f64, f64, f64) {
    let text = extract_text(html);
    let html_length = html.html().len() as f64;
    let text_length = text.len() as f64;
    let ratio = text_length / html_length;
    println!("HTML to text ratio: {}%", ratio as f64 * 100 as f64);
    (ratio, html_length, text_length)
}

pub fn get_top_keywords(text: &str, top_n: usize) -> Vec<(String, usize)> {
    // Define a more comprehensive set of stop words
    let stop_words: HashSet<&str> = vec![
        "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with", "by", "from",
        "up", "about", "into", "over", "after", "we", "us", "you", "they", "them", "our", "more",
        "your", "find", "here", "there", "when", "where", "why", "how", "all", "any", "that", "as",
        "is", "was", "were", "can", "could", "did", "do", "does", "have", "has", "had", "how",
        "why", "where", "when", "what", "which", "who", "whom", "has", "having", "having", "this",
        "each", "there", "their", "theirs", "the", "these", "those", "and", "but", "or", "yet",
        "it", "of", "be", "are", "am", "is", "was", "were", "been", "will", "shall", "could", "if",
        "will", "need", "https", "http", "www", "com", "org", "net", "co", "au", "uk", "us",
    ]
    .into_iter()
    .collect();

    let mut occurrences = HashMap::new();

    // Use a regex that captures words with internal punctuation but ignores other symbols
    let word_regex = Regex::new(r"\b[a-zA-Z'-]+\b").unwrap();

    for word_match in word_regex.find_iter(text) {
        let word = word_match.as_str().to_lowercase();
        if word.len() > 1 && !stop_words.contains(word.as_str()) {
            *occurrences.entry(word).or_insert(0) += 1;
        }
    }

    // Convert to vec and sort by frequency and alphabetically
    let mut keywords: Vec<(String, usize)> = occurrences.into_iter().collect();
    keywords.sort_unstable_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));

    // Truncate to top_n
    keywords.truncate(top_n);

    keywords
}

pub fn calculate_reading_time(word_count: usize, words_per_minute: usize) -> usize {
    (word_count as f64 / words_per_minute as f64).ceil() as usize
}

// TODO: make this more accurate
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
