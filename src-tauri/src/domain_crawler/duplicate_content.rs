//! Post-crawl clustering of similar/identical pages.
//!
//! Consumes the per-page `content_simhash` / `heading_hash` fingerprints computed
//! during crawl (see `helpers::content_signature`, gated behind the
//! `duplicate_content_check_enabled` setting) and groups pages that are likely
//! duplicates. This is pure integer math over already-crawled JSON rows — no HTML
//! re-parsing, no re-fetching — so it stays cheap even on large sites; the one
//! expensive step (text shingling) already happened once, inline, during the crawl.

use serde::Serialize;
use serde_json::Value;
use std::collections::HashMap;

use super::helpers::content_signature::hamming_distance;
use super::helpers::normalize_url::normalize_url;

/// Two SimHashes within this Hamming distance (out of 64 bits) are treated as
/// near-duplicate content. ~10% of bits differing is a conventional threshold for
/// SimHash-based near-duplicate detection.
const DEFAULT_HAMMING_THRESHOLD: u32 = 6;
/// SimHash is split into this many bands for LSH bucketing, so only pages that
/// already agree on a whole band are ever candidate-compared — keeping this close
/// to linear instead of an O(n^2) all-pairs scan across the whole crawl.
const BAND_COUNT: u32 = 4;
const BAND_BITS: u32 = 64 / BAND_COUNT;

#[derive(Debug, Clone, Serialize)]
pub struct DuplicatePage {
    pub url: String,
    pub title: Option<String>,
    pub word_count: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct DuplicateGroup {
    /// "headings" (exact H1-H3 match) or "content" (near-duplicate body SimHash cluster).
    pub kind: &'static str,
    /// 0-100. Heading groups are always 100 (exact match); content groups are derived
    /// from the worst (lowest) pairwise similarity found inside the cluster.
    pub similarity: u8,
    pub pages: Vec<DuplicatePage>,
}

struct PageFingerprint {
    url: String,
    title: Option<String>,
    word_count: usize,
    content_simhash: Option<u64>,
    heading_hash: Option<u64>,
}

/// Finds duplicate-heading and near-duplicate-content clusters across a completed
/// crawl. Pages crawled before the check was enabled (no stored fingerprint) are
/// silently excluded rather than treated as one giant false-positive cluster.
pub fn find_duplicate_groups(pages: &[Value]) -> Vec<DuplicateGroup> {
    let fingerprints = extract_fingerprints(pages);

    let mut groups = find_heading_duplicates(&fingerprints);
    groups.extend(find_content_duplicates(
        &fingerprints,
        DEFAULT_HAMMING_THRESHOLD,
    ));
    groups.sort_by(|a, b| b.similarity.cmp(&a.similarity));
    groups
}

fn extract_fingerprints(pages: &[Value]) -> Vec<PageFingerprint> {
    let mut by_normalized_url: HashMap<String, PageFingerprint> = HashMap::new();

    for page in pages {
        let Some(url) = page.get("url").and_then(|u| u.as_str()) else {
            continue;
        };
        let title = page
            .get("title")
            .and_then(|t| t.as_array())
            .and_then(|arr| arr.first())
            .and_then(|t| t.get("title"))
            .and_then(|t| t.as_str())
            .map(|s| s.to_string());
        let word_count = page
            .get("word_count")
            .and_then(|v| v.as_u64())
            .unwrap_or(0) as usize;
        let content_simhash = page.get("content_simhash").and_then(|v| v.as_u64());
        let heading_hash = page.get("heading_hash").and_then(|v| v.as_u64());

        // Trailing slash / no trailing slash (and other normalizable differences) refer
        // to the same page, not two different pages that happen to share content — so
        // only the first-seen variant is kept for clustering, avoiding false-positive
        // "duplicate" pairs like https://x.com/a vs https://x.com/a/.
        by_normalized_url
            .entry(normalize_url(url))
            .or_insert(PageFingerprint {
                url: url.to_string(),
                title,
                word_count,
                content_simhash,
                heading_hash,
            });
    }

    by_normalized_url.into_values().collect()
}

fn find_heading_duplicates(fingerprints: &[PageFingerprint]) -> Vec<DuplicateGroup> {
    let mut by_hash: HashMap<u64, Vec<usize>> = HashMap::new();
    for (idx, fp) in fingerprints.iter().enumerate() {
        if let Some(hash) = fp.heading_hash {
            by_hash.entry(hash).or_default().push(idx);
        }
    }

    by_hash
        .into_values()
        .filter(|idxs| idxs.len() > 1)
        .map(|idxs| DuplicateGroup {
            kind: "headings",
            similarity: 100,
            pages: idxs
                .into_iter()
                .map(|i| to_duplicate_page(&fingerprints[i]))
                .collect(),
        })
        .collect()
}

/// LSH banding + union-find over the body SimHash: pages are bucketed by each of
/// `BAND_COUNT` 16-bit slices of their hash; any two pages sharing a bucket on *any*
/// band are merged into the same cluster once their full 64-bit Hamming distance is
/// also confirmed to be within `threshold`.
fn find_content_duplicates(
    fingerprints: &[PageFingerprint],
    threshold: u32,
) -> Vec<DuplicateGroup> {
    let n = fingerprints.len();
    let mut parent: Vec<usize> = (0..n).collect();

    fn find(parent: &mut [usize], x: usize) -> usize {
        if parent[x] != x {
            parent[x] = find(parent, parent[x]);
        }
        parent[x]
    }
    fn union(parent: &mut [usize], a: usize, b: usize) {
        let ra = find(parent, a);
        let rb = find(parent, b);
        if ra != rb {
            parent[ra] = rb;
        }
    }

    for band in 0..BAND_COUNT {
        let shift = band * BAND_BITS;
        let mask: u64 = ((1u64 << BAND_BITS) - 1) << shift;

        let mut buckets: HashMap<u64, Vec<usize>> = HashMap::new();
        for (idx, fp) in fingerprints.iter().enumerate() {
            // A zero hash means an empty/unfingerprinted page — never bucket these,
            // or every blank page in the crawl would collapse into one "duplicate" cluster.
            if let Some(hash) = fp.content_simhash.filter(|h| *h != 0) {
                buckets.entry(hash & mask).or_default().push(idx);
            }
        }

        for bucket in buckets.into_values().filter(|b| b.len() > 1) {
            for i in 0..bucket.len() {
                for j in (i + 1)..bucket.len() {
                    let (a, b) = (bucket[i], bucket[j]);
                    let ha = fingerprints[a].content_simhash.unwrap();
                    let hb = fingerprints[b].content_simhash.unwrap();
                    if hamming_distance(ha, hb) <= threshold {
                        union(&mut parent, a, b);
                    }
                }
            }
        }
    }

    let mut clusters: HashMap<usize, Vec<usize>> = HashMap::new();
    for idx in 0..n {
        if !matches!(fingerprints[idx].content_simhash, Some(h) if h != 0) {
            continue;
        }
        let root = find(&mut parent, idx);
        clusters.entry(root).or_default().push(idx);
    }

    clusters
        .into_values()
        .filter(|idxs| idxs.len() > 1)
        .map(|idxs| {
            let similarity = cluster_similarity(fingerprints, &idxs);
            DuplicateGroup {
                kind: "content",
                similarity,
                pages: idxs
                    .into_iter()
                    .map(|i| to_duplicate_page(&fingerprints[i]))
                    .collect(),
            }
        })
        .collect()
}

/// Worst-case (lowest) pairwise similarity within the cluster, so the reported number
/// is a conservative floor rather than an optimistic best-pair match.
fn cluster_similarity(fingerprints: &[PageFingerprint], idxs: &[usize]) -> u8 {
    let mut max_distance = 0u32;
    for i in 0..idxs.len() {
        for j in (i + 1)..idxs.len() {
            let ha = fingerprints[idxs[i]].content_simhash.unwrap();
            let hb = fingerprints[idxs[j]].content_simhash.unwrap();
            max_distance = max_distance.max(hamming_distance(ha, hb));
        }
    }
    (100 - (max_distance * 100 / 64).min(100)) as u8
}

fn to_duplicate_page(fp: &PageFingerprint) -> DuplicatePage {
    DuplicatePage {
        url: fp.url.clone(),
        title: fp.title.clone(),
        word_count: fp.word_count,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn clusters_pages_with_identical_content_hash() {
        let pages = vec![
            json!({"url": "https://a.com/1", "title": [{"title": "One"}], "word_count": 100, "content_simhash": 12345u64, "heading_hash": 999u64}),
            json!({"url": "https://a.com/2", "title": [{"title": "Two"}], "word_count": 100, "content_simhash": 12345u64, "heading_hash": 999u64}),
            json!({"url": "https://a.com/3", "title": [{"title": "Three"}], "word_count": 50, "content_simhash": 99999999u64, "heading_hash": 111u64}),
        ];

        let groups = find_duplicate_groups(&pages);
        let content_group = groups.iter().find(|g| g.kind == "content").unwrap();
        assert_eq!(content_group.pages.len(), 2);
        assert_eq!(content_group.similarity, 100);

        let heading_group = groups.iter().find(|g| g.kind == "headings").unwrap();
        assert_eq!(heading_group.pages.len(), 2);
    }

    #[test]
    fn does_not_flag_trailing_slash_variant_as_a_duplicate() {
        let pages = vec![
            json!({"url": "https://a.com/page", "title": [{"title": "Page"}], "word_count": 100, "content_simhash": 12345u64, "heading_hash": 999u64}),
            json!({"url": "https://a.com/page/", "title": [{"title": "Page"}], "word_count": 100, "content_simhash": 12345u64, "heading_hash": 999u64}),
        ];
        assert!(find_duplicate_groups(&pages).is_empty());
    }

    #[test]
    fn trailing_slash_variant_collapses_into_the_real_duplicate_cluster() {
        let pages = vec![
            json!({"url": "https://a.com/page", "title": [{"title": "Page"}], "word_count": 100, "content_simhash": 12345u64, "heading_hash": 999u64}),
            json!({"url": "https://a.com/page/", "title": [{"title": "Page"}], "word_count": 100, "content_simhash": 12345u64, "heading_hash": 999u64}),
            json!({"url": "https://a.com/other", "title": [{"title": "Other"}], "word_count": 100, "content_simhash": 12345u64, "heading_hash": 999u64}),
        ];

        let groups = find_duplicate_groups(&pages);
        let content_group = groups.iter().find(|g| g.kind == "content").unwrap();
        assert_eq!(content_group.pages.len(), 2);

        let heading_group = groups.iter().find(|g| g.kind == "headings").unwrap();
        assert_eq!(heading_group.pages.len(), 2);
    }

    #[test]
    fn ignores_pages_without_fingerprints() {
        let pages = vec![
            json!({"url": "https://a.com/1", "word_count": 100}),
            json!({"url": "https://a.com/2", "word_count": 100}),
        ];
        assert!(find_duplicate_groups(&pages).is_empty());
    }

    #[test]
    fn no_false_cluster_from_empty_pages() {
        let pages = vec![
            json!({"url": "https://a.com/1", "word_count": 0, "content_simhash": 0u64}),
            json!({"url": "https://a.com/2", "word_count": 0, "content_simhash": 0u64}),
        ];
        assert!(find_duplicate_groups(&pages).is_empty());
    }
}
