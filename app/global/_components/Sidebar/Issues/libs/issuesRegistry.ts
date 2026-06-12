// @ts-nocheck

export interface IssueDefinition {
  id: number;
  name: string;
  priority: "High" | "Medium" | "Low";
  recommendedFix: string;
  detect: (crawlData: any[], robotsBlocked?: string[]) => any[];
}

export const ISSUE_REGISTRY: IssueDefinition[] = [
  {
    id: 1,
    name: "Missing Page Title",
    priority: "High",
    recommendedFix:
      "Add a unique, descriptive <title> tag to each page that accurately summarizes the content.",
    detect: (data) => data.filter((p) => !p?.title?.[0]?.title),
  },
  {
    id: 2,
    name: "Missing Description",
    priority: "High",
    recommendedFix:
      "Add a meta description tag with a compelling 150-160 character summary of the page content.",
    detect: (data) => data.filter((p) => !p?.description),
  },
  {
    id: 3,
    name: "Duplicated Titles",
    priority: "High",
    recommendedFix:
      "Ensure every page has a unique title tag that reflects its specific topic and purpose.",
    detect: (data) => {
      const titles = data
        .map((p) => p?.title?.[0]?.title)
        .filter(Boolean);
      const dupes = titles.filter(
        (t, i) => t && titles.indexOf(t) !== i,
      );
      return data.filter((p) => dupes.includes(p?.title?.[0]?.title));
    },
  },
  {
    id: 4,
    name: "Page Title > 60 Chars",
    priority: "Medium",
    recommendedFix:
      "Shorten page titles to 50-60 characters so they display fully in search engine results.",
    detect: (data) =>
      data.filter((p) => (p?.title?.[0]?.title?.length || 0) > 60),
  },
  {
    id: 5,
    name: "Page Title < 30 Chars",
    priority: "Medium",
    recommendedFix:
      "Expand page titles to at least 30 characters to provide sufficient keyword context.",
    detect: (data) =>
      data.filter((p) => (p?.title?.[0]?.title?.length || 0) < 30),
  },
  {
    id: 6,
    name: "Duplicated Descriptions",
    priority: "Medium",
    recommendedFix:
      "Write unique meta descriptions for each page to improve click-through rates from SERPs.",
    detect: (data) => {
      const descs = data.map((p) => p?.description).filter(Boolean);
      const dupes = descs.filter(
        (d, i) => d && descs.indexOf(d) !== i,
      );
      return data.filter((p) => dupes.includes(p?.description));
    },
  },
  {
    id: 7,
    name: "Descriptions > 160 Chars",
    priority: "Medium",
    recommendedFix:
      "Trim meta descriptions to 160 characters or fewer to prevent truncation in results.",
    detect: (data) =>
      data.filter((p) => (p?.description?.length || 0) > 160),
  },
  {
    id: 8,
    name: "4XX Client Error",
    priority: "High",
    recommendedFix:
      "Fix broken internal links or set up 301 redirects from these URLs to relevant working pages.",
    detect: (data) =>
      data.filter(
        (p) => p?.status_code >= 400 && p?.status_code < 500,
      ),
  },
  {
    id: 9,
    name: "5XX Server Error",
    priority: "High",
    recommendedFix:
      "Investigate server logs, optimize resource limits, and check for application errors causing these failures.",
    detect: (data) =>
      data.filter(
        (p) => p?.status_code >= 500 && p?.status_code < 600,
      ),
  },
  {
    id: 10,
    name: "H1 Missing",
    priority: "High",
    recommendedFix:
      "Add a single H1 heading that clearly describes the page topic and includes target keywords.",
    detect: (data) =>
      data.filter(
        (p) => !p?.headings?.h1 || p?.headings?.h1?.length === 0,
      ),
  },
  {
    id: 11,
    name: "H2 Missing",
    priority: "Low",
    recommendedFix:
      "Add H2 subheadings to break up content into logical sections and improve readability.",
    detect: (data) =>
      data.filter(
        (p) => !p?.headings?.h2 || p?.headings?.h2?.length === 0,
      ),
  },
  {
    id: 12,
    name: "Multiple H1 tags",
    priority: "Medium",
    recommendedFix:
      "Use only one H1 per page and structure the remaining headings hierarchically as H2 through H6.",
    detect: (data) =>
      data.filter((p) => (p?.headings?.h1?.length || 0) > 1),
  },
  {
    id: 13,
    name: "Canonical Missing",
    priority: "Medium",
    recommendedFix:
      "Add a rel=\"canonical\" link tag pointing to the preferred version of this page.",
    detect: (data) =>
      data.filter(
        (p) => !p?.canonicals || p?.canonicals?.length === 0,
      ),
  },
  {
    id: 14,
    name: "Canonical Mismatch",
    priority: "Medium",
    recommendedFix:
      "Update the canonical URL to match the actual page URL, or redirect the non-canonical version.",
    detect: (data) =>
      data.filter((p) => {
        if (
          !p?.canonicals ||
          p?.canonicals?.length === 0 ||
          !p?.url
        )
          return false;
        const url = p.url.replace(/\/$/, "");
        const canonical = p.canonicals[0].replace(/\/$/, "");
        return url !== canonical;
      }),
  },
  {
    id: 15,
    name: "NoIndex Pages",
    priority: "Medium",
    recommendedFix:
      "Remove the noindex meta tag if this page should appear in search engine results.",
    detect: (data) =>
      data.filter((p) => p?.indexability?.noindex === true),
  },
  {
    id: 16,
    name: "NoFollow Pages",
    priority: "Medium",
    recommendedFix:
      "Remove the nofollow directive if this page should pass link equity to crawled links.",
    detect: (data) =>
      data.filter((p) => p?.indexability?.nofollow === true),
  },
  {
    id: 17,
    name: "Images Missing Alt Text",
    priority: "Low",
    recommendedFix:
      "Add descriptive alt text to every image for accessibility and image search optimization.",
    detect: (data) =>
      data.filter(
        (p) =>
          p?.images?.some((img) => !img?.alt) ||
          p?.images?.some((img) => img?.alt === ""),
      ),
  },
  {
    id: 18,
    name: "Broken Images",
    priority: "High",
    recommendedFix:
      "Replace broken image src attributes with valid URLs or remove the broken references.",
    detect: (data) =>
      data.filter((p) => p?.images?.some((img) => img?.broken)),
  },
  {
    id: 19,
    name: "Large Images (>100KB)",
    priority: "Medium",
    recommendedFix:
      "Compress and resize images to under 100KB using modern formats like WebP or AVIF.",
    detect: (data) =>
      data.filter((p) =>
        p?.images?.some(
          (img) => (img?.size || 0) > 100 * 1024,
        ),
      ),
  },
  {
    id: 20,
    name: "Slow Response (>2s)",
    priority: "High",
    recommendedFix:
      "Improve server response time by upgrading hosting, enabling caching, and optimizing database queries.",
    detect: (data) =>
      data.filter((p) => (p?.response_time || 0) > 2000),
  },
  {
    id: 21,
    name: "Large HTML Page (>100KB)",
    priority: "Low",
    recommendedFix:
      "Reduce HTML size by minifying markup, removing unused CSS/JS, and deferring non-critical resources.",
    detect: (data) =>
      data.filter((p) => (p?.page_size?.[0]?.kb || 0) > 100),
  },
  {
    id: 22,
    name: "Thin Content (<300 words)",
    priority: "Low",
    recommendedFix:
      "Expand page content to at least 300 words of unique, value-driven information.",
    detect: (data) =>
      data.filter((p) => (p?.word_count || 0) < 300),
  },
  {
    id: 23,
    name: "Non-HTTPS Pages",
    priority: "High",
    recommendedFix:
      "Install an SSL/TLS certificate and set up 301 redirects from HTTP to HTTPS for all pages.",
    detect: (data) =>
      data.filter((p) => !p?.url?.startsWith("https")),
  },
  {
    id: 24,
    name: "Long Redirect Chains",
    priority: "Medium",
    recommendedFix:
      "Reduce redirect chains to a single 301 hop to preserve link equity and improve load time.",
    detect: (data) =>
      data.filter((p) => (p?.redirect_count || 0) > 2),
  },
  {
    id: 25,
    name: "Missing Schema",
    priority: "Medium",
    recommendedFix:
      "Add relevant Schema.org structured data (Article, Product, FAQ, etc.) to enhance rich snippets.",
    detect: (data) => data.filter((p) => !p?.schema),
  },
  {
    id: 26,
    name: "Deeply Nested URLs (4+ Depth)",
    priority: "Low",
    recommendedFix:
      "Flatten site architecture so important pages are reachable within 3 clicks from the homepage.",
    detect: (data) =>
      data.filter((p) => (p?.url_depth || 0) >= 4),
  },
  {
    id: 27,
    name: "Missing OpenGraph Tags",
    priority: "Low",
    recommendedFix:
      "Add Open Graph meta tags (og:title, og:description, og:image) for better social sharing previews.",
    detect: (data) =>
      data.filter(
        (p) =>
          !p?.opengraph ||
          Object.keys(p?.opengraph || {}).length === 0,
      ),
  },
  {
    id: 28,
    name: "Blocked by Robots.txt",
    priority: "High",
    recommendedFix:
      "Review robots.txt disallow rules and allow crawling of pages that should be indexed.",
    detect: (_data, robotsBlocked) =>
      (robotsBlocked || []).map((url) => ({ url })),
  },
  {
    id: 29,
    name: "Redirect Detected",
    priority: "Medium",
    recommendedFix:
      "Replace the redirect with a direct link to the final destination URL, or consolidate to a single 301 redirect.",
    detect: (data) => data.filter((p) => p?.had_redirect),
  },
  {
    id: 30,
    name: "URL Has Uppercase Characters",
    priority: "Low",
    recommendedFix:
      "Rewrite URLs using only lowercase characters to avoid case-sensitivity duplicate content issues.",
    detect: (data) =>
      data.filter((p) => /[A-Z]/.test(p?.url)),
  },
  {
    id: 31,
    name: "URL Too Long (>100 chars)",
    priority: "Low",
    recommendedFix:
      "Shorten URLs to under 100 characters with concise, keyword-rich slugs that describe the content.",
    detect: (data) =>
      data.filter((p) => (p?.url?.length || 0) > 100),
  },
  {
    id: 32,
    name: "URL Contains Special Characters",
    priority: "Low",
    recommendedFix:
      "Replace underscores and spaces in URLs with hyphens, and remove any URL-encoded special characters.",
    detect: (data) =>
      data.filter((p) => /[_\s]/.test(p?.url)),
  },
  {
    id: 33,
    name: "Low Readability Score",
    priority: "Medium",
    recommendedFix:
      "Simplify sentence structure, use shorter words, and break up complex paragraphs to improve readability.",
    detect: (data) =>
      data.filter(
        (p) =>
          p?.flesch !== null &&
          p?.flesch !== undefined &&
          p?.flesch < 50,
      ),
  },
  {
    id: 34,
    name: "Low Text-to-HTML Ratio",
    priority: "Low",
    recommendedFix:
      "Reduce excessive HTML/CSS markup and increase meaningful content to improve the text-to-code ratio.",
    detect: (data) =>
      data.filter(
        (p) =>
          p?.text_ratio !== null &&
          p?.text_ratio !== undefined &&
          p?.text_ratio < 10,
      ),
  },
  {
    id: 35,
    name: "Missing Language Attribute",
    priority: "Low",
    recommendedFix:
      "Add a lang attribute to the <html> tag (e.g. <html lang=\"en\">) for accessibility and search engines.",
    detect: (data) =>
      data.filter((p) => !p?.language),
  },
  {
    id: 36,
    name: "Too Many Internal Links (>150)",
    priority: "Medium",
    recommendedFix:
      "Consolidate navigation and reduce internal links per page to under 150 to improve crawl efficiency.",
    detect: (data) =>
      data.filter((p) => (p?.internal_links_count || 0) > 150),
  },
  {
    id: 37,
    name: "Too Many External Links (>50)",
    priority: "Low",
    recommendedFix:
      "Reduce the number of external outbound links or add rel=\"nofollow\" to non-essential ones.",
    detect: (data) =>
      data.filter((p) => (p?.external_links_count || 0) > 50),
  },
  {
    id: 38,
    name: "Inline CSS Detected",
    priority: "Low",
    recommendedFix:
      "Move inline CSS styles to external stylesheet files to improve caching and reduce page weight.",
    detect: (data) =>
      data.filter((p) => (p?.css_inline_count || 0) > 0),
  },
  {
    id: 39,
    name: "Mixed Content Detected",
    priority: "High",
    recommendedFix:
      "Update all resource URLs (images, scripts, stylesheets) to use HTTPS instead of HTTP.",
    detect: (data) =>
      data.filter(
        (p) => (p?.security?.total_mixed_content || 0) > 0,
      ),
  },
  {
    id: 40,
    name: "Unsafe Cross-Origin Links",
    priority: "Medium",
    recommendedFix:
      "Add rel=\"noopener noreferrer\" to all links using target=\"_blank\" to prevent tab-napping attacks.",
    detect: (data) =>
      data.filter(
        (p) => (p?.security?.total_unsafe_anchors || 0) > 0,
      ),
  },
  {
    id: 41,
    name: "Not Mobile-Friendly",
    priority: "High",
    recommendedFix:
      "Implement responsive design using CSS media queries and test with Google's Mobile-Friendly Test tool.",
    detect: (data) =>
      data.filter((p) => p?.mobile === false),
  },
  {
    id: 42,
    name: "Cookies Detected",
    priority: "Low",
    recommendedFix:
      "Implement a cookie consent banner and ensure compliance with GDPR and ePrivacy regulations.",
    detect: (data) =>
      data.filter((p) => (p?.cookies_count || 0) > 0),
  },
];
