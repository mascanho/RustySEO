use regex::Regex;
use scraper::{Html, Selector};
use std::collections::{HashMap, HashSet};

fn extract_keywords(html: &str) -> Vec<(String, usize)> {
    // Define stop words as a HashSet for efficient lookups
    let stop_words: HashSet<&str> = vec![
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
    .collect();

    // Define a blacklist of HTML tags, attributes, and properties
    let html_blacklist: HashSet<&str> = vec![
        "div",
        "span",
        "class",
        "id",
        "href",
        "src",
        "alt",
        "title",
        "style",
        "script",
        "meta",
        "link",
        "img",
        "svg",
        "path",
        "a",
        "ul",
        "li",
        "ol",
        "table",
        "tr",
        "td",
        "th",
        "form",
        "input",
        "button",
        "header",
        "footer",
        "nav",
        "section",
        "article",
        "aside",
        "main",
        "figure",
        "figcaption",
        "iframe",
        "video",
        "audio",
        "canvas",
        "source",
        "embed",
        "object",
        "param",
        "track",
        "map",
        "area",
        "col",
        "colgroup",
        "fieldset",
        "legend",
        "label",
        "select",
        "option",
        "textarea",
        "output",
        "progress",
        "meter",
        "details",
        "summary",
        "menu",
        "menuitem",
        "dialog",
        "slot",
        "template",
        "picture",
        "slot",
        "noscript",
        "base",
        "head",
        "body",
        "html",
    ]
    .into_iter()
    .collect();

    // Parse the HTML document
    let document = Html::parse_document(html);

    // Define selectors for <p> and heading tags
    let p_selector = Selector::parse("p").unwrap();
    let h_selector = Selector::parse("h1, h2, h3, h4, h5, h6").unwrap();

    // Extract text from <p> and heading tags
    let mut text = String::new();
    for element in document
        .select(&p_selector)
        .chain(document.select(&h_selector))
    {
        // Extract text content, including text from nested elements
        let element_text = element.text().collect::<String>();
        text.push_str(&element_text);
        text.push(' '); // Add space between elements
    }

    // Debug: Print the extracted text
    println!("Extracted Text: {}", text);

    // Clean and tokenize the text
    let re = Regex::new(r"[^\w\s]").unwrap(); // Remove punctuation
    let cleaned_text = re.replace_all(&text, " ").to_string();

    // Split into words, filter, and count frequencies
    let mut word_counts: HashMap<String, usize> = HashMap::new();
    for word in cleaned_text
        .split_whitespace()
        .map(|w| w.to_lowercase())
        .filter(|word| {
            // Filter conditions:
            // 1. Word length >= 3
            // 2. Not a stop word
            // 3. Contains at least one letter
            // 4. Not purely numeric
            // 5. Not in the HTML blacklist
            // 6. Does not contain numbers (e.g., "class569")
            word.len() >= 3
                && !stop_words.contains(word.as_str())
                && word.chars().any(|c| c.is_alphabetic())
                && !word.chars().all(|c| c.is_numeric())
                && !html_blacklist.contains(word.as_str())
                && !word.chars().any(|c| c.is_numeric()) // Exclude words with numbers
        })
    {
        *word_counts.entry(word).or_insert(0) += 1;
    }

    // Sort words by frequency in descending order
    let mut sorted_words: Vec<_> = word_counts.into_iter().collect();
    sorted_words.sort_by(|a, b| {
        // First sort by frequency (descending)
        let freq_cmp = b.1.cmp(&a.1);
        if freq_cmp == std::cmp::Ordering::Equal {
            // If frequencies are equal, sort alphabetically
            a.0.cmp(&b.0)
        } else {
            freq_cmp
        }
    });

    // Return the top 10 keywords (or fewer if there aren't enough)
    sorted_words.into_iter().take(10).collect()
}
