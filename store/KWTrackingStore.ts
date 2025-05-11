// store/keywordsStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface KeywordData {
  id: string;
  keyword: string;
  url: string;
  current_impressions: number;
  initial_impressions: number;
  current_clicks: number;
  initial_clicks: number;
  current_position: number;
  initial_position: number;
  date_added: string;
}

interface KeywordsStore {
  // State
  keywords: KeywordData[];

  // Setters
  setKeywords: (keywords: KeywordData[]) => void;
}

export const useKeywordsStore = create<KeywordsStore>()(
  persist(
    (set) => ({
      // Initial state
      keywords: [],

      // State mutators
      setKeywords: (keywords) => set({ keywords }),
    }),
    {
      name: "keywords-storage", // LocalStorage key
      partialize: (state) => ({ keywords: state.keywords }), // Only persist keywords
    },
  ),
);
