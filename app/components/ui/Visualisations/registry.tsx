import {
  Activity,
  CheckCircle2,
  FolderTree,
  GitFork,
  Layers,
  Link2,
  ScrollText,
  ShieldCheck,
  Timer,
  Weight,
  Ban,
  BarChart3,
} from "lucide-react";
import type { VisualisationDefinition } from "./types";
import StatusCodeChart from "./charts/StatusCodeChart";
import IndexabilityChart from "./charts/IndexabilityChart";
import CrawlDepthChart from "./charts/CrawlDepthChart";
import TechAssetsChart from "./charts/TechAssetsChart";
import ComplianceChart from "./charts/ComplianceChart";
import WordCountHistogram from "./charts/WordCountHistogram";
import ResponseTimeHistogram from "./charts/ResponseTimeHistogram";
import PageWeightHistogram from "./charts/PageWeightHistogram";
import ReadabilityScatter from "./charts/ReadabilityScatter";
import LinkScoreChart from "./charts/LinkScoreChart";
import MetaRobotsChart from "./charts/MetaRobotsChart";
import SiteStructureTreemap from "./charts/SiteStructureTreemap";
import InternalLinkGraph from "./charts/InternalLinkGraph";

// The single place that defines what visualisations exist. Adding a new one
// is: build the chart component under charts/, then add one entry here —
// nothing else in the hub needs to change.
export const VISUALISATIONS: VisualisationDefinition[] = [
  {
    id: "internal-link-graph",
    title: "Internal Link Graph",
    shortDescription: "Force-directed diagram of how pages link to each other",
    category: "Site Structure",
    icon: GitFork,
    Component: InternalLinkGraph,
  },
  {
    id: "site-structure",
    title: "Site Structure Treemap",
    shortDescription: "Directory tree of the site, sized by page count",
    category: "Site Structure",
    icon: FolderTree,
    Component: SiteStructureTreemap,
  },
  {
    id: "crawl-depth",
    title: "Crawl Depth",
    shortDescription: "Pages found per click-depth from the start URL",
    category: "Site Structure",
    icon: Layers,
    Component: CrawlDepthChart,
  },
  {
    id: "status-codes",
    title: "Response Status Codes",
    shortDescription: "2xx / 3xx / 4xx / 5xx composition across the crawl",
    category: "Indexation & Compliance",
    icon: Activity,
    Component: StatusCodeChart,
  },
  {
    id: "indexability",
    title: "Indexability",
    shortDescription: "Indexable vs blocked pages, and why",
    category: "Indexation & Compliance",
    icon: Ban,
    Component: IndexabilityChart,
  },
  {
    id: "meta-robots",
    title: "Meta Robots Directives",
    shortDescription: "Index/noindex/nofollow directive breakdown",
    category: "Indexation & Compliance",
    icon: ScrollText,
    Component: MetaRobotsChart,
  },
  {
    id: "compliance",
    title: "Compliance Coverage",
    shortDescription: "HTTPS, structured data, and mobile-friendly coverage",
    category: "Indexation & Compliance",
    icon: ShieldCheck,
    Component: ComplianceChart,
  },
  {
    id: "word-count",
    title: "Word Count Distribution",
    shortDescription: "Content length spread — spot thin-content clusters",
    category: "Content Quality",
    icon: BarChart3,
    Component: WordCountHistogram,
  },
  {
    id: "readability",
    title: "Readability vs Length",
    shortDescription: "Flesch reading ease against word count, per page",
    category: "Content Quality",
    icon: CheckCircle2,
    Component: ReadabilityScatter,
  },
  {
    id: "tech-assets",
    title: "Crawled Asset Mix",
    shortDescription: "Pages vs CSS, JS, images, and redirects discovered",
    category: "Content Quality",
    icon: Layers,
    Component: TechAssetsChart,
  },
  {
    id: "response-time",
    title: "Response Time",
    shortDescription: "Server response speed distribution",
    category: "Performance",
    icon: Timer,
    Component: ResponseTimeHistogram,
  },
  {
    id: "page-weight",
    title: "Page Weight",
    shortDescription: "HTML transfer size distribution",
    category: "Performance",
    icon: Weight,
    Component: PageWeightHistogram,
  },
  {
    id: "link-score",
    title: "Link Score Distribution",
    shortDescription: "Internal link equity — strong, weak, and orphaned pages",
    category: "Link Equity",
    icon: Link2,
    Component: LinkScoreChart,
  },
];

export const CATEGORY_ORDER: VisualisationDefinition["category"][] = [
  "Site Structure",
  "Indexation & Compliance",
  "Content Quality",
  "Performance",
  "Link Equity",
];
