use regex::Regex;

pub fn headings_selector(html: &str) -> Option<String> {
    let re = Regex::new(r#"<h\d>(.*?)</h\d>"#).unwrap();

    let headings = re
        .captures(html)
        .and_then(|cap| cap.get(1))
        .map(|heading| heading.as_str().trim().to_string());

    headings
}
