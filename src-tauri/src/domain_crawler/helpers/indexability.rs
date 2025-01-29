use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Indexability {
    pub indexability: f32,
    pub indexability_reason: String,
}

pub fn extract_indexability(html: &str) -> Indexability {
    let document = Html::parse_document(html);

    // Check for meta robots tags
    let robots_indexability = check_meta_robots(&document);
    if robots_indexability.indexability != 0.5 {
        return robots_indexability;
    }

    // Check for canonical tags
    let canonical_indexability = check_canonical_tag(&document);
    if canonical_indexability.indexability != 0.5 {
        return canonical_indexability;
    }

    // Default case: No meta robots or canonical tags found
    Indexability {
        indexability: 0.5,
        indexability_reason: "No meta robots or canonical tags found".to_string(),
    }
}

/// Checks for `<meta name="robots">` or `<meta name="googlebot">` tags.
fn check_meta_robots(document: &Html) -> Indexability {
    let meta_selectors = [
        Selector::parse("meta[name='robots']").unwrap(),
        Selector::parse("meta[name='googlebot']").unwrap(),
    ];

    for selector in &meta_selectors {
        if let Some(meta_element) = document.select(selector).next() {
            if let Some(content) = meta_element.value().attr("content") {
                let content = content.trim().to_lowercase();
                let (indexability, reason) = match content.as_str() {
                    "index, follow" => {
                        (1.0, "Indexable: 'index, follow' meta tag found".to_string())
                    }
                    "noindex, follow" => (
                        0.0,
                        "Not indexable: 'noindex, follow' meta tag found".to_string(),
                    ),
                    "index, nofollow" => (
                        0.8,
                        "Partially indexable: 'index, nofollow' meta tag found".to_string(),
                    ),
                    "noindex, nofollow" => (
                        0.0,
                        "Not indexable: 'noindex, nofollow' meta tag found".to_string(),
                    ),
                    _ => (0.5, format!("Unknown meta tag content: '{}'", content)),
                };
                return Indexability {
                    indexability,
                    indexability_reason: reason,
                };
            }
        }
    }

    Indexability {
        indexability: 0.5,
        indexability_reason: "No meta robots tags found".to_string(),
    }
}

/// Checks for canonical tags.
fn check_canonical_tag(document: &Html) -> Indexability {
    let canonical_selector = Selector::parse("link[rel='canonical']").unwrap();
    if let Some(canonical_element) = document.select(&canonical_selector).next() {
        if let Some(href) = canonical_element.value().attr("href") {
            return Indexability {
                indexability: 0.8, // Canonical tags suggest partial indexability
                indexability_reason: format!("Canonical tag found pointing to: {}", href),
            };
        }
    }

    Indexability {
        indexability: 0.5,
        indexability_reason: "No canonical tag found".to_string(),
    }
}
