import { create } from "zustand";

// Define the structure of a single page's details
export interface PageDetails {
  url: string;
  title: { title: string; title_len: number }[]; // Adjusted to match expected structure
  description: string;
  headings: Record<string, string[]>;
  javascript: { external: string[]; inline: string[] };
  status_code: { response: { statusCode: number; statusText: string } }[];
}

// Define the Zustand store
interface CrawlStore {
  crawlData: PageDetails[]; // Store as a flat array
  setDomainCrawlData: (data: PageDetails[]) => void; // Replace entire array
  addDomainCrawlResult: (result: PageDetails) => void; // Append to array
  clearDomainCrawlData: () => void; // Reset array
  domainCrawlLoading: boolean; // Store loading state
  setDomainCrawlLoading: (loading: boolean) => void; // Set loading state
  crawlerType: string; // Store crawler type
  setCrawlerType: (type: string) => void; // Set crawler type
}

const useGlobalCrawlStore = create<CrawlStore>((set) => ({
  crawlData: [], // Initialize as an empty array

  setDomainCrawlData: (data) => set({ crawlData: data }), // Replace the entire dataset

  addDomainCrawlResult: (result) =>
    set((state) => ({
      crawlData: [...state.crawlData, result], // Append new entry
    })),

  clearDomainCrawlData: () => set({ crawlData: [] }), // Clear all data

  domainCrawlLoading: false, // Initialize loading state

  setDomainCrawlLoading: (loading) => set({ domainCrawlLoading: loading }), // Set loading state

  crawlerType: "spider", // Initialize crawler type

  setCrawlerType: (type) => set({ crawlerType: type }), // Set crawler type
}));

export default useGlobalCrawlStore;
