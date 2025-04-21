pub fn set_taxonomies() -> Vec<String> {
    let taxonomies = vec![
        "industries",
        "solutions",
        "downloads",
        "platform",
        "events",
        "blog",
    ];

    taxonomies.iter().map(|t| t.to_string()).collect()
}
