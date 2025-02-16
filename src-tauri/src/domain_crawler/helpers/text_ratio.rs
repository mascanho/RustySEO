use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Debug, Clone, Deserialize)]
pub struct TextRatio {
    pub html_length: usize,
    pub text_length: usize,
    pub text_ratio: f64,
}

pub fn get_text_ratio(html_content: &str) -> Option<Vec<TextRatio>> {
    // Parse the HTML document
    let doc = Html::parse_document(html_content);

    // Select the <body> tag
    let selector = Selector::parse("body").ok()?;
    let body = doc.select(&selector).next()?;

    // Extract text content and concatenate it into a single string
    let text_content: String = body.text().collect::<Vec<_>>().join(" ").trim().to_string();

    // Calculate lengths
    let html_length = doc.html().len();
    let text_length = text_content.len();

    // Avoid division by zero
    if html_length == 0 {
        return None;
    }

    // Calculate the text ratio
    let text_ratio = (text_length as f64 / html_length as f64) * 100.0;

    // Create vector and add the TextRatio instance
    let mut text_ratio_vec = Vec::new();
    text_ratio_vec.push(TextRatio {
        html_length,
        text_length,
        text_ratio,
    });

    // Return the vector
    Some(text_ratio_vec)
}
