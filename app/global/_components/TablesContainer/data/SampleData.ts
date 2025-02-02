// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import type { Column, Data, CellData, TabData } from "../types/table";

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
