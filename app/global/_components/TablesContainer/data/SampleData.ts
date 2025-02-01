// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import type { Column, Data, CellData, TabData } from "../types/table";

export const columns: Column[] = [
  { Header: "ID", accessor: "id", width: 40 },
  { Header: "URL", accessor: "url", width: 200 },
  { Header: "Page Title", accessor: "pageTitle", width: 250 },
  { Header: "Title Length", accessor: "titleLength", width: 85 },
  { Header: "Meta Description", accessor: "metaDescription", width: 300 },
  { Header: "Meta Length", accessor: "metaDescriptionLength", width: 100 },
  { Header: "H1", accessor: "h1", width: 200 },
  { Header: "Word Count", accessor: "wordCount", width: 85 },
  { Header: "Status Code", accessor: "statusCode", width: 85 },
  { Header: "Response Time", accessor: "responseTime", width: 105 },
  // { Header: "Javascript", accessor: "javascript", width: 70 },
  { Header: "Indexable", accessor: "indexable", width: 73 },
  { Header: "Mobile", accessor: "mobileFriendly", width: 60 },
  // { Header: "Canonical URL", accessor: "canonicalUrl", width: 200 },
  // { Header: "Internal Links", accessor: "internalLinks", width: 100 },
  // { Header: "External Links", accessor: "externalLinks", width: 120 },
  // { Header: "Images", accessor: "images", width: 100 },
  // { Header: "No Alt Tags", accessor: "altTagsMissing", width: 90 },
  // { Header: "Load Time (s)", accessor: "loadTime", width: 120 },
];

export const data: Data[] = [
  {
    id: 1,
    url: "https://www.algarvewonders.com",
    pageTitle: "Discover the Algarve - Your Ultimate Travel Guide",
    titleLength: 42,
    metaDescription:
      "Explore the best of the Algarve region with our comprehensive travel guide. Find top attractions, hidden gems, and travel tips.",
    metaDescriptionLength: 148,
    h1: "Welcome to the Algarve",
    h2Count: 5,
    wordCount: 1200,
    statusCode: 200,
    responseTime: 320,
    canonicalUrl: "https://www.algarvewonders.com",
    indexable: true,
    internalLinks: 25,
    externalLinks: 10,
    images: 15,
    altTagsMissing: 2,
    loadTime: 2.8,
    ssl: true,
    mobileFriendly: true,
  },
];

export const cellDetails: { [key: string]: CellData } = {
  "0-url": {
    details: {
      url: "https://www.algarvewonders.com",
      protocol: "https",
      domain: "algarvewonders.com",
      subdomain: "www",
      path: "/",
      queryParams: null,
      fragment: null,
    },
    history: [
      { date: "2023-01-01", event: "Domain Registered", user: "Admin" },
      {
        date: "2023-01-15",
        event: "SSL Certificate Installed",
        user: "IT Team",
      },
      { date: "2023-02-01", event: "Website Launched", user: "Admin" },
      {
        date: "2023-03-15",
        event: "URL Structure Updated",
        user: "SEO Specialist",
      },
      { date: "2023-04-10", event: "Canonical Tag Added", user: "Developer" },
    ],
    related: [
      { id: 101, name: "Homepage Analytics", relation: "Primary URL" },
      { id: 201, name: "SEO Audit", relation: "Target URL" },
      { id: 301, name: "Performance Report", relation: "Main URL" },
      { id: 401, name: "Sitemap", relation: "Included URL" },
      { id: 501, name: "Robots.txt", relation: "Allowed URL" },
    ],
  },
  "0-ssl": {
    details: {
      enabled: true,
      provider: "Let's Encrypt",
      validFrom: "2023-01-15",
      validTo: "2023-04-15",
      issuer: "Let's Encrypt Authority X3",
      bitStrength: 2048,
      signatureAlgorithm: "SHA256withRSA",
    },
    history: [
      {
        date: "2023-01-15",
        event: "SSL Certificate Installed",
        user: "IT Team",
      },
      { date: "2023-01-15", event: "HTTPS Enforced", user: "Developer" },
      {
        date: "2023-02-01",
        event: "Mixed Content Issues Resolved",
        user: "Developer",
      },
      {
        date: "2023-03-01",
        event: "SSL Configuration Optimized",
        user: "Security Specialist",
      },
    ],
    related: [
      { id: 601, name: "Security Audit", relation: "SSL Check" },
      { id: 701, name: "Performance Optimization", relation: "HTTPS Impact" },
      { id: 801, name: "SEO Report", relation: "HTTPS as Ranking Factor" },
    ],
  },
  "0-mobileFriendly": {
    details: {
      isMobileFriendly: true,
      viewport: "width=device-width, initial-scale=1",
      textReadability: "Passed",
      tapTargetSpacing: "Passed",
      contentSizing: "Passed",
    },
    history: [
      {
        date: "2023-02-01",
        event: "Mobile-First Design Implemented",
        user: "UX Designer",
      },
      {
        date: "2023-02-15",
        event: "Responsive Images Added",
        user: "Developer",
      },
      {
        date: "2023-03-01",
        event: "Mobile Page Speed Optimized",
        user: "Performance Specialist",
      },
      {
        date: "2023-03-15",
        event: "Mobile Usability Test Conducted",
        user: "QA Team",
      },
    ],
    related: [
      {
        id: 901,
        name: "Mobile SEO Report",
        relation: "Mobile-Friendliness Factor",
      },
      {
        id: 1001,
        name: "User Experience Analysis",
        relation: "Mobile Usability",
      },
      {
        id: 1101,
        name: "Google Search Console",
        relation: "Mobile Usability Report",
      },
    ],
  },
};

export const tabData: { [key: string]: TabData } = {
  crawledPages: { columns, data },
  seoAnalysis: {
    columns: [
      { Header: "ID", accessor: "id", width: 60 },
      { Header: "Page Title", accessor: "pageTitle", width: 250 },
      { Header: "Meta Description", accessor: "metaDescription", width: 300 },
      { Header: "H1", accessor: "h1", width: 200 },
      { Header: "Word Count", accessor: "wordCount", width: 120 },
      { Header: "Internal Links", accessor: "internalLinks", width: 120 },
      { Header: "External Links", accessor: "externalLinks", width: 120 },
      { Header: "Images", accessor: "images", width: 100 },
      { Header: "Alt Tags Missing", accessor: "altTagsMissing", width: 140 },
      { Header: "SSL", accessor: "ssl", width: 80 },
      { Header: "Mobile Friendly", accessor: "mobileFriendly", width: 130 },
    ],
    data: data.map(
      ({
        id,
        pageTitle,
        metaDescription,
        h1,
        wordCount,
        internalLinks,
        externalLinks,
        images,
        altTagsMissing,
        ssl,
        mobileFriendly,
      }) => ({
        id,
        pageTitle,
        metaDescription,
        h1,
        wordCount,
        internalLinks,
        externalLinks,
        images,
        altTagsMissing,
        ssl,
        mobileFriendly,
      }),
    ),
  },
  technicalDetails: {
    columns: [
      { Header: "ID", accessor: "id", width: 60 },
      { Header: "URL", accessor: "url", width: 200 },
      { Header: "Status Code", accessor: "statusCode", width: 120 },
      { Header: "Response Time (ms)", accessor: "responseTime", width: 150 },
      { Header: "Canonical URL", accessor: "canonicalUrl", width: 200 },
      { Header: "Indexable", accessor: "indexable", width: 100 },
      { Header: "SSL", accessor: "ssl", width: 80 },
      { Header: "Mobile Friendly", accessor: "mobileFriendly", width: 130 },
      { Header: "Load Time (s)", accessor: "loadTime", width: 120 },
    ],
    data: data.map(
      ({
        id,
        url,
        statusCode,
        responseTime,
        canonicalUrl,
        indexable,
        ssl,
        mobileFriendly,
        loadTime,
      }) => ({
        id,
        url,
        statusCode,
        responseTime,
        canonicalUrl,
        indexable,
        ssl,
        mobileFriendly,
        loadTime,
      }),
    ),
  },
};
