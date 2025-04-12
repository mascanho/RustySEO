import { create } from "zustand";

type CrawlStatus = "idle" | "crawling" | "paused" | "completed" | "error";

interface CrawlData {
  url: string;
  depth?: number;
  timestamp?: number;
  status: "pending" | "crawled" | "error";
  errorMsg?: string;
}

interface CrawlStore {
  crawls: CrawlData[];
  status: CrawlStatus;
  addCrawl: (data: CrawlData) => void;
  updateCrawlStatus: (
    url: string,
    status: CrawlData["status"],
    errorMsg?: string,
  ) => void;
  setStatus: (status: CrawlStatus) => void;
  resetCrawls: () => void;
}

export const useCrawlStore = create<CrawlStore>((set) => ({
  crawls: [],
  status: "idle",
  addCrawl: (data) =>
    set((state) => ({
      crawls: [...state.crawls, data],
    })),
  updateCrawlStatus: (url, newStatus, errorMsg) =>
    set((state) => ({
      crawls: state.crawls.map((crawl) =>
        crawl.url === url ? { ...crawl, status: newStatus, errorMsg } : crawl,
      ),
    })),
  setStatus: (status) => set(() => ({ status })),
  resetCrawls: () => set(() => ({ crawls: [], status: "idle" })),
}));
