// @ts-nocheck
export type Pricing = "Free" | "Freemium" | "Paid";

export type Resource = {
  title: string;
  description: string;
  url: string;
  category: string;
  pricing: Pricing;
  tags: string[];
};

// Categories are listed here in the order they should appear as filter chips.
export const categories = [
  "All-in-One Suites",
  "Keyword Research",
  "Technical SEO & Audits",
  "Site Speed & Core Web Vitals",
  "Backlinks & Authority",
  "Content & AI Writing",
  "Rank Tracking",
  "Analytics & Webmaster Tools",
  "Structured Data & Schema",
  "Local SEO",
  "WordPress & CMS Plugins",
  "Browser Extensions",
  "Learning, Blogs & News",
  "Community & Forums",
  "Video & YouTube",
];

const seoResources: Resource[] = [
  // All-in-One Suites
  {
    title: "Moz",
    description:
      "Comprehensive SEO tools, guides, and a vibrant community for learning and optimization.",
    url: "https://moz.com/",
    category: "All-in-One Suites",
    pricing: "Freemium",
    tags: ["Tools", "Guides", "Community"],
  },
  {
    title: "Ahrefs",
    description:
      "Powerful SEO toolset for backlink analysis, keyword research, and competitor insights.",
    url: "https://ahrefs.com/",
    category: "All-in-One Suites",
    pricing: "Paid",
    tags: ["Backlinks", "Keywords", "Competitors"],
  },
  {
    title: "Semrush",
    description:
      "All-in-one SEO toolkit for keyword research, competitor analysis, and more.",
    url: "https://www.semrush.com/",
    category: "All-in-One Suites",
    pricing: "Paid",
    tags: ["Keywords", "Competitors", "PPC"],
  },
  {
    title: "SE Ranking",
    description:
      "Comprehensive SEO platform for rank tracking, audits, and competitor analysis.",
    url: "https://seranking.com/",
    category: "All-in-One Suites",
    pricing: "Paid",
    tags: ["Rank Tracking", "Audits", "Competitors"],
  },
  {
    title: "SEObility",
    description:
      "All-in-one SEO toolset for audits, monitoring, and keyword tracking.",
    url: "https://www.seobility.net/",
    category: "All-in-One Suites",
    pricing: "Freemium",
    tags: ["Audits", "Monitoring", "Keywords"],
  },
  {
    title: "Mangools",
    description:
      "Affordable suite of SEO tools including keyword research and rank tracking.",
    url: "https://mangools.com/",
    category: "All-in-One Suites",
    pricing: "Freemium",
    tags: ["Keywords", "Rank Tracking", "Affordable"],
  },
  {
    title: "Raven Tools",
    description:
      "SEO and marketing platform for audits, reporting, and keyword tracking.",
    url: "https://raventools.com/",
    category: "All-in-One Suites",
    pricing: "Paid",
    tags: ["Audits", "Reporting", "Keywords"],
  },
  {
    title: "RustySEO",
    description:
      "Marketing toolkit for enhancing SEO and GEO strategies on your website.",
    url: "https://www.rustyseo.com/",
    category: "All-in-One Suites",
    pricing: "Free",
    tags: ["SEO", "GEO", "Marketing"],
  },

  // Keyword Research
  {
    title: "Google Keyword Planner",
    description: "Free tool from Google for keyword research and planning.",
    url: "https://ads.google.com/home/tools/keyword-planner/",
    category: "Keyword Research",
    pricing: "Free",
    tags: ["Official", "Planning"],
  },
  {
    title: "Ubersuggest",
    description:
      "Free and affordable SEO tool for keyword ideas, content suggestions, and audits.",
    url: "https://neilpatel.com/ubersuggest/",
    category: "Keyword Research",
    pricing: "Freemium",
    tags: ["Content", "Audits"],
  },
  {
    title: "AnswerThePublic",
    description: "Keyword and question research tool for content ideation.",
    url: "https://answerthepublic.com/",
    category: "Keyword Research",
    pricing: "Freemium",
    tags: ["Content", "Ideation"],
  },
  {
    title: "KeywordTool.io",
    description:
      "Keyword research tool for SEO and content planning across platforms.",
    url: "https://keywordtool.io/",
    category: "Keyword Research",
    pricing: "Freemium",
    tags: ["Content", "Multi-Platform"],
  },
  {
    title: "Keywords Everywhere",
    description:
      "Browser add-on showing search volume, CPC, and competition data as you browse.",
    url: "https://keywordseverywhere.com/",
    category: "Keyword Research",
    pricing: "Paid",
    tags: ["Extension", "Search Volume"],
  },
  {
    title: "AlsoAsked",
    description:
      "Visualizes the questions people ask, mapped from real 'People Also Ask' data.",
    url: "https://alsoasked.com/",
    category: "Keyword Research",
    pricing: "Freemium",
    tags: ["Questions", "Content Ideas"],
  },

  // Technical SEO & Audits
  {
    title: "Screaming Frog",
    description:
      "Powerful SEO spider tool for site audits and technical analysis.",
    url: "https://www.screamingfrog.co.uk/",
    category: "Technical SEO & Audits",
    pricing: "Freemium",
    tags: ["Crawler", "Audits"],
  },
  {
    title: "Sitebulb",
    description:
      "Visual site auditing tool that turns technical SEO crawls into clear reports.",
    url: "https://sitebulb.com/",
    category: "Technical SEO & Audits",
    pricing: "Paid",
    tags: ["Crawler", "Reporting"],
  },
  {
    title: "Lumar",
    description:
      "Enterprise-grade site intelligence platform for large-scale technical audits.",
    url: "https://www.lumar.io/",
    category: "Technical SEO & Audits",
    pricing: "Paid",
    tags: ["Enterprise", "Crawler"],
  },
  {
    title: "JetOctopus",
    description:
      "Cloud-based log analyzer and crawler for technical SEO at scale.",
    url: "https://jetoctopus.com/",
    category: "Technical SEO & Audits",
    pricing: "Freemium",
    tags: ["Log Analysis", "Crawler"],
  },

  // Site Speed & Core Web Vitals
  {
    title: "GTmetrix",
    description: "Performance analysis tool for site speed and optimization.",
    url: "https://gtmetrix.com/",
    category: "Site Speed & Core Web Vitals",
    pricing: "Freemium",
    tags: ["Performance", "Optimization"],
  },
  {
    title: "PageSpeed Insights",
    description:
      "Google's official tool for measuring Core Web Vitals and page performance.",
    url: "https://pagespeed.web.dev/",
    category: "Site Speed & Core Web Vitals",
    pricing: "Free",
    tags: ["Official", "Core Web Vitals"],
  },
  {
    title: "WebPageTest",
    description:
      "Deep, filmstrip-level performance testing from real browsers and locations.",
    url: "https://www.webpagetest.org/",
    category: "Site Speed & Core Web Vitals",
    pricing: "Free",
    tags: ["Performance", "Waterfall"],
  },
  {
    title: "web.dev",
    description:
      "Google's guidance hub for Core Web Vitals, performance, and modern web best practices.",
    url: "https://web.dev/",
    category: "Site Speed & Core Web Vitals",
    pricing: "Free",
    tags: ["Official", "Guides"],
  },

  // Backlinks & Authority
  {
    title: "Majestic",
    description:
      "Specialized tool for backlink analysis and link-building insights.",
    url: "https://majestic.com/",
    category: "Backlinks & Authority",
    pricing: "Paid",
    tags: ["Backlinks", "Link Building"],
  },

  // Content & AI Writing
  {
    title: "Surfer SEO",
    description:
      "Content optimization tool leveraging data-driven SEO insights.",
    url: "https://surferseo.com/",
    category: "Content & AI Writing",
    pricing: "Paid",
    tags: ["Content", "Optimization"],
  },
  {
    title: "Clearscope",
    description:
      "Content optimization platform that grades copy against top-ranking competitors.",
    url: "https://www.clearscope.io/",
    category: "Content & AI Writing",
    pricing: "Paid",
    tags: ["Content", "Grading"],
  },
  {
    title: "MarketMuse",
    description:
      "AI-driven content planning and optimization to close topical gaps.",
    url: "https://www.marketmuse.com/",
    category: "Content & AI Writing",
    pricing: "Paid",
    tags: ["Content", "AI", "Planning"],
  },
  {
    title: "Frase",
    description:
      "AI writing and content brief tool built around SERP research.",
    url: "https://www.frase.io/",
    category: "Content & AI Writing",
    pricing: "Freemium",
    tags: ["Content", "AI", "Briefs"],
  },
  {
    title: "Jasper",
    description: "AI content generation platform for marketing copy at scale.",
    url: "https://www.jasper.ai/",
    category: "Content & AI Writing",
    pricing: "Paid",
    tags: ["AI", "Copywriting"],
  },
  {
    title: "BuzzSumo",
    description:
      "Content analysis tool for discovering trending topics and influencer insights.",
    url: "https://buzzsumo.com/",
    category: "Content & AI Writing",
    pricing: "Freemium",
    tags: ["Trends", "Influencers"],
  },

  // Rank Tracking
  {
    title: "AccuRanker",
    description:
      "Fast, accurate rank tracking built for agencies and large keyword sets.",
    url: "https://www.accuranker.com/",
    category: "Rank Tracking",
    pricing: "Paid",
    tags: ["Rankings", "Agency"],
  },
  {
    title: "Nightwatch",
    description:
      "Rank tracking and SEO reporting tool with white-label client dashboards.",
    url: "https://nightwatch.io/",
    category: "Rank Tracking",
    pricing: "Paid",
    tags: ["Rankings", "Reporting"],
  },

  // Analytics & Webmaster Tools
  {
    title: "Google Analytics",
    description:
      "Essential tool for tracking website traffic and user behavior.",
    url: "https://analytics.google.com/",
    category: "Analytics & Webmaster Tools",
    pricing: "Free",
    tags: ["Official", "Traffic"],
  },
  {
    title: "Google Search Console",
    description:
      "Free tool to monitor and optimize your site's presence in Google Search.",
    url: "https://search.google.com/search-console/",
    category: "Analytics & Webmaster Tools",
    pricing: "Free",
    tags: ["Official", "Monitoring"],
  },
  {
    title: "Bing Webmaster Tools",
    description:
      "Monitor indexing, keyword performance, and site health for Bing Search.",
    url: "https://www.bing.com/webmasters/",
    category: "Analytics & Webmaster Tools",
    pricing: "Free",
    tags: ["Official", "Bing"],
  },
  {
    title: "Microsoft Clarity",
    description:
      "Free heatmaps and session recordings to understand user behavior.",
    url: "https://clarity.microsoft.com/",
    category: "Analytics & Webmaster Tools",
    pricing: "Free",
    tags: ["Heatmaps", "UX"],
  },
  {
    title: "Hotjar",
    description:
      "Behavior analytics with heatmaps, recordings, and on-site surveys.",
    url: "https://www.hotjar.com/",
    category: "Analytics & Webmaster Tools",
    pricing: "Freemium",
    tags: ["Heatmaps", "UX"],
  },
  {
    title: "Google Search Central",
    description:
      "Official Google resource offering SEO guidelines, tools, and documentation.",
    url: "https://developers.google.com/search",
    category: "Analytics & Webmaster Tools",
    pricing: "Free",
    tags: ["Official", "Documentation"],
  },

  // Structured Data & Schema
  {
    title: "Schema.org",
    description:
      "The shared vocabulary of structured data types used across search engines.",
    url: "https://schema.org/",
    category: "Structured Data & Schema",
    pricing: "Free",
    tags: ["Official", "Reference"],
  },
  {
    title: "Google Rich Results Test",
    description:
      "Checks whether a page's structured data is eligible for rich results.",
    url: "https://search.google.com/test/rich-results",
    category: "Structured Data & Schema",
    pricing: "Free",
    tags: ["Official", "Validator"],
  },
  {
    title: "Merkle Schema Markup Generator",
    description:
      "Point-and-click generator for producing valid JSON-LD schema markup.",
    url: "https://technicalseo.com/tools/schema-markup-generator/",
    category: "Structured Data & Schema",
    pricing: "Free",
    tags: ["Generator", "JSON-LD"],
  },

  // Local SEO
  {
    title: "Google Business Profile",
    description:
      "Manage how your business appears on Google Search and Maps.",
    url: "https://www.google.com/business/",
    category: "Local SEO",
    pricing: "Free",
    tags: ["Official", "Maps"],
  },
  {
    title: "BrightLocal",
    description:
      "Local SEO platform for rank tracking, citations, and review management.",
    url: "https://www.brightlocal.com/",
    category: "Local SEO",
    pricing: "Paid",
    tags: ["Citations", "Reviews"],
  },
  {
    title: "Whitespark",
    description:
      "Local citation building and local search ranking tools.",
    url: "https://whitespark.ca/",
    category: "Local SEO",
    pricing: "Freemium",
    tags: ["Citations", "Rankings"],
  },

  // WordPress & CMS Plugins
  {
    title: "Yoast SEO",
    description:
      "Top WordPress SEO plugin with tutorials and optimization tips.",
    url: "https://yoast.com/",
    category: "WordPress & CMS Plugins",
    pricing: "Freemium",
    tags: ["Plugin", "WordPress"],
  },
  {
    title: "Rank Math",
    description: "User-friendly WordPress SEO plugin with advanced features.",
    url: "https://rankmath.com/",
    category: "WordPress & CMS Plugins",
    pricing: "Freemium",
    tags: ["Plugin", "WordPress"],
  },
  {
    title: "The SEO Framework",
    description: "Lightweight and automated SEO plugin for WordPress.",
    url: "https://theseoframework.com/",
    category: "WordPress & CMS Plugins",
    pricing: "Freemium",
    tags: ["Plugin", "WordPress"],
  },
  {
    title: "All in One SEO",
    description:
      "Popular WordPress SEO plugin covering sitemaps, schema, and audits.",
    url: "https://aioseo.com/",
    category: "WordPress & CMS Plugins",
    pricing: "Freemium",
    tags: ["Plugin", "WordPress"],
  },

  // Browser Extensions
  {
    title: "SEOquake",
    description:
      "Free browser extension showing on-page and domain SEO metrics instantly.",
    url: "https://www.seoquake.com/",
    category: "Browser Extensions",
    pricing: "Free",
    tags: ["Extension", "Metrics"],
  },

  // Learning, Blogs & News
  {
    title: "Ahrefs Blog",
    description:
      "In-depth SEO tutorials, case studies, and data-driven insights.",
    url: "https://ahrefs.com/blog/",
    category: "Learning, Blogs & News",
    pricing: "Free",
    tags: ["Blog", "Tutorials"],
  },
  {
    title: "Backlinko",
    description:
      "Actionable SEO tips, strategies, and proven techniques by Brian Dean.",
    url: "https://backlinko.com/",
    category: "Learning, Blogs & News",
    pricing: "Free",
    tags: ["Strategies", "Guides"],
  },
  {
    title: "Search Engine Journal",
    description: "Latest SEO news, trends, and actionable best practices.",
    url: "https://www.searchenginejournal.com/",
    category: "Learning, Blogs & News",
    pricing: "Free",
    tags: ["News", "Trends"],
  },
  {
    title: "Search Engine Land",
    description: "Authoritative source for SEO news, updates, and strategies.",
    url: "https://searchengineland.com/",
    category: "Learning, Blogs & News",
    pricing: "Free",
    tags: ["News", "Updates"],
  },
  {
    title: "Neil Patel",
    description:
      "Expert SEO and digital marketing insights, tools, and tutorials.",
    url: "https://neilpatel.com/",
    category: "Learning, Blogs & News",
    pricing: "Free",
    tags: ["Blog", "Marketing"],
  },
  {
    title: "HubSpot Blog",
    description: "Inbound marketing, SEO, and content strategy advice.",
    url: "https://blog.hubspot.com/",
    category: "Learning, Blogs & News",
    pricing: "Free",
    tags: ["Blog", "Inbound"],
  },
  {
    title: "Brainlabs (formerly Distilled)",
    description: "Expert SEO guides and advanced digital marketing resources.",
    url: "https://www.brainlabsdigital.com/",
    category: "Learning, Blogs & News",
    pricing: "Free",
    tags: ["Guides", "Advanced"],
  },

  // Community & Forums
  {
    title: "r/SEO (Reddit)",
    description: "Active SEO community for discussions, questions, and tips.",
    url: "https://www.reddit.com/r/SEO/",
    category: "Community & Forums",
    pricing: "Free",
    tags: ["Community", "Discussion"],
  },
  {
    title: "r/bigseo (Reddit)",
    description:
      "More advanced SEO discussion for practitioners and in-house teams.",
    url: "https://www.reddit.com/r/bigseo/",
    category: "Community & Forums",
    pricing: "Free",
    tags: ["Community", "Advanced"],
  },
  {
    title: "WebmasterWorld",
    description:
      "One of the oldest running forums for webmasters and SEO professionals.",
    url: "https://www.webmasterworld.com/",
    category: "Community & Forums",
    pricing: "Free",
    tags: ["Forum", "Veteran"],
  },
  {
    title: "Traffic Think Tank",
    description:
      "Paid SEO community and Slack group built around courses and peer feedback.",
    url: "https://www.trafficthinktank.com/",
    category: "Community & Forums",
    pricing: "Paid",
    tags: ["Community", "Courses"],
  },

  // Video & YouTube
  {
    title: "Brian Dean's YouTube Channel",
    description: "Video tutorials on SEO strategies and growth hacks.",
    url: "https://www.youtube.com/c/BrianDean",
    category: "Video & YouTube",
    pricing: "Free",
    tags: ["Videos", "Tutorials"],
  },
  {
    title: "Ahrefs YouTube Channel",
    description:
      "Tutorials, case studies, and product walkthroughs from the Ahrefs team.",
    url: "https://www.youtube.com/@ahrefs",
    category: "Video & YouTube",
    pricing: "Free",
    tags: ["Videos", "Tutorials"],
  },
];

export default seoResources;
