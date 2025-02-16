use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use url::Url;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InternalExternalLinks {
    pub internal: LinksAnchors,
    pub external: LinksAnchors,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LinksAnchors {
    pub links: Vec<String>,
    pub anchors: Vec<String>,
}

/// Extracts internal and external links from an HTML document.
///
/// # Arguments
/// * `html` - The HTML content as a string.
/// * `base_url` - The base URL used to resolve relative links.
///
/// # Returns
/// An `Option<InternalExternalLinks>` containing internal and external links and their anchor texts.
pub fn extract_internal_external_links(
    html: &str,
    base_url: &Url,
) -> Option<InternalExternalLinks> {
    let document = Html::parse_document(html);

    // Selector for <a> tags with href attributes
    let link_selector = Selector::parse("a[href]").ok()?;

    // Extract all links and their anchor texts
    let (internal_links, internal_anchors, external_links, external_anchors) =
        document.select(&link_selector).fold(
            (Vec::new(), Vec::new(), Vec::new(), Vec::new()),
            |(
                mut internal_links,
                mut internal_anchors,
                mut external_links,
                mut external_anchors,
            ),
             element| {
                if let Some(href) = element.value().attr("href") {
                    // Resolve the URL (handle relative and absolute URLs)
                    let url = resolve_url(href, base_url);

                    // Get the anchor text
                    let anchor_text = element.text().collect::<String>();

                    // Classify as internal or external
                    if is_internal_link(&url, base_url) {
                        internal_links.push(href.to_string());
                        internal_anchors.push(anchor_text);
                    } else {
                        external_links.push(href.to_string());
                        external_anchors.push(anchor_text);
                    }
                }
                (
                    internal_links,
                    internal_anchors,
                    external_links,
                    external_anchors,
                )
            },
        );

    Some(InternalExternalLinks {
        internal: LinksAnchors {
            links: internal_links,
            anchors: internal_anchors,
        },
        external: LinksAnchors {
            links: external_links,
            anchors: external_anchors,
        },
    })
}

/// Resolves a URL relative to a base URL.
///
/// # Arguments
/// * `href` - The URL to resolve (can be relative or absolute).
/// * `base_url` - The base URL to resolve against.
///
/// # Returns
/// A resolved `Url`.
fn resolve_url(href: &str, base_url: &Url) -> Url {
    Url::parse(href)
        .or_else(|_| base_url.join(href))
        .unwrap_or_else(|_| base_url.clone())
}

/// Checks if a URL is internal (i.e., has the same domain as the base URL).
///
/// # Arguments
/// * `url` - The URL to check.
/// * `base_url` - The base URL to compare against.
///
/// # Returns
/// `true` if the URL is internal, `false` otherwise.
fn is_internal_link(url: &Url, base_url: &Url) -> bool {
    url.domain() == base_url.domain()
}
