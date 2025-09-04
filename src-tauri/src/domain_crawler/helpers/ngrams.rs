pub fn check_ngrams(text: &str, n: usize, url: &str) -> Vec<String> {
    let words: Vec<&str> = text
        .split_whitespace()
        .map(|word| word.trim_matches(|c: char| !c.is_alphanumeric()))
        .filter(|word| !word.is_empty())
        .collect();

    let mut ngrams = Vec::new();
    for i in 0..=words.len().saturating_sub(n) {
        let ngram = words[i..i + n].join(" ");
        ngrams.push(ngram);
    }

    ngrams
}
