use once_cell::sync::Lazy;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use url::Url;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PdfLinks {
    pdf_links: Vec<String>,
}

static PDF_SELECTOR: Lazy<Selector> = Lazy::new(|| Selector::parse("a[href$='.pdf']").expect("Failed to parse PDF selector"));

pub fn extract_pdf_links(document: &Html, base_url: &Url) -> Option<PdfLinks> {
    let mut pdf_links = Vec::new();

    for element in document.select(&PDF_SELECTOR) {
        if let Some(href) = element.value().attr("href") {
            // Convert relative URLs to absolute URLs
            match Url::parse(href) {
                Ok(absolute_url) => pdf_links.push(absolute_url.to_string()),
                Err(_) => {
                    // Handle relative URLs
                    if let Ok(full_url) = base_url.join(href) {
                        pdf_links.push(full_url.to_string());
                    }
                }
            }
        }
    }

    // Return Some(PdfLinks) if PDFs were found, otherwise None
    if pdf_links.is_empty() {
        None
    } else {
        Some(PdfLinks { pdf_links })
    }
}

