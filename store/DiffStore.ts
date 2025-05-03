import { create } from "zustand";

interface DiffData {
  added: {
    number_of_pages: number;
    pages: string[];
  };
  removed: {
    number_of_pages: number;
    pages: string[];
  };
}

interface DiffStore {
  // State
  diff: DiffData | null; // Changed to nullable DiffData
  isLoading: boolean;
  error: string | null;

  // Actions
  setBulkDiffData: (response: DiffData) => void;
  clearDiffData: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDiffStore = create<DiffStore>((set) => ({
  // Initial state
  diff: null, // Initialize as null
  isLoading: false,
  error: null,

  // Actions
  setBulkDiffData: (response) =>
    set({
      diff: response,
      isLoading: false,
      error: null,
    }),

  clearDiffData: () =>
    set({
      diff: null,
      error: null,
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
