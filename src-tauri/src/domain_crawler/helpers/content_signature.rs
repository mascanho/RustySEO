//! Per-page content fingerprinting for duplicate/near-duplicate detection.
//!
//! Produces two independent, cheap-to-compare signatures per page:
//! - `content_simhash`: a 64-bit SimHash over 3-word shingles of the page's visible
//!   body text (same element selection as `word_count`). Near-duplicate pages end up
//!   with a small Hamming distance between their hashes, so similarity is a fast
//!   bitwise comparison instead of storing/diffing raw text.
//! - `heading_hash`: an exact hash of the normalized H1-H3 text, so pages that reuse
//!   the same heading structure (a common template/boilerplate smell) can be flagged
//!   even when their body copy differs.
//!
//! Both are computed once during crawl (see `url_processor.rs`, guarded by the
//! `duplicate_content_check_enabled` setting) and persisted as part of the per-page
//! JSON row, so clustering later (`duplicate_content.rs`) is pure integer math over
//! already-crawled data — no re-parsing or re-fetching required.

use once_cell::sync::Lazy;
use scraper::{Html, Selector};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

static CONTENT_SELECTOR: Lazy<Selector> =
    Lazy::new(|| Selector::parse("p, h1, h2, h3, h4, h5, h6, li, blockquote").unwrap());
static HEADING_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("h1, h2, h3").unwrap());

const SHINGLE_SIZE: usize = 3;

#[derive(Debug, Clone, Copy)]
pub struct ContentSignature {
    pub content_simhash: u64,
    /// `None` when the page has no H1-H3 text to fingerprint.
    pub heading_hash: Option<u64>,
}

pub fn compute_content_signature(document: &Html) -> ContentSignature {
    let body_text = collect_normalized_text(document, &CONTENT_SELECTOR);
    let heading_text = collect_normalized_text(document, &HEADING_SELECTOR);

    ContentSignature {
        content_simhash: simhash64(&shingle(&body_text, SHINGLE_SIZE)),
        heading_hash: if heading_text.is_empty() {
            None
        } else {
            Some(hash_str(&heading_text))
        },
    }
}

/// Lowercased, whitespace-normalized text of every matched element, space-joined.
fn collect_normalized_text(document: &Html, selector: &Selector) -> String {
    let mut buf = String::new();
    for element in document.select(selector) {
        for word in element.text().collect::<String>().split_whitespace() {
            let cleaned: String = word.chars().filter(|c| c.is_alphanumeric()).collect();
            if cleaned.is_empty() {
                continue;
            }
            if !buf.is_empty() {
                buf.push(' ');
            }
            buf.push_str(&cleaned.to_lowercase());
        }
    }
    buf
}

fn shingle(text: &str, n: usize) -> Vec<u64> {
    let words: Vec<&str> = text.split(' ').filter(|w| !w.is_empty()).collect();
    if words.is_empty() {
        return Vec::new();
    }
    if words.len() < n {
        return vec![hash_str(text)];
    }
    words.windows(n).map(|w| hash_str(&w.join(" "))).collect()
}

fn hash_str(s: &str) -> u64 {
    let mut hasher = DefaultHasher::new();
    s.hash(&mut hasher);
    hasher.finish()
}

/// Standard bit-voting SimHash: each shingle hash casts a +1/-1 vote per bit
/// depending on whether that bit is set; the final hash takes the sign of each
/// accumulator. Near-identical shingle sets converge to hashes with a small
/// Hamming distance, even when the exact wording/order differs slightly.
fn simhash64(shingles: &[u64]) -> u64 {
    if shingles.is_empty() {
        return 0;
    }
    let mut weights = [0i32; 64];
    for &h in shingles {
        for (bit, weight) in weights.iter_mut().enumerate() {
            if (h >> bit) & 1 == 1 {
                *weight += 1;
            } else {
                *weight -= 1;
            }
        }
    }
    let mut result: u64 = 0;
    for (bit, weight) in weights.iter().enumerate() {
        if *weight > 0 {
            result |= 1 << bit;
        }
    }
    result
}

pub fn hamming_distance(a: u64, b: u64) -> u32 {
    (a ^ b).count_ones()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn identical_text_has_zero_distance() {
        let doc = Html::parse_document("<p>The quick brown fox jumps over the lazy dog</p>");
        let sig_a = compute_content_signature(&doc);
        let sig_b = compute_content_signature(&doc);
        assert_eq!(hamming_distance(sig_a.content_simhash, sig_b.content_simhash), 0);
    }

    #[test]
    fn near_duplicate_text_has_small_distance() {
        let a = Html::parse_document(
            "<p>The quick brown fox jumps over the lazy dog near the river</p>",
        );
        let b = Html::parse_document(
            "<p>The quick brown fox jumps over the lazy dog near the riverbank</p>",
        );
        let sig_a = compute_content_signature(&a);
        let sig_b = compute_content_signature(&b);
        assert!(hamming_distance(sig_a.content_simhash, sig_b.content_simhash) < 20);
    }

    #[test]
    fn unrelated_text_has_large_distance() {
        let a = Html::parse_document("<p>The quick brown fox jumps over the lazy dog</p>");
        let b = Html::parse_document(
            "<p>Quarterly revenue increased due to strong enterprise software demand</p>",
        );
        let sig_a = compute_content_signature(&a);
        let sig_b = compute_content_signature(&b);
        assert!(hamming_distance(sig_a.content_simhash, sig_b.content_simhash) > 15);
    }

    #[test]
    fn empty_headings_yield_none() {
        let doc = Html::parse_document("<p>No headings here</p>");
        let sig = compute_content_signature(&doc);
        assert!(sig.heading_hash.is_none());
    }
}
