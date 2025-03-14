export const FixesData = [
  {
    id: 1,
    title: "Missing Page Title",
    description:
      "Page titles are critical for SEO as they help search engines understand the content of your page. A missing title can lead to poor rankings and reduced visibility in search results. Without a title, your page may appear generic or irrelevant to users.",
    fixes:
      "Add a unique and descriptive title tag to every page. Ensure the title includes primary keywords, is under 60 characters, and accurately reflects the page's content. Use tools like Google Search Console to identify pages without titles.",
    links: [
      "https://developers.google.com/search/docs/appearance/title-link",
      "https://moz.com/learn/seo/title-tag",
    ],
  },
  {
    id: 2,
    title: "Duplicated Titles",
    description:
      "Duplicate page titles can confuse search engines, making it harder for them to determine which page is most relevant for a query. This can lead to lower rankings and missed opportunities for traffic.",
    fixes:
      "Audit your site for duplicate titles using tools like Screaming Frog or Google Search Console. Update each title to be unique, descriptive, and keyword-rich. Use canonical tags to indicate the preferred version of a page if necessary.",
    links: [
      "https://developers.google.com/search/docs/advanced/crawling/duplicate-titles",
      "https://moz.com/blog/duplicate-content-issues",
    ],
  },
  {
    id: 3,
    title: "Page Title > 60 Chars",
    description:
      "Titles longer than 60 characters may be truncated in search engine results, making them less effective. Users may not see the full context, which can reduce click-through rates.",
    fixes:
      "Shorten your page titles to under 60 characters while keeping them descriptive and keyword-rich. Focus on the most important information and place primary keywords at the beginning.",
    links: [
      "https://developers.google.com/search/docs/appearance/title-link",
      "https://moz.com/learn/seo/title-tag",
    ],
  },
  {
    id: 4,
    title: "Page Title < 30 Chars",
    description:
      "Titles shorter than 30 characters may not provide enough context for users or search engines. This can make your page appear less relevant and reduce its chances of ranking well.",
    fixes:
      "Expand your page titles to at least 30 characters. Ensure they are descriptive, include primary keywords, and accurately summarize the page's content.",
    links: [
      "https://developers.google.com/search/docs/appearance/title-link",
      "https://moz.com/learn/seo/title-tag",
    ],
  },
  {
    id: 5,
    title: "Missing Description",
    description:
      "Meta descriptions provide a summary of your page's content in search results. Missing descriptions can lead to lower click-through rates, as search engines may generate irrelevant snippets.",
    fixes:
      "Write unique and compelling meta descriptions for every page. Keep them under 160 characters, include primary keywords naturally, and use action-oriented language to encourage clicks.",
    links: [
      "https://developers.google.com/search/docs/appearance/snippet",
      "https://moz.com/learn/seo/meta-description",
    ],
  },
  {
    id: 6,
    title: "Duplicated Descriptions",
    description:
      "Duplicate meta descriptions can confuse search engines and reduce the effectiveness of your snippets. This can lead to lower click-through rates and missed opportunities for traffic.",
    fixes:
      "Audit your site for duplicate meta descriptions using tools like Screaming Frog or Google Search Console. Update each description to be unique, descriptive, and engaging.",
    links: [
      "https://developers.google.com/search/docs/advanced/crawling/duplicate-descriptions",
      "https://moz.com/blog/duplicate-content-issues",
    ],
  },
  {
    id: 7,
    title: "Descriptions > 160 Chars",
    description:
      "Meta descriptions longer than 160 characters may be truncated in search results, making them less effective. Users may not see the full context, which can reduce click-through rates.",
    fixes:
      "Shorten your meta descriptions to under 160 characters. Focus on the most important information, include primary keywords, and use action-oriented language.",
    links: [
      "https://developers.google.com/search/docs/appearance/snippet",
      "https://moz.com/learn/seo/meta-description",
    ],
  },
  {
    id: 8,
    title: "404 Response",
    description:
      "404 errors occur when a page cannot be found. These errors can harm user experience and SEO, as search engines cannot index the page. Broken links can also dilute your site's authority.",
    fixes:
      "Identify broken links using tools like Screaming Frog or Google Search Console. Update or remove broken links, and implement 301 redirects for permanently moved pages.",
    links: [
      "https://developers.google.com/search/docs/crawling-indexing/fix-broken-links",
      "https://ahrefs.com/blog/find-and-fix-broken-links/",
    ],
  },
  {
    id: 9,
    title: "5XX Response",
    description:
      "5XX errors indicate server-side issues, which can prevent users and search engines from accessing your site. These errors can harm your site's credibility and rankings.",
    fixes:
      "Check your server logs to identify the cause of 5XX errors. Contact your hosting provider or developer to resolve server issues. Monitor your site regularly to prevent future errors.",
    links: [
      "https://developers.google.com/search/docs/advanced/crawling/5xx-errors",
      "https://moz.com/blog/5xx-errors",
    ],
  },
  {
    id: 10,
    title: "H1 Missing",
    description:
      "H1 tags are the main heading of a page and are critical for SEO. Missing H1 tags can make it harder for search engines to understand the structure and content of your page.",
    fixes:
      "Add a single, descriptive H1 tag to every page. Ensure it includes primary keywords and accurately reflects the page's content. Avoid using multiple H1 tags on a single page.",
    links: [
      "https://developers.google.com/search/docs/advanced/guidelines/webmaster-guidelines",
      "https://moz.com/learn/seo/headings",
    ],
  },
  {
    id: 11,
    title: "H2 Missing",
    description:
      "H2 tags are subheadings that help structure your content. Missing H2 tags can reduce readability and make it harder for search engines to understand your content.",
    fixes:
      "Use H2 tags to organize your content hierarchically. Include relevant keywords and ensure each H2 tag provides context for the section it introduces.",
    links: [
      "https://developers.google.com/search/docs/advanced/guidelines/webmaster-guidelines",
      "https://moz.com/learn/seo/headings",
    ],
  },
  {
    id: 12,
    title: "Low Content",
    description:
      "Pages with low content may not provide enough value to users or search engines. This can lead to lower rankings and reduced traffic.",
    fixes:
      "Expand your content to cover topics comprehensively. Add original research, multimedia, or examples to increase the depth and value of your pages. Avoid keyword stuffing.",
    links: [
      "https://developers.google.com/search/docs/essentials/creating-helpful-content",
      "https://moz.com/blog/thin-content-how-to-find-it-and-fix-it",
    ],
  },
  {
    id: 13,
    title: "Missing Schema",
    description:
      "Schema markup helps search engines understand your content and can lead to rich results like featured snippets, carousels, or knowledge panels. Missing schema can reduce your visibility in search results.",
    fixes:
      "Add structured data to your pages using JSON-LD format. Test your markup with Google’s Rich Results Test and include relevant schema types (e.g., Article, Product, FAQ).",
    links: [
      "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data",
      "https://schema.org/",
    ],
  },
  {
    id: 14,
    title: "Large Images",
    description:
      "Large images can slow down your website, leading to poor user experience and lower rankings. Slow-loading pages can increase bounce rates and reduce conversions.",
    fixes:
      "Compress images to reduce file size without sacrificing quality. Use next-gen formats like WebP, specify image dimensions, and lazy load images below the fold.",
    links: [
      "https://developers.google.com/search/docs/appearance/google-images",
      "https://web.dev/use-srcset-to-automatically-choose-the-right-image/",
    ],
  },
];
