use scraper::{Html, Selector};

pub struct Canonicals {
    pub canonicals: Vec<String>,
}

pub fn get_canonical(body: &str) -> Option<Canonicals> {
    let document = Html::parse_document(body); // No need for &body here
    let canonical_selector = Selector::parse("link[rel='canonical']").unwrap();

    let mut canonical_links = vec![];

    // Extract all canonicals
    for element in document.select(&canonical_selector) {
        // Extract the href attribute in the link tag
        if let Some(canonical_url) = element.value().attr("href") {
            canonical_links.push(canonical_url.to_string());
        }
    }

    // Return Some(Canonicals) if there are canonical links, otherwise None
    if !canonical_links.is_empty() {
        Some(Canonicals {
            canonicals: canonical_links,
        })
    } else {
        None
    }
}
