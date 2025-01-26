use regex::Regex;

pub fn extract_title(html: &str) -> Option<String> {
    let re = Regex::new(r"<title>(.*?)</title>").unwrap();
    re.captures(html)
        .and_then(|cap| cap.get(1))
        .map(|title| title.as_str().trim().to_string())
}
