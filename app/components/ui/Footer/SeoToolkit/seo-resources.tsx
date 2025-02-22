// @ts-nocheck
const seoResources: Resource[] = [
  {
    title: "Moz",
    description:
      "Comprehensive SEO tools, guides, and a vibrant community for learning and optimization.",
    url: "https://moz.com/",
    tags: ["Tools", "Guides", "Blog", "Community"],
  },
  {
    title: "Google Search Central",
    description:
      "Official Google resource offering SEO guidelines, tools, and documentation.",
    url: "https://developers.google.com/search",
    tags: ["Official", "Guidelines", "Documentation", "Tools"],
  },
  {
    title: "Ahrefs",
    description:
      "Powerful SEO toolset for backlink analysis, keyword research, and competitor insights.",
    url: "https://ahrefs.com/",
    tags: ["Tools", "Analytics", "Keywords", "Competitors"],
  },
  {
    title: "Ahrefs Blog",
    description:
      "In-depth SEO tutorials, case studies, and data-driven insights.",
    url: "https://ahrefs.com/blog/",
    tags: ["Blog", "Tutorials", "Case Studies", "Data"],
  },
  {
    title: "Search Engine Journal",
    description: "Latest SEO news, trends, and actionable best practices.",
    url: "https://www.searchenginejournal.com/",
    tags: ["News", "Trends", "Best Practices"],
  },
  {
    title: "Backlinko",
    description:
      "Actionable SEO tips, strategies, and proven techniques by Brian Dean.",
    url: "https://backlinko.com/",
    tags: ["Strategies", "Tips", "Guides"],
  },
  {
    title: "Semrush",
    description:
      "All-in-one SEO toolkit for keyword research, competitor analysis, and more.",
    url: "https://www.semrush.com/",
    tags: ["Tools", "Analytics", "Keywords", "Competitors"],
  },
  {
    title: "Neil Patel",
    description:
      "Expert SEO and digital marketing insights, tools, and tutorials.",
    url: "https://neilpatel.com/",
    tags: ["Blog", "Marketing", "SEO", "Tools"],
  },
  {
    title: "HubSpot Blog",
    description: "Inbound marketing, SEO, and content strategy advice.",
    url: "https://blog.hubspot.com/",
    tags: ["Blog", "Marketing", "Inbound", "SEO"],
  },
  {
    title: "Yoast SEO",
    description:
      "Top WordPress SEO plugin with tutorials and optimization tips.",
    url: "https://yoast.com/",
    tags: ["Plugin", "WordPress", "SEO", "Tools"],
  },
  {
    title: "Screaming Frog",
    description:
      "Powerful SEO spider tool for site audits and technical analysis.",
    url: "https://www.screamingfrog.co.uk/",
    tags: ["Tools", "Technical SEO", "Audits"],
  },
  {
    title: "Search Engine Land",
    description: "Authoritative source for SEO news, updates, and strategies.",
    url: "https://searchengineland.com/",
    tags: ["News", "Strategies", "Updates"],
  },
  {
    title: "Rank Math",
    description: "User-friendly WordPress SEO plugin with advanced features.",
    url: "https://rankmath.com/",
    tags: ["Plugin", "WordPress", "SEO", "Tools"],
  },
  {
    title: "The SEO Framework",
    description: "Lightweight and automated SEO plugin for WordPress.",
    url: "https://theseoframework.com/",
    tags: ["Plugin", "WordPress", "SEO", "Automation"],
  },
  {
    title: "Mangools",
    description:
      "Affordable suite of SEO tools including keyword research and rank tracking.",
    url: "https://mangools.com/",
    tags: ["Tools", "Keywords", "Rank Tracking", "Affordable"],
  },
  {
    title: "Surfer SEO",
    description:
      "Content optimization tool leveraging data-driven SEO insights.",
    url: "https://surferseo.com/",
    tags: ["Tools", "Content", "Optimization", "Data"],
  },
  {
    title: "SEObility",
    description:
      "All-in-one SEO toolset for audits, monitoring, and keyword tracking.",
    url: "https://www.seobility.net/",
    tags: ["Tools", "Audits", "Monitoring", "Keywords"],
  },
  {
    title: "Google Keyword Planner",
    description: "Free tool from Google for keyword research and planning.",
    url: "https://ads.google.com/home/tools/keyword-planner/",
    tags: ["Tools", "Keywords", "Free", "Official"],
  },
  {
    title: "Ubersuggest",
    description:
      "Free and affordable SEO tool for keyword ideas, content suggestions, and audits.",
    url: "https://ubersuggest.io/",
    tags: ["Tools", "Keywords", "Content", "Affordable"],
  },
  {
    title: "SE Ranking",
    description:
      "Comprehensive SEO platform for rank tracking, audits, and competitor analysis.",
    url: "https://seranking.com/",
    tags: ["Tools", "Rank Tracking", "Audits", "Competitors"],
  },
  {
    title: "Majestic",
    description:
      "Specialized tool for backlink analysis and link-building insights.",
    url: "https://majestic.com/",
    tags: ["Tools", "Analytics", "Backlinks"],
  },
  {
    title: "BuzzSumo",
    description:
      "Content analysis tool for discovering trending topics and influencer insights.",
    url: "https://buzzsumo.com/",
    tags: ["Tools", "Content", "Trends", "Analytics"],
  },
  {
    title: "AnswerThePublic",
    description: "Keyword and question research tool for content ideation.",
    url: "https://answerthepublic.com/",
    tags: ["Tools", "Keywords", "Content", "Free"],
  },
  {
    title: "GTmetrix",
    description: "Performance analysis tool for site speed and optimization.",
    url: "https://gtmetrix.com/",
    tags: ["Tools", "Technical SEO", "Optimization", "Free"],
  },
  {
    title: "Google Analytics",
    description:
      "Essential tool for tracking website traffic and user behavior.",
    url: "https://analytics.google.com/",
    tags: ["Tools", "Analytics", "Free", "Official"],
  },
  {
    title: "Google Search Console",
    description:
      "Free tool to monitor and optimize your site’s presence in Google Search.",
    url: "https://search.google.com/search-console/",
    tags: ["Tools", "Monitoring", "Free", "Official"],
  },
  {
    title: "KeywordTool.io",
    description:
      "Keyword research tool for SEO and content planning across platforms.",
    url: "https://keywordtool.io/",
    tags: ["Tools", "Keywords", "Content", "Free"],
  },
  {
    title: "Raven Tools",
    description:
      "SEO and marketing platform for audits, reporting, and keyword tracking.",
    url: "https://raventools.com/",
    tags: ["Tools", "Audits", "Keywords", "Analytics"],
  },
  {
    title: "RustySEO",
    description:
      "Marketing toolkit for enhancing SEO and GEO strategies on your website.",
    url: "https://www.rustyseo.com/",
    tags: ["Free", "Tools", "SEO", "Marketing", "GEO"],
  },
  {
    title: "Brian Dean’s YouTube Channel",
    description: "Video tutorials on SEO strategies and growth hacks.",
    url: "https://www.youtube.com/c/BrianDean",
    tags: ["Videos", "Tutorials", "Strategies"],
  },
  {
    title: "Distilled (Now Brainlabs)",
    description: "Expert SEO guides and advanced digital marketing resources.",
    url: "https://www.brainlabsdigital.com/distilled/",
    tags: ["Guides", "Advanced", "Marketing"],
  },
  {
    title: "r/SEO (Reddit)",
    description: "Active SEO community for discussions, questions, and tips.",
    url: "https://www.reddit.com/r/SEO/",
    tags: ["Community", "Discussion", "Tips"],
  },
];

export default seoResources;
