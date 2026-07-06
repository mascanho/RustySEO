//! Screaming Frog-style "Link Score": an internal PageRank variant computed over the
//! crawled site's internal linking architecture, normalised to a 1-100 scale.
//!
//! Algorithm (see docs/product spec):
//! 1. Eligible URLs = internal pages that were crawled successfully (2xx) and are not
//!    themselves bypassed by a redirect or canonical (their authority flows to the
//!    target instead).
//! 2. Each eligible URL starts with an initial score of 1/n.
//! 3. Score flows across AHREF links for 10 iterations using the damped formula:
//!    score = ((1 - D) / n) + (D * sum(inbound link score))
//!    where D = 0.85. Nofollow links "evaporate" score (counted in the outbound link
//!    total but pass nothing on). Redirects/canonicals bypass to their final target.
//! 4. Raw scores are min-max scaled to 1-100 (highest raw score -> 100, lowest -> 1).

use serde_json::Value;
use std::collections::{HashMap, HashSet};
use url::Url;

const DAMPING: f64 = 0.85;
const ITERATIONS: usize = 10;

/// Computes Link Score (1-100) for every eligible URL found in `pages`.
/// `pages` is the raw crawl data as stored per-page (one JSON object per crawled URL).
/// URLs that aren't eligible (not internal/successful, or bypassed by a redirect/canonical)
/// are simply absent from the returned map.
pub fn compute_link_scores(pages: &[Value]) -> HashMap<String, u32> {
    let mut candidate_urls: HashSet<String> = HashSet::new();
    // Maps a URL to the URL its authority should flow to instead (redirect/canonical target).
    let mut bypass: HashMap<String, String> = HashMap::new();
    let mut raw_edges: Vec<(String, Vec<(String, bool)>)> = Vec::new();
    // Maps normalized URL -> the exact, un-normalized string stored in the `url` column,
    // so scores can be written back with a key that actually matches that column.
    let mut raw_url_of: HashMap<String, String> = HashMap::new();

    for page in pages {
        let Some(raw_url) = page.get("url").and_then(|v| v.as_str()) else {
            continue;
        };
        let url = normalize(raw_url);

        let status_code = page.get("status_code").and_then(|v| v.as_u64()).unwrap_or(0);
        if (200..300).contains(&status_code) {
            candidate_urls.insert(url.clone());
            raw_url_of
                .entry(url.clone())
                .or_insert_with(|| raw_url.to_string());
        }

        // Redirect bypass: forward authority from the originally requested URL (and any
        // intermediate hop) to the final resolved `url` of this row.
        if let Some(original) = page.get("original_url").and_then(|v| v.as_str()) {
            let original = normalize(original);
            if original != url {
                bypass.insert(original, url.clone());
            }
        }
        if let Some(hops) = page.get("redirect_chain").and_then(|v| v.as_array()) {
            for hop in hops {
                if let Some(hop_url) = hop.get("url").and_then(|v| v.as_str()) {
                    let hop_url = normalize(hop_url);
                    if hop_url != url {
                        bypass.entry(hop_url).or_insert_with(|| url.clone());
                    }
                }
            }
        }

        // Canonical bypass: if this page canonicalises to a different URL, its authority
        // (inbound and outbound) is treated as belonging to the canonical target.
        if let Some(canonical_target) = first_resolved_canonical(page, &url) {
            if canonical_target != url {
                bypass.insert(url.clone(), canonical_target);
            }
        }

        // Collect this page's outbound internal AHREF edges (unresolved for now).
        let mut edges = Vec::new();
        if let Some(internal) = page
            .get("inoutlinks_status_codes")
            .and_then(|v| v.get("internal"))
            .and_then(|v| v.as_array())
        {
            for link in internal {
                let Some(target) = link.get("url").and_then(|v| v.as_str()) else {
                    continue;
                };
                let is_nofollow = link
                    .get("rel")
                    .and_then(|v| v.as_str())
                    .map(|r| r.to_lowercase().contains("nofollow"))
                    .unwrap_or(false);
                edges.push((normalize(target), is_nofollow));
            }
        }
        raw_edges.push((url, edges));
    }

    // Follows the bypass chain to a URL's final destination, with cycle protection.
    let resolve = |start: &str| -> String {
        let mut current = start.to_string();
        let mut seen = HashSet::new();
        while let Some(next) = bypass.get(&current) {
            if next == &current || !seen.insert(current.clone()) {
                break;
            }
            current = next.clone();
        }
        current
    };

    // Eligible = successfully-crawled pages that aren't themselves bypassed elsewhere.
    let eligible: HashSet<String> = candidate_urls
        .iter()
        .filter(|u| resolve(u) == **u)
        .cloned()
        .collect();

    if eligible.is_empty() {
        return HashMap::new();
    }

    // Build the resolved, deduplicated, non-self-referencing outbound edge list.
    let mut outbound: HashMap<String, Vec<(String, bool)>> = HashMap::new();
    for (source, edges) in raw_edges {
        let resolved_source = resolve(&source);
        if !eligible.contains(&resolved_source) {
            continue;
        }
        let mut seen_targets: HashSet<String> = HashSet::new();
        for (target, is_nofollow) in edges {
            let resolved_target = resolve(&target);
            if resolved_target == resolved_source {
                continue; // non self-referencing
            }
            if !seen_targets.insert(resolved_target.clone()) {
                continue; // unique links only (multiple links A->B count once)
            }
            outbound
                .entry(resolved_source.clone())
                .or_default()
                .push((resolved_target, is_nofollow));
        }
    }

    // Iteratively compute Link Score using the damped PageRank-style formula.
    let n = eligible.len() as f64;
    let base = (1.0 - DAMPING) / n;
    let mut scores: HashMap<String, f64> = eligible.iter().map(|u| (u.clone(), 1.0 / n)).collect();

    for _ in 0..ITERATIONS {
        let mut inbound_sum: HashMap<String, f64> = HashMap::new();
        for (source, edges) in &outbound {
            let source_score = *scores.get(source).unwrap_or(&0.0);
            let out_count = edges.len() as f64;
            if out_count == 0.0 {
                continue;
            }
            let share = source_score / out_count;
            for (target, is_nofollow) in edges {
                if *is_nofollow {
                    continue; // nofollow evaporates: counted above in out_count, passes nothing on
                }
                *inbound_sum.entry(target.clone()).or_insert(0.0) += share;
            }
        }

        scores = eligible
            .iter()
            .map(|url| {
                let inbound = inbound_sum.get(url).copied().unwrap_or(0.0);
                (url.clone(), base + DAMPING * inbound)
            })
            .collect();
    }

    // Normalise raw scores to 1-100: highest -> 100, lowest -> 1.
    let min = scores.values().cloned().fold(f64::INFINITY, f64::min);
    let max = scores.values().cloned().fold(f64::NEG_INFINITY, f64::max);
    let range = max - min;

    scores
        .into_iter()
        .map(|(url, score)| {
            let normalised = if range < 1e-12 {
                100.0
            } else {
                1.0 + (score - min) / range * 99.0
            };
            // Key by the original, un-normalized URL so callers can match it against the
            // `url` column verbatim (normalization here is only for internal deduping).
            let raw_url = raw_url_of.get(&url).cloned().unwrap_or(url);
            (raw_url, normalised.round().clamp(1.0, 100.0) as u32)
        })
        .collect()
}

/// Strips fragments and trailing slashes so equivalent URLs compare equal.
fn normalize(url: &str) -> String {
    let mut u = url.trim();
    if let Some(idx) = u.find('#') {
        u = &u[..idx];
    }
    let mut u = u.to_string();
    if u.len() > 1 && u.ends_with('/') {
        u.pop();
    }
    u
}

/// Resolves the page's first HTML canonical href (if any) to an absolute, normalised URL.
fn first_resolved_canonical(page: &Value, own_url: &str) -> Option<String> {
    let canonical_href = page
        .get("canonicals")
        .and_then(|v| v.as_array())
        .and_then(|arr| arr.first())
        .and_then(|v| v.as_str())?;

    let base = Url::parse(own_url).ok()?;
    let resolved = base.join(canonical_href).ok()?;
    Some(normalize(resolved.as_str()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn page(url: &str, status: u64, links: Vec<(&str, bool)>) -> Value {
        json!({
            "url": url,
            "status_code": status,
            "original_url": url,
            "canonicals": Value::Null,
            "inoutlinks_status_codes": {
                "internal": links.into_iter().map(|(target, nofollow)| json!({
                    "url": target,
                    "rel": if nofollow { Value::String("nofollow".to_string()) } else { Value::Null },
                })).collect::<Vec<_>>()
            }
        })
    }

    #[test]
    fn hub_page_scores_highest() {
        let pages = vec![
            page("https://site.com/hub", 200, vec![
                ("https://site.com/a", false),
                ("https://site.com/b", false),
                ("https://site.com/c", false),
            ]),
            page("https://site.com/a", 200, vec![("https://site.com/hub", false)]),
            page("https://site.com/b", 200, vec![("https://site.com/hub", false)]),
            page("https://site.com/c", 200, vec![("https://site.com/hub", false)]),
        ];

        let scores = compute_link_scores(&pages);
        assert_eq!(scores.len(), 4);
        let hub_score = scores["https://site.com/hub"];
        assert!(hub_score > scores["https://site.com/a"]);
        assert_eq!(hub_score, 100);
    }

    #[test]
    fn nofollow_link_does_not_pass_score() {
        let pages = vec![
            page("https://site.com/a", 200, vec![("https://site.com/b", true)]),
            page("https://site.com/b", 200, vec![]),
        ];
        let scores = compute_link_scores(&pages);
        // With no followed inbound links, b only gets the baseline (1-D)/n term.
        assert!(scores["https://site.com/b"] <= scores["https://site.com/a"]);
    }

    #[test]
    fn redirect_bypasses_to_final_target() {
        let mut old = page("https://site.com/new", 200, vec![]);
        old["original_url"] = json!("https://site.com/old");
        let pages = vec![
            page("https://site.com/linker", 200, vec![("https://site.com/old", false)]),
            old,
        ];
        let scores = compute_link_scores(&pages);
        // /old should not be eligible on its own; /new should be present and receive the score.
        assert!(!scores.contains_key("https://site.com/old"));
        assert!(scores.contains_key("https://site.com/new"));
    }

    #[test]
    fn self_referencing_link_is_ignored() {
        let pages = vec![page("https://site.com/a", 200, vec![("https://site.com/a", false)])];
        let scores = compute_link_scores(&pages);
        assert_eq!(scores.len(), 1);
        assert_eq!(scores["https://site.com/a"], 100);
    }
}
