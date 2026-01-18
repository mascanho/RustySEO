use once_cell::sync::Lazy;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct AltTags {
    pub with_alt_tags: Vec<String>,
    pub without_alt_tags: Vec<String>,
    pub alt_tags_total: Vec<String>,
}

static IMG_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("img").unwrap());

pub fn get_alt_tags(document: &Html) -> AltTags {
    let mut with_alt_tags = Vec::new();
    let mut without_alt_tags = Vec::new();
    let mut alt_tags_total = Vec::new();

    for image in document.select(&IMG_SELECTOR) {
        let alt_tag = image.value().attr("alt");
        match alt_tag {
            Some(alt) => {
                with_alt_tags.push(alt.to_string());
                alt_tags_total.push(alt.to_string());
            }
            None => {
                without_alt_tags.push(String::new());
                alt_tags_total.push(String::new());
            }
        }
    }

    AltTags {
        with_alt_tags,
        without_alt_tags,
        alt_tags_total,
    }
}

