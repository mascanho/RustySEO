use std::collections::HashMap;

pub fn parse_opengraph(html: &str) -> Result<HashMap<String, String>, String> {
    let document = Document::from(html);
    let mut opengraph = HashMap::new();

    for meta in document.find(Name("meta")) {
        if let Some(property) = meta.attr("property") {
            if let Some(content) = meta.attr("content") {
                opengraph.insert(property.to_string(), content.to_string());
            }
        }
    }

    Ok(opengraph)
}
