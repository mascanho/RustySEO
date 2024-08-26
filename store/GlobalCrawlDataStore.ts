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
  setCrawlData: (data: CrawlResult) => void;
  clearCrawlData: () => void;
}

const useGlobalCrawlStore = create<CrawlStore>((set) => ({
  crawlData: null,
  setCrawlData: (data) => set({ crawlData: data }),
  clearCrawlData: () => set({ crawlData: null }),
}));

export default useGlobalCrawlStore;
