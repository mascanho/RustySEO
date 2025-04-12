use scraper::{Html, Selector};
use std::collections::HashSet;
use tauri::Url;

#[derive(Debug, Default, serde::Serialize, serde::Deserialize, Clone)]
pub struct CrossOriginSecurityReport {
    pub unsafe_anchors: Vec<UnsafeAnchor>,
    pub insecure_iframes: Vec<InsecureIframe>,
    pub mixed_content: Vec<MixedContent>,
    pub missing_cors_attrs: Vec<MissingCorsAttribute>,
    pub insecure_scripts: Vec<InsecureScript>,
    pub summary: SecuritySummary,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct UnsafeAnchor {
    pub href: String,
    pub outer_html: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct InsecureIframe {
    pub src: Option<String>,
    pub sandbox: Option<String>,
    pub outer_html: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct MixedContent {
    pub tag_name: String,
    pub attr: String,
    pub url: String,
    pub outer_html: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct MissingCorsAttribute {
    pub tag_name: String,
    pub attr: String,
    pub url: String,
    pub outer_html: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct InsecureScript {
    pub content: String,
    pub outer_html: String,
}

#[derive(Debug, Default, serde::Serialize, serde::Deserialize, Clone)]
pub struct SecuritySummary {
    pub total_unsafe_anchors: usize,
    pub total_insecure_iframes: usize,
    pub total_mixed_content: usize,
    pub total_missing_cors: usize,
    pub total_inline_scripts: usize,
}

pub fn analyze_cross_origin_security(html: &str, page_url: &Url) -> SecuritySummary {
    let document = Html::parse_document(html);
    let base_url = Url::parse(&page_url.to_string()).ok();
    let mut report = CrossOriginSecurityReport::default();

    // Check unsafe anchor tags (target="_blank" without noopener)
    let anchor_selector = Selector::parse("a[target='_blank']").unwrap();
    for element in document.select(&anchor_selector) {
        let rel = element.value().attr("rel").unwrap_or("");
        if !rel.contains("noopener") {
            let href = element.value().attr("href").unwrap_or("").to_string();
            report.unsafe_anchors.push(UnsafeAnchor {
                href,
                outer_html: element.html(),
            });
        }
    }

    // Check insecure iframes
    let iframe_selector = Selector::parse("iframe").unwrap();
    for element in document.select(&iframe_selector) {
        let sandbox = element.value().attr("sandbox").map(|s| s.to_string());
        if sandbox.is_none() {
            report.insecure_iframes.push(InsecureIframe {
                src: element.value().attr("src").map(|s| s.to_string()),
                sandbox,
                outer_html: element.html(),
            });
        }
    }

    // Check mixed content and missing crossorigin attributes
    let resource_selectors = [
        ("img", "src"),
        ("script", "src"),
        ("link", "href"),
        ("audio", "src"),
        ("video", "src"),
    ];

    for (tag, attr) in resource_selectors {
        let selector = Selector::parse(tag).unwrap();
        for element in document.select(&selector) {
            if let Some(url) = element.value().attr(attr) {
                // Check mixed content (HTTP on HTTPS page)
                if let Some(base) = &base_url {
                    if base.scheme() == "https" && url.starts_with("http://") {
                        report.mixed_content.push(MixedContent {
                            tag_name: tag.to_string(),
                            attr: attr.to_string(),
                            url: url.to_string(),
                            outer_html: element.html(),
                        });
                    }
                }

                // Check missing crossorigin attribute
                if !url.starts_with("data:") && element.value().attr("crossorigin").is_none() {
                    report.missing_cors_attrs.push(MissingCorsAttribute {
                        tag_name: tag.to_string(),
                        attr: attr.to_string(),
                        url: url.to_string(),
                        outer_html: element.html(),
                    });
                }
            }
        }
    }

    // Check inline scripts with potentially dangerous patterns
    let script_selector = Selector::parse("script:not([src])").unwrap();
    for element in document.select(&script_selector) {
        if let Some(script_content) = element.text().next() {
            let dangerous_patterns = [
                "fetch(",
                "XMLHttpRequest",
                "window.open",
                "document.cookie",
                "eval(",
                "setTimeout(",
                "setInterval(",
            ];

            if dangerous_patterns
                .iter()
                .any(|p| script_content.contains(p))
            {
                report.insecure_scripts.push(InsecureScript {
                    content: script_content.to_string(),
                    outer_html: element.html(),
                });
            }
        }
    }

    // Generate summary
    report.summary = SecuritySummary {
        total_unsafe_anchors: report.unsafe_anchors.len(),
        total_insecure_iframes: report.insecure_iframes.len(),
        total_mixed_content: report.mixed_content.len(),
        total_missing_cors: report.missing_cors_attrs.len(),
        total_inline_scripts: report.insecure_scripts.len(),
    };

    report.summary
}

// Example usage:
// let report = analyze_cross_origin_security(&html_content, "https://example.com");
// println!("{}", serde_json::to_string_pretty(&report).unwrap());
