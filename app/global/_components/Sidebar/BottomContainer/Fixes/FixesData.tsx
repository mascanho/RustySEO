export const FixesData = [
  {
    id: 1,
    title: "Missing Meta Descriptions",
    description:
      "Meta descriptions are HTML attributes that provide concise summaries of web pages. They appear in search engine results below the title tag and influence click-through rates. Missing or poorly written meta descriptions can lead to lower organic traffic, as search engines may generate irrelevant snippets, reducing the likelihood of users clicking on your page.",
    fixes:
      "Write unique, descriptive meta descriptions under 160 characters, include primary keywords naturally, and use action-oriented language to encourage clicks.",
    links: [
      "https://developers.google.com/search/docs/appearance/snippet",
      "https://moz.com/learn/seo/meta-description",
    ],
  },
  {
    id: 2,
    title: "Broken Internal Links",
    description:
      "Broken internal links are links on your website that lead to non-existent pages (404 errors). These can harm user experience, reduce crawl efficiency, and dilute link equity. Broken links often occur due to page deletions, URL changes, or typos in the linking structure.",
    fixes:
      "Use tools like Screaming Frog or Ahrefs to identify broken links, update or remove them, and implement 301 redirects for permanently moved pages.",
    links: [
      "https://developers.google.com/search/docs/crawling-indexing/fix-broken-links",
      "https://ahrefs.com/blog/find-and-fix-broken-links/",
    ],
  },
  {
    id: 3,
    title: "Duplicate Content",
    description:
      "Duplicate content refers to identical or substantially similar content appearing on multiple pages, either within your site or across different domains. This can confuse search engines, leading to split ranking signals and lower visibility in search results. Common causes include URL variations, printer-friendly pages, or copied content.",
    fixes:
      "Use canonical tags to indicate the preferred version of a page, merge similar pages, and add noindex tags to low-value duplicate pages.",
    links: [
      "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls",
      "https://moz.com/learn/seo/duplicate-content",
    ],
  },
  {
    id: 4,
    title: "Slow Page Speed",
    description:
      "Page speed refers to how quickly your website loads for users. Slow-loading pages can lead to higher bounce rates, lower user engagement, and reduced rankings, especially on mobile devices. Factors like large image files, unoptimized code, and server issues can contribute to slow page speed.",
    fixes:
      "Compress images, enable browser caching, minify CSS/JS/HTML files, and use a Content Delivery Network (CDN) to improve load times.",
    links: [
      "https://developers.google.com/speed/docs/insights/OptimizeCSSDelivery",
      "https://pagespeed.web.dev/",
    ],
  },
  {
    id: 5,
    title: "Unoptimized Images",
    description:
      "Unoptimized images can significantly slow down your website and negatively impact user experience. Large image files increase page load times, while missing alt text can hinder accessibility and SEO. Properly optimized images improve performance and help search engines understand your content.",
    fixes:
      "Use next-gen formats like WebP, add descriptive alt text, specify image dimensions, and lazy load images below the fold.",
    links: [
      "https://developers.google.com/search/docs/appearance/google-images",
      "https://web.dev/use-srcset-to-automatically-choose-the-right-image/",
    ],
  },
  {
    id: 6,
    title: "Missing or Improper Structured Data",
    description:
      "Structured data is a standardized format used to provide information about a page and classify its content. Without proper structured data, search engines may struggle to understand your content, reducing the chances of rich results like featured snippets, carousels, or knowledge panels.",
    fixes:
      "Use JSON-LD format for structured data, test markup with Google’s Rich Results Test, and add relevant schema types (e.g., Article, Product, FAQ).",
    links: [
      "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data",
      "https://schema.org/",
    ],
  },
  {
    id: 7,
    title: "Thin Content",
    description:
      "Thin content refers to pages with little or no substantive value, such as pages with minimal text, auto-generated content, or copied material. These pages can harm your site’s credibility and rankings, as search engines prioritize high-quality, original content.",
    fixes:
      "Expand content to cover topics comprehensively, add original research or multimedia, and avoid keyword stuffing.",
    links: [
      "https://developers.google.com/search/docs/essentials/creating-helpful-content",
      "https://moz.com/blog/thin-content-how-to-find-it-and-fix-it",
    ],
  },
  {
    id: 8,
    title: "Poor Mobile Usability",
    description:
      "Mobile usability refers to how well your website functions on mobile devices. With the majority of web traffic coming from mobile devices, poor mobile usability can lead to higher bounce rates, lower engagement, and reduced rankings. Common issues include small tap targets, unreadable text, and intrusive interstitials.",
    fixes:
      "Use responsive design, avoid intrusive interstitials, ensure buttons are tappable, and test your site with Google’s Mobile-Friendly Test.",
    links: [
      "https://developers.google.com/search/docs/essentials/mobile-friendly",
      "https://search.google.com/test/mobile-friendly",
    ],
  },
  {
    id: 9,
    title: "Unoptimized URLs",
    description:
      "URLs are the addresses of your web pages and play a crucial role in SEO. Unoptimized URLs can be difficult for users and search engines to understand, reducing crawl efficiency and click-through rates. Common issues include long, dynamic, or keyword-stuffed URLs.",
    fixes:
      "Include primary keywords in URLs, use hyphens to separate words, avoid dynamic parameters, and keep URLs short and descriptive.",
    links: [
      "https://developers.google.com/search/docs/advanced/guidelines/url-structure",
      "https://moz.com/learn/seo/url",
    ],
  },
  {
    id: 10,
    title: "Missing or Improper Heading Tags",
    description:
      "Heading tags (H1, H2, H3, etc.) are used to structure content and make it easier for users and search engines to understand. Missing or improperly used heading tags can lead to poor readability, reduced accessibility, and lower rankings.",
    fixes:
      "Use one H1 tag per page, organize headings hierarchically, include keywords naturally, and ensure headings reflect the content below them.",
    links: [
      "https://developers.google.com/search/docs/advanced/guidelines/webmaster-guidelines",
      "https://moz.com/learn/seo/headings",
    ],
  },
  {
    id: 11,
    title: "Lack of Backlinks",
    description:
      "Backlinks are links from other websites to your site and are a key factor in SEO. A lack of high-quality backlinks can limit your site’s authority and visibility in search results. Building backlinks requires creating valuable content and earning links from reputable sources.",
    fixes:
      "Create shareable content, reach out to influencers, submit your site to directories, and use broken link building to attract backlinks.",
    links: [
      "https://developers.google.com/search/docs/advanced/guidelines/links",
      "https://ahrefs.com/blog/link-building-strategies/",
    ],
  },
  {
    id: 12,
    title: "Unoptimized Title Tags",
    description:
      "Title tags are HTML elements that define the title of a web page and appear in search engine results. Unoptimized title tags can reduce click-through rates and rankings, as they fail to accurately describe the page’s content or include relevant keywords.",
    fixes:
      "Keep title tags under 60 characters, place primary keywords at the beginning, include brand names when relevant, and avoid duplicate titles.",
    links: [
      "https://developers.google.com/search/docs/appearance/title-link",
      "https://moz.com/learn/seo/title-tag",
    ],
  },
  {
    id: 13,
    title: "No SSL Certificate",
    description:
      "An SSL certificate encrypts data transmitted between a user’s browser and your website, ensuring secure communication. Without an SSL certificate, your site will be marked as 'Not Secure' in browsers, which can deter users and harm rankings.",
    fixes:
      "Install an SSL certificate, update internal links to use HTTPS, set up 301 redirects from HTTP to HTTPS, and ensure all resources are served over HTTPS.",
    links: [
      "https://developers.google.com/search/docs/advanced/security/https",
      "https://web.dev/why-https-matters/",
    ],
  },
  {
    id: 14,
    title: "Lack of Social Media Integration",
    description:
      "Social media integration allows users to share your content and engage with your brand on social platforms. A lack of integration can limit your content’s reach and reduce opportunities for traffic and backlinks.",
    fixes:
      "Add social sharing buttons, embed social media feeds, promote content on social platforms, and use Open Graph tags for better sharing.",
    links: [
      "https://developers.google.com/search/docs/appearance/social-tags",
      "https://moz.com/blog/social-media-seo",
    ],
  },
  {
    id: 15,
    title: "Unoptimized Robots.txt",
    description:
      "The robots.txt file tells search engine crawlers which pages or files to access or ignore on your site. An unoptimized robots.txt file can block important pages from being indexed or allow low-value pages to be crawled, harming your SEO efforts.",
    fixes:
      "Ensure important pages are accessible, disallow crawling of low-value pages, and test your robots.txt file with Google Search Console.",
    links: [
      "https://developers.google.com/search/docs/advanced/robots/intro",
      "https://moz.com/learn/seo/robots-txt",
    ],
  },
  {
    id: 16,
    title: "Missing or Improper XML Sitemap",
    description:
      "An XML sitemap is a file that lists the URLs of your site, helping search engines discover and index your pages. A missing or improperly configured sitemap can lead to slower indexing and missed opportunities for ranking.",
    fixes:
      "Create an XML sitemap, submit it to Google Search Console, and ensure it includes all important pages while excluding low-value or duplicate URLs.",
    links: [
      "https://developers.google.com/search/docs/advanced/sitemaps/overview",
      "https://moz.com/learn/seo/xml-sitemaps",
    ],
  },
];
