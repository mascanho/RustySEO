use reqwest::blocking::Client;
use scraper::{Html, Selector};
use std::collections::HashSet;
use url::{ParseError, Url};

pub fn extract_title(document: &Html) -> Option<String> {
    let title_selector = Selector::parse("title").unwrap();
    document
        .select(&title_selector)
        .next()
        .map(|e| e.inner_html())
}
