use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InternalExternalLinks {
    pub internal: linksAnchors,
    pub external: linksAnchors,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct linksAnchors {
    pub links: Vec<String>,
    pub anchors: Vec<String>,
}

pub fn extract_internal_external_links(html: &str) -> InternalExternalLinks {
    let document = Html::parse_document(html);

    let internal_anchor_text = document
        .select(&Selector::parse("a[href^='/']").unwrap())
        .map(|element| element.text().collect::<Vec<_>>().join(" "))
        .collect::<Vec<String>>();

    let external_anchor_text = document
        .select(&Selector::parse("a[href^='http']").unwrap())
        .map(|element| element.text().collect::<Vec<_>>().join(" "))
        .collect::<Vec<String>>();

    let anchor_text = [internal_anchor_text.clone(), external_anchor_text.clone()].concat();

    let internal_links = document
        .select(&Selector::parse("a[href^='/']").unwrap())
        .map(|link| link.value().attr("href").unwrap().to_string())
        .collect::<Vec<String>>();

    let external_links = document
        .select(&Selector::parse("a[href^='http']").unwrap())
        .map(|link| link.value().attr("href").unwrap().to_string())
        .collect::<Vec<String>>();

    let internal = [internal_links.clone(), internal_anchor_text.clone()].concat();
    let external = [external_links.clone(), external_anchor_text.clone()].concat();

    InternalExternalLinks {
        internal: linksAnchors {
            links: internal,
            anchors: internal_anchor_text,
        },
        external: linksAnchors {
            links: external,
            anchors: external_anchor_text,
        },
    }
}
