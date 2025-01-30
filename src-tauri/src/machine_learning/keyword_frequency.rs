use std::collections::HashMap;

pub fn keyword_frequency(keywords: Vec<&str>) -> HashMap<String, usize> {
    let mut frequency = HashMap::new();

    for keyword in keywords {
        *frequency.entry(keyword.to_string()).or_insert(0) += 1
    }
    frequency
}
