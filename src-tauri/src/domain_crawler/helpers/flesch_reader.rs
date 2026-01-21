use once_cell::sync::Lazy;
use scraper::{Html, Selector};

static P_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("p").unwrap());

pub fn get_flesch_score(document: &Html) -> Result<(f64, String), String> {
    // Extract and concatenate the text content of each paragraph
    let mut text = String::new();
    for element in document.select(&P_SELECTOR) {
        let paragraph_text = element.text().collect::<Vec<_>>().join(" ");
        text.push_str(&paragraph_text);
        text.push(' '); // Add space between paragraphs
    }

    // If no text was extracted, return an error
    if text.trim().is_empty() {
        return Err("No text found in the HTML body".to_string());
    }

    // Calculate the Flesch Reading Ease Score
    let score = flesch_reading_ease(&text);

    // Classify the score
    let classification = classify_flesch_score(score);

    // Return the score and classification as a tuple inside a Result
    Ok((score, classification))
}


fn count_sentences(text: &str) -> usize {
    text.split(|c: char| ['.', '!', '?'].contains(&c)).count()
}

fn count_words(text: &str) -> usize {
    text.split_whitespace().count()
}

fn count_syllables(word: &str) -> usize {
    let vowels = ['a', 'e', 'i', 'o', 'u'];
    let mut syllable_count = 0;
    let mut prev_char_was_vowel = false;

    for c in word.to_lowercase().chars() {
        if vowels.contains(&c) && !prev_char_was_vowel {
            syllable_count += 1;
            prev_char_was_vowel = true;
        } else {
            prev_char_was_vowel = false;
        }
    }

    // Adjust for words ending with 'e' (often silent)
    if word.to_lowercase().ends_with('e') && syllable_count > 1 {
        syllable_count -= 1;
    }

    syllable_count
}

fn flesch_reading_ease(text: &str) -> f64 {
    let sentence_count = count_sentences(text) as f64;
    let word_count = count_words(text) as f64;
    let syllable_count = text
        .split_whitespace()
        .map(|word| count_syllables(word))
        .sum::<usize>() as f64;

    if sentence_count == 0.0 || word_count == 0.0 {
        return 0.0;
    }

    206.835 - 1.015 * (word_count / sentence_count) - 84.6 * (syllable_count / word_count)
}

fn classify_flesch_score(score: f64) -> String {
    match score {
        _ if score >= 90.0 => "Very Easy".to_string(),
        _ if score >= 80.0 => "Easy".to_string(),
        _ if score >= 70.0 => "Fairly Easy".to_string(),
        _ if score >= 60.0 => "Standard".to_string(),
        _ if score >= 50.0 => "Fairly Difficult".to_string(),
        _ if score >= 30.0 => "Difficult".to_string(),
        _ => "Very Difficult".to_string(),
    }
}
