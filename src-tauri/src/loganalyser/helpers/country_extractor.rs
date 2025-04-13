pub fn extract_country(ip: &str) -> Option<String> {
    if ip.contains(':') {
        Some("Unknown (IPv6)".to_string())
    } else {
        match ip.split('.').next() {
            Some("66") => Some("US".to_string()),
            Some("163") => Some("NL".to_string()),
            Some("165") => Some("US".to_string()),
            Some("200") => Some("US".to_string()),
            Some("2a") => Some("EU".to_string()),
            _ => Some("Unknown".to_string()),
        }
    }
}
