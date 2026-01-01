// store/keywordsStore.ts
import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";

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

const isBrowser = typeof window !== "undefined";

const dummyStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const storage = isBrowser
  ? createJSONStorage(() => localStorage)
  : createJSONStorage(() => dummyStorage);

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
      storage,
      partialize: (state) => ({ keywords: state.keywords }), // Only persist keywords
    },
  ),
);
