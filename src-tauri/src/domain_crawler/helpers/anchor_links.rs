use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InternalExternalLinks {
    pub internal_links: Vec<String>,
    pub external_links: Vec<String>,
}

pub fn extract_internal_external_links(html: &str) -> InternalExternalLinks {
    let document = Html::parse_document(html);

    let internal_links = document
        .select(&Selector::parse("a[href^='/']").unwrap())
        .map(|link| link.value().attr("href").unwrap().to_string())
        .collect::<Vec<String>>();

    let external_links = document
        .select(&Selector::parse("a[href^='http']").unwrap())
        .map(|link| link.value().attr("href").unwrap().to_string())
        .collect::<Vec<String>>();

    InternalExternalLinks {
        internal_links,
        external_links,
    }
}
