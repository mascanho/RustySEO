pub fn set_taxonomies() -> Vec<String> {
    let taxonomies = vec!["downloads", "events", "blog"];

    taxonomies.iter().map(|t| t.to_string()).collect()
}
