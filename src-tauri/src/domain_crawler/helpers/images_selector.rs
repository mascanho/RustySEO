use scraper::{Html, Selector};

pub fn extract_images(body: &str) -> Vec<String> {
    let document = Html::parse_document(body);
    let img_selector =
        Selector::parse("img").expect("Failed to parse images from the page. -> extract_images.rs");

    let mut images = Vec::new();

    for image in document.select(&img_selector) {
        if let Some(src) = image.value().attr("src") {
            images.push(src.to_string());
        } else {
            images.push("".to_string());
        }
    }

    images
}
