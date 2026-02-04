use once_cell::sync::Lazy;
use scraper::{Html, Selector};

static LANG_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("html[lang]").unwrap());
static CONTENT_LANG_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse(r#"meta[http-equiv="Content-Language"]"#).unwrap());

pub fn detect_language(document: &Html) -> Option<String> {
    // Check the <html> tag's lang attribute
    if let Some(lang) = document
        .select(&LANG_SELECTOR)
        .next()
        .and_then(|html_element| {
            html_element
                .value()
                .attr("lang")
                .map(|lang| lang.to_string())
        })
    {
        return Some(lang);
    }

    // Check the <meta> tag for Content-Language
    if let Some(content) = document
        .select(&CONTENT_LANG_SELECTOR)
        .next()
        .and_then(|meta_element| {
            meta_element
                .value()
                .attr("content")
                .map(|content| content.to_string())
        })
    {
        return Some(content);
    }

    // New Fallback: Check for og:locale or name="language"
    let extra_langs = Selector::parse(r#"meta[property="og:locale"], meta[name="language"]"#).unwrap();
    if let Some(el) = document.select(&extra_langs).next() {
        if let Some(content) = el.value().attr("content") {
            return Some(content.to_string());
        }
    }

    // No language found
    None
}

