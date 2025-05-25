pub fn trim_browser_name(browser_string: &str) -> String {
    if browser_string == "Other" {
        return browser_string.to_string();
    }

    browser_string
        .split("/")
        .next()
        .unwrap_or(browser_string)
        .to_string()
}
