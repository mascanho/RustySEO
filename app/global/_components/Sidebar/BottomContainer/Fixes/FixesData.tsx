export const FixesData = [
  {
    id: 1,
    title: "Missing Page Title",
    description:
      "Page titles are critical for SEO as they help search engines understand the content of your page. A missing title can lead to poor rankings and reduced visibility in search results.",
    fixes:
      "Add a unique, descriptive <title> tag within the <head> of your HTML. It should accurately describe the page content and include your primary keyword.",
    links: [
      "https://developers.google.com/search/docs/appearance/title-link",
      "https://moz.com/learn/seo/title-tag",
    ],
  },
  {
    id: 2,
    title: "Duplicated Titles",
    description:
      "Duplicate titles make it difficult for search engines to distinguish between pages. This can lead to keyword cannibalization where your own pages compete against each other in search results.",
    fixes:
      "Ensure every page has a unique title. Review duplicated titles and differentiate them by adding specific details about the page content, location, or audience.",
    links: [
      "https://developers.google.com/search/docs/advanced/crawling/duplicate-titles",
    ],
  },
  {
    id: 3,
    title: "Page Title > 60 Chars",
    description:
      "Search engines usually truncate titles that exceed 60 characters (or ~600 pixels). Truncated titles can look unprofessional and hide important keywords from users.",
    fixes:
      "Rewrite titles to be concise and keep them under 60 characters. Place the most important keywords at the beginning of the title.",
    links: ["https://moz.com/learn/seo/title-tag"],
  },
  {
    id: 4,
    title: "Page Title < 30 Chars",
    description:
      "Short titles often fail to provide enough context for users or search engines, which can missed opportunities to include relevant secondary keywords.",
    fixes:
      "Expand short titles to be more descriptive. Include your brand name or secondary descriptive keywords to reach at least 30-40 characters.",
    links: ["https://ahrefs.com/blog/title-tag-seo/"],
  },
  {
    id: 5,
    title: "Missing Description",
    description:
      "Meta descriptions influence click-through rates (CTR) by providing a brief summary of the page in search results. Missing descriptions let search engines pick random text from the page.",
    fixes:
      "Create a unique meta description for every page that summarizes the content and includes a call to action. Ensure it is between 120-160 characters.",
    links: ["https://developers.google.com/search/docs/appearance/snippet"],
  },
  {
    id: 6,
    title: "Duplicated Descriptions",
    description:
      "Duplicate meta descriptions provide no unique value and can lead to lower CTR across all affected pages as they won't stand out to users.",
    fixes:
      "Audit your duplicated descriptions and rewrite them to reflect the unique value proposition of each specific page.",
    links: ["https://moz.com/learn/seo/meta-description"],
  },
  {
    id: 7,
    title: "Descriptions > 160 Chars",
    description:
      "Meta descriptions over 160 characters are usually truncated in SERPs. Important information or calls-to-action at the end may be lost.",
    fixes:
      "Shorten descriptions to stay within 155-160 characters. Moving the most important information to the front is recommended.",
    links: ["https://ahrefs.com/blog/meta-description-seo/"],
  },
  {
    id: 8,
    title: "4XX Client Error",
    description:
      "4XX errors indicate client-side issues where the requested page cannot be reached (e.g., 404 Not Found, 403 Forbidden). These result in a poor user experience and wasted crawl budget.",
    fixes:
      "For 404s, redirect to a relevant page or fix the broken link. For 403s, check permissions. For other 4xx errors, investigate the specific cause (e.g., bad request structure) and resolve it.",
    links: ["https://developers.google.com/search/docs/crawling-indexing/http-network-errors"],
  },
  {
    id: 9,
    title: "5XX Server Error",
    description:
      "5XX errors (e.g., 500, 502, 503) indicate server-side problems where the server failed to fulfill a valid request. Consistent 5XX errors can lead to de-indexing.",
    fixes:
      "Check server logs to identify the specific error. ensuring server resources are sufficient. For 503s, ensure maintenance mode headers are correct. Fix underlying script or database crashes.",
    links: ["https://www.searchenginejournal.com/website-errors-seo/5xx-errors/"],
  },
  {
    id: 10,
    title: "H1 Missing",
    description:
      "The H1 tag is the primary heading and should tell both users and search engines what the page is about. Missing it creates a poor content hierarchy.",
    fixes:
      "Identify the main topic of your page and add a single <h1> tag at the top of the content structure.",
    links: ["https://moz.com/learn/seo/headings"],
  },
  {
    id: 11,
    title: "H2 Missing",
    description:
      "H2 tags are used for sub-headings to structure the content. Without them, large blocks of text become hard to read for users and difficult to parse for search engines.",
    fixes:
      "Break up your content into sections and use <h2> tags for section headings. This improves readability and allows you to target secondary keywords.",
    links: ["https://ahrefs.com/blog/h1-tag-seo/"],
  },
  {
    id: 12,
    title: "Multiple H1 tags",
    description:
      "While HTML5 allows it, having multiple H1 tags can dilute the primary focus of the page. It's generally better for SEO to have one clear primary heading.",
    fixes:
      "Review pages with multiple H1 tags. Keep the most relevant one as H1 and change the others to H2 or H3 tags to maintain a proper hierarchy.",
    links: ["https://www.searchenginejournal.com/h1-tags-seo/"],
  },
  {
    id: 13,
    title: "Canonical Missing",
    description:
      "Canonical tags prevent duplicate content issues by telling search engines which version of a URL is the 'master' copy. Without them, search engines might index duplicate versions of your pages.",
    fixes:
      "Add a <link rel='canonical' href='...'> tag to the <head> of every page. On standard pages, this should usually be a self-referencing canonical to the page's own clean URL.",
    links: ["https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls"],
  },
  {
    id: 14,
    title: "Canonical Mismatch",
    description:
      "A canonical mismatch occurs when the canonical tag points to a different URL than the one being crawled, or when multiple canonicals are present. This can lead to indexing the wrong page.",
    fixes:
      "Ensure your canonical tags accurately point to the preferred version of the URL. Check for conflicting tags or errors in your CMS settings.",
    links: ["https://ahrefs.com/blog/canonical-tags/"],
  },
  {
    id: 15,
    title: "NoIndex Pages",
    description:
      "The 'noindex' directive tells search engines not to show the page in search results. If important pages are marked as noindex, they will not get any organic traffic.",
    fixes:
      "Check your meta robots tags or X-Robots headers. Remove the 'noindex' directive from pages that you want to be discovered and indexed by search engines.",
    links: ["https://developers.google.com/search/docs/crawling-indexing/block-indexing"],
  },
  {
    id: 16,
    title: "NoFollow Pages",
    description:
      "The 'nofollow' directive tells search engines not to follow the links on a page. This can prevent search engines from discovering other pages on your site.",
    fixes:
      "Review your meta robots tags. Change 'nofollow' to 'follow' unless you have a specific reason to prevent robots from following links on that page.",
    links: ["https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links"],
  },
  {
    id: 17,
    title: "Images Missing Alt Text",
    description:
      "Alt text (alternative text) is essential for web accessibility and helps search engines understand what is in an image. Missing alt text is a significant SEO and accessibility issue.",
    fixes:
      "Add descriptive alt attributes to all <img> tags. The text should describe what is shown in the image while naturally including relevant keywords if applicable.",
    links: ["https://moz.com/learn/seo/alt-text"],
  },
  {
    id: 18,
    title: "Broken Images",
    description:
      "Broken images occur when the image file cannot be loaded. This damages the user experience and can make your site look neglected or unprofessional.",
    fixes:
      "Check the image URLs for typos or missing files on your server. Replace broken image links with valid, optimized image files.",
    links: ["https://web.dev/optimize-images/"],
  },
  {
    id: 19,
    title: "Large Images (>100KB)",
    description:
      "Images larger than 100KB can significantly increase page load times. This negatively impacts Core Web Vitals and user retention.",
    fixes:
      "Compress your images using tools like TinyPNG or Squoosh. Use modern formats like WebP or AVIF and ensure images are sized correctly for their display area.",
    links: ["https://web.dev/browser-level-image-lazy-loading/"],
  },
  {
    id: 20,
    title: "Slow Response (>2s)",
    description:
      "A server response time over 2 seconds is considered very slow. Speed is a direct ranking factor for Google and a key part of user experience.",
    fixes:
      "Optimize your database queries, implement caching (server-side and CDN), and check your hosting resources. Heavy server-side processing should be minimized.",
    links: ["https://web.dev/vitals/"],
  },
  {
    id: 21,
    title: "Large HTML Page (>100KB)",
    description:
      "HTML documents larger than 100KB take longer to download and parse, especially on mobile devices. Heavy HTML often indicates excessive inline CSS/JS or bloated DOM structure.",
    fixes:
      "Externalize CSS and JavaScript files. Minify your HTML and review your page structure to remove unnecessary nesting or excessive hidden elements.",
    links: ["https://web.dev/reduce-network-payloads-and-compress-assets/"],
  },
  {
    id: 22,
    title: "Thin Content (<300 words)",
    description:
      "Thin content refers to pages with very little text. Search engines may perceive these pages as 'low value' and avoid ranking them highly.",
    fixes:
      "Increase the depth of your content by adding more helpful information, analysis, or multimedia. If a page doesn't need more content, consider combining it with another page.",
    links: ["https://developers.google.com/search/docs/essentials/creating-helpful-content"],
  },
  {
    id: 23,
    title: "Non-HTTPS Pages",
    description:
      "HTTPS is a basic security requirement. Google uses it as a ranking signal, and browsers will mark non-HTTPS pages as 'Not Secure', which destroys user trust.",
    fixes:
      "Install an SSL certificate (like Let's Encrypt) on your server and implement 301 redirects from HTTP to HTTPS version of your URLs.",
    links: ["https://developers.google.com/search/docs/appearance/https-seo"],
  },
  {
    id: 24,
    title: "Long Redirect Chains",
    description:
      "Redirect chains (e.g., A -> B -> C) increase latency and waste crawl budget. Each hop loses a small amount of 'link equity' and increases the risk of a failure.",
    fixes:
      "Update your internal links to point directly to the final destination URL. Avoid chaining redirects; link A should point directly to C.",
    links: ["https://ahrefs.com/blog/redirect-chains/"],
  },
  {
    id: 25,
    title: "Missing Schema",
    description:
      "Schema markup helps search engines provide rich results (like stars, prices, or FAQ snippets). Missing it means you lose out on visual real-estate in search results.",
    fixes:
      "Identify the type of content (Article, Product, Organization, etc.) and add the corresponding JSON-LD structured data to your pages.",
    links: ["https://schema.org/", "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data"],
  },
  {
    id: 26,
    title: "Deeply Nested URLs (4+ Depth)",
    description:
      "URLs nested deep in the site structure (e.g., more than 4 clicks away from the homepage) are harder for both users and search engine bots to reach. They often receive less 'link juice' and may be crawled less frequently.",
    fixes:
      "Improve your internal linking structure. Use categories, breadcrumbs, or a flatter site architecture to ensure important pages are accessible within 3 clicks from the homepage.",
    links: ["https://moz.com/blog/flat-vs-deep-site-hierarchies"],
  },
  {
    id: 27,
    title: "Missing OpenGraph Tags",
    description:
      "OpenGraph tags (like og:title and og:image) control how your content looks when shared on social media (Facebook, LinkedIn, Twitter). Missing tags can lead to unattractive previews and lower social engagement.",
    fixes:
      "Add essential OpenGraph meta tags inside the <head> of your pages. At minimum, include og:title, og:description, og:image, and og:url.",
    links: ["https://ogp.me/"],
  },
  {
    id: 28,
    title: "Blocked by Robots.txt",
    description:
      "These pages are disallowed in the robots.txt file. This prevents search engines from crawling them, meaning they won't be indexed or ranked.",
    fixes:
      "Review your robots.txt file. Remove the Disallow rule for these URLs if you want them to be indexed. If they are intentionally blocked, ensure they are not being linked to internally.",
    links: ["https://developers.google.com/search/docs/crawling-indexing/robots/intro"],
  },
];
