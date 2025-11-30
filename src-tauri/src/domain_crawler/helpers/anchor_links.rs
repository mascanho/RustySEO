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
    pub inlinks: LinkTypes,
    pub anchors: Vec<String>,
    pub rels: Vec<Option<String>>,
    pub titles: Vec<Option<String>>,
    pub targets: Vec<Option<String>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LinkTypes {
    pub relative: Vec<String>,
    pub absolute: Vec<String>,
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

    // Selector for all <a> tags with href attributes
    let link_selector = Selector::parse("a").ok()?;

    // Extract all links and their attributes
    let (
        internal_links,
        internal_anchors,
        external_links,
        external_anchors,
        absolute_links,
        internal_rels,
        internal_titles,
        internal_targets,
        external_rels,
        external_titles,
        external_targets,
    ) = document.select(&link_selector).fold(
        (
            Vec::new(),
            Vec::new(),
            Vec::new(),
            Vec::new(),
            Vec::new(),
            Vec::new(),
            Vec::new(),
            Vec::new(),
            Vec::new(),
            Vec::new(),
            Vec::new(),
        ),
        |(
            mut internal_links,
            mut internal_anchors,
            mut external_links,
            mut external_anchors,
            mut absolute_links,
            mut internal_rels,
            mut internal_titles,
            mut internal_targets,
            mut external_rels,
            mut external_titles,
            mut external_targets,
        ),
         element| {
            if let Some(href) = element.value().attr("href") {
                // Resolve the URL (handle relative and absolute URLs)
                let url = resolve_url(href, base_url);

                // Get the anchor text
                let anchor_text = element.text().collect::<String>();

                // Get the optional attributes (these will be None if attribute doesn't exist)
                let rel = element.value().attr("rel").map(|s| s.to_string());
                let title = element.value().attr("title").map(|s| s.to_string());
                let target = element.value().attr("target").map(|s| s.to_string());

                // Classify as internal or external
                if is_internal_link(&url, base_url) {
                    internal_links.push(href.to_string());
                    internal_anchors.push(anchor_text);
                    internal_rels.push(rel);
                    internal_titles.push(title);
                    internal_targets.push(target);
                } else {
                    external_links.push(href.to_string());
                    external_anchors.push(anchor_text);
                    external_rels.push(rel);
                    external_titles.push(title);
                    external_targets.push(target);
                }

                // Add the absolute URL to the list
                absolute_links.push(url.to_string());
            }
            (
                internal_links,
                internal_anchors,
                external_links,
                external_anchors,
                absolute_links,
                internal_rels,
                internal_titles,
                internal_targets,
                external_rels,
                external_titles,
                external_targets,
            )
        },
    );

    Some(InternalExternalLinks {
        internal: LinksAnchors {
            links: internal_links.clone(),
            inlinks: LinkTypes {
                relative: internal_links,
                absolute: absolute_links.clone(),
            },
            anchors: internal_anchors,
            rels: internal_rels,
            titles: internal_titles,
            targets: internal_targets,
        },
        external: LinksAnchors {
            links: external_links.clone(),
            inlinks: LinkTypes {
                relative: external_links,
                absolute: absolute_links,
            },
            anchors: external_anchors,
            rels: external_rels,
            titles: external_titles,
            targets: external_targets,
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
    Url::parse(href).unwrap_or_else(|_| base_url.join(href).unwrap_or_else(|_| base_url.clone()))
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
    url.domain().map_or(false, |domain| {
        let base_domain = base_url.domain().unwrap_or("").trim_start_matches("www.");
        let check_domain = domain.trim_start_matches("www.");
        check_domain == base_domain || check_domain.ends_with(&format!(".{}", base_domain))
    })
}
