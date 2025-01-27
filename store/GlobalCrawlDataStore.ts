// store/crawlStore.ts
import { create } from "zustand";

interface PageDetails {
  title: string;
  h1: string;
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
