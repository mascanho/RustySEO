import { create } from "zustand";

interface AltTags {
  with_alt_tags: string[];
  without_alt_tags: string[];
  alt_tags_total: string[];
}

interface AnchorLinks {
  internal_links: string[];
  external_links: string[];
}

interface Headings {
  h1: string[];
  h2: string[];
  h3: string[];
  h5: string[];
}

interface Indexability {
  indexability: number;
  indexability_reason: string;
}

interface Javascript {
  external: string[];
  inline: string[];
}

interface Title {
  title: string;
  title_len: number;
}

interface PageDetails {
  alt_tags: AltTags;
  anchor_links: AnchorLinks;
  description: string;
  headings: Headings;
  images: string[];
  indexability: Indexability;
  javascript: Javascript;
  schema: string;
  status_code: number;
  title: Title[];
  url: string;
}

export interface CrawlResult {
  visited_urls: Record<string, PageDetails>;
  all_files: Record<string, { url: string; file_type: string }>;
}

interface CrawlStore {
  crawlData: CrawlResult | null;
  setDomainCrawlData: (data: CrawlResult) => void;
  clearDomainCrawlData: () => void;
}

const useGlobalCrawlStore = create<CrawlStore>((set) => ({
  crawlData: null,
  setDomainCrawlData: (data) => set({ crawlData: data }),
  clearDomainCrawlData: () => set({ crawlData: null }),
}));

export default useGlobalCrawlStore;
