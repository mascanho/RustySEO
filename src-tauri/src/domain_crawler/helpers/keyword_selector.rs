use once_cell::sync::Lazy;
use regex::Regex;
use scraper::{node::Node, ElementRef, Html, Selector};
use std::collections::{HashMap, HashSet};

use crate::settings::settings::Settings;

/// Cached regex for word tokenization.
/// Matches sequences of word characters, apostrophes, and hyphens.
/// \w in Rust regex is Unicode-aware.
static WORD_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r"[\w'-]+").unwrap());

// Performance constants
const MIN_WORD_LENGTH: usize = 3;
const ESTIMATED_AVG_WORD_LENGTH: usize = 6;
const MAX_WORD_FREQUENCY: usize = 1555;
const TOP_KEYWORDS_LIMIT: usize = 10;

// Tags to strictly exclude from text extraction
const EXCLUDED_TAGS: [&str; 5] = ["script", "style", "noscript", "code", "pre"];

/// Returns default English stop words as a HashSet.
pub fn default_stop_words() -> HashSet<String> {
    vec![
        "the", "and", "is", "in", "it", "to", "of", "for", "on", "with", "as", "at", "by", "an",
        "be", "this", "that", "or", "are", "from", "was", "were", "has", "have", "had", "but",
        "not", "you", "we", "they", "he", "she", "his", "her", "its", "our", "your", "their",
        "what", "which", "who", "whom", "where", "when", "why", "how", "a", "if", "then", "else",
        "when", "while", "because", "so", "than", "into", "over", "under", "again", "further",
        "once", "here", "there", "where", "why", "how", "all", "any", "both", "each", "few",
        "more", "most", "other", "some", "such", "no", "nor", "only", "own", "same", "so", "too",
        "very", "s", "t", "can", "will", "just", "don", "should", "now",
    ]
    .into_iter()
    .map(|s| s.to_string())
    .collect()
}

// Convenience wrapper that integrates with Settings
pub fn extract_keywords_with_settings(document: &Html) -> Vec<(String, usize)> {
    let settings = Settings::new();
    extract_keywords(document, &settings.stop_words)
}

/// Recursively extracts text from the DOM, skipping excluded tags.
/// This prevents double-counting of text in nested elements and ensures accuracy.
fn extract_relevant_text(element: ElementRef, text_buf: &mut String) {
    for node in element.children() {
        match node.value() {
            Node::Text(text) => {
                text_buf.push_str(text);
                text_buf.push(' ');
            }
            Node::Element(elem) => {
                if !EXCLUDED_TAGS.contains(&elem.name()) {
                    if let Some(child_el) = ElementRef::wrap(node) {
                        extract_relevant_text(child_el, text_buf);
                    }
                }
            }
            _ => {}
        }
    }
}

/// Extracts keywords from HTML content with improved accuracy and performance.
pub fn extract_keywords(document: &Html, stop_words: &HashSet<String>) -> Vec<(String, usize)> {
    // 1. Efficiently extract relevant text from the document body/root
    // Using estimation to reduce allocation
    let mut text = String::with_capacity(1024);
    extract_relevant_text(document.root_element(), &mut text);

    // 2. Tokenize and count using regex iteration
    // Using regex iteration avoids allocating a huge "cleaned" string
    let mut word_counts: HashMap<String, usize> = HashMap::new();

    for mat in WORD_REGEX.find_iter(&text) {
        let word = mat.as_str();

        if word.len() < MIN_WORD_LENGTH {
            continue;
        }

        // Check if word contains at least one letter and is not purely numeric
        // Iterating chars of the slice is fast
        let has_alpha = word.chars().any(|c| c.is_alphabetic());
        if !has_alpha || word.chars().all(|c| c.is_numeric()) {
            continue;
        }

        // Convert to lowercase (allocation only happens here for valid words)
        let lowercase_word = word.to_lowercase();

        if stop_words.contains(&lowercase_word) {
            continue;
        }

        // Removed aggressive normalization/stemming to preserve full words
        *word_counts.entry(lowercase_word).or_insert(0) += 1;
    }

    // 3. Filter and Sort
    word_counts.retain(|_, count| *count <= MAX_WORD_FREQUENCY);

    let mut sorted_words: Vec<_> = word_counts.into_iter().collect();
    sorted_words.sort_by(|a, b| {
        // Sort by frequency (descending), then alphabetically
        b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0))
    });

    sorted_words.into_iter().take(TOP_KEYWORDS_LIMIT).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_keywords_accuracy() {
        let html = r#"
            <html>
                <body>
                    <h1>Keyword Extraction</h1>
                    <p>Testing keyword extraction. Keyword extraction is important.</p>
                    <p>Double count test: <span>keyword</span></p>
                    <script>console.log('ignore extracting keywords from script');</script>
                    <div>
                        <p>Nested <code>code block</code> content.</p>
                    </div>
                </body>
            </html>
        "#;
        let document = Html::parse_document(html);
        let stop_words = default_stop_words();
        
        let keywords = extract_keywords(&document, &stop_words);
        let keyword_map: HashMap<_, _> = keywords.into_iter().collect();

        // "keyword" appears in H1, P1(2 times), P2, span. Total 5?
        // H1: Keyword (1)
        // P1: Keyword (1), keyword (1) -> 2
        // P2: -> 0 direct text
        // Span: keyword (1)
        // Code: 'code', 'block' should be IGNORED.
        // Script: 'ignore', 'extracting', 'keywords', 'script' should be IGNORED.
        
        // Let's trace manually:
        // H1: "Keyword Extraction" -> keyword(1), extraction(1)
        // P1: "Testing keyword extraction. Keyword extraction is important." 
        //     -> testing(1), keyword(1), extraction(1), keyword(1), extraction(1), important(1)
        // P2: "Double count test: " (text node) -> double(1), count(1), test(1)
        // Span: "keyword" -> keyword(1)
        // Div -> P: "Nested " -> nested(1)
        // Code -> SKIPPED
        // P cont: " content." -> content(1)
        
        // Total "keyword": 1 (H1) + 2 (P1) + 1 (Span) = 4.
        // Total "extraction": 1 (H1) + 2 (P1) = 3.
        
        // We need to ensure we don't accidentally check "extracting" from script or "code" from code.
        
        assert_eq!(*keyword_map.get("keyword").unwrap_or(&0), 4);
        assert_eq!(*keyword_map.get("extraction").unwrap_or(&0), 3);
        
        // Verify ignored content
        assert!(!keyword_map.contains_key("console")); // Script
        assert!(!keyword_map.contains_key("code"));    // Code block
        assert!(keyword_map.contains_key("nested"));   // Surrounding text kept
        assert!(keyword_map.contains_key("content"));  // Surrounding text kept
    }

    #[test]
    fn test_full_words_preserved() {
        let html = "<html><body>Marketing Running Setting</body></html>";
        let document = Html::parse_document(html);
        let stop_words = HashSet::new(); // No stop words to interfere
        
        let keywords = extract_keywords(&document, &stop_words);
        let words: Vec<&str> = keywords.iter().map(|(w, _)| w.as_str()).collect();
        
        // Should NOT be "market", "runn", "sett"
        assert!(words.contains(&"marketing"));
        assert!(words.contains(&"running"));
        assert!(words.contains(&"setting"));
    }
}
