// Extract URL pattern to identify similar URLs
pub fn extract_url_pattern(url: &str) -> String {
    let mut pattern = url.to_string();

    // More conservative number replacement to preserve URL uniqueness
    let mut chars: Vec<char> = pattern.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        if chars[i].is_ascii_digit() {
            let start = i;
            let mut digit_count = 0;
            while i < chars.len() && chars[i].is_ascii_digit() {
                digit_count += 1;
                i += 1;
            }

            // Only replace sequences of 4+ digits (very likely to be IDs)
            // AND if they're not part of a year (1900-2099)
            if digit_count >= 4 {
                let digit_str: String = chars[start..i].iter().collect();
                if let Ok(num) = digit_str.parse::<u32>() {
                    // Don't replace years or common numbers
                    if !(1900..=2099).contains(&num) && num > 999 {
                        for j in start..i {
                            chars[j] = 'N';
                        }
                        // Keep only one 'N'
                        for _ in start..(i - 1) {
                            if start < chars.len() {
                                chars.remove(start);
                            }
                        }
                        i = start + 1;
                    }
                }
            }
        } else {
            i += 1;
        }
    }
    pattern = chars.into_iter().collect::<String>();

    // Only remove query parameters with many parameters (likely filters/pagination)
    if let Some(pos) = pattern.find('?') {
        let query_part = &pattern[pos..];
        // Keep URLs with simple query parameters
        if query_part.matches('&').count() > 2 {
            pattern = pattern[..pos].to_string();
        }
    }

    pattern
}
