use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InternalExternalLinks {
    pub internal: LinksAnchors,
    pub external: LinksAnchors,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LinksAnchors {
    pub links: Vec<String>,
    pub anchors: Vec<String>,
}

pub fn extract_internal_external_links(html: &str) -> Option<InternalExternalLinks> {
    let document = Html::parse_document(html);

    // Selector for internal links (starting with '/')
    let internal_selector = Selector::parse("a[href^='/']").ok()?;
    // Selector for external links (starting with 'http' or 'https')
    let external_selector = Selector::parse("a[href^='http']").ok()?;

    // Extract internal links and anchor texts
    let internal_links = document
        .select(&internal_selector)
        .filter_map(|element| element.value().attr("href").map(|href| href.to_string()))
        .collect::<Vec<String>>();

    let internal_anchors = document
        .select(&internal_selector)
        .map(|element| element.text().collect::<String>())
        .collect::<Vec<String>>();

    // Extract external links and anchor texts
    let external_links = document
        .select(&external_selector)
        .filter_map(|element| element.value().attr("href").map(|href| href.to_string()))
        .collect::<Vec<String>>();

    let external_anchors = document
        .select(&external_selector)
        .map(|element| element.text().collect::<String>())
        .collect::<Vec<String>>();

    // Return the result regardless of whether internal or external links are empty
    Some(InternalExternalLinks {
        internal: LinksAnchors {
            links: internal_links,
            anchors: internal_anchors,
        },
        external: LinksAnchors {
            links: external_links,
            anchors: external_anchors,
        },
    })
}
