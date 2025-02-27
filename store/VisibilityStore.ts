import create from "zustand";

// Define the types for the state
interface VisibilityState {
  sidebar: boolean;
  serpKeywords: boolean;
  seotoolkit: boolean;
  extractor: boolean; // Added extractor to match the actions
}

// Define the interface for the store
interface BearState {
  visibility: VisibilityState;
  showSidebar: () => void;
  hideSidebar: () => void;
  showSerpKeywords: () => void;
  hideSerpKeywords: () => void;
  showSeoToolkit: () => void;
  hideSeoToolkit: () => void;
  showExtractor: () => void;
  hideExtractor: () => void;
}

// Create the Zustand store with proper types
export const useVisibilityStore = create<BearState>((set) => ({
  visibility: {
    sidebar: true,
    serpKeywords: false,
    seotoolkit: false,
    extractor: false, // Added extractor to initial state
  },

  // Sidebar actions
  showSidebar: () =>
    set((state) => ({
      visibility: { ...state.visibility, sidebar: true },
    })),
  hideSidebar: () =>
    set((state) => ({
      visibility: { ...state.visibility, sidebar: false },
    })),

  // SERP Keywords actions
  showSerpKeywords: () =>
    set((state) => ({
      visibility: { ...state.visibility, serpKeywords: true },
    })),
  hideSerpKeywords: () =>
    set((state) => ({
      visibility: { ...state.visibility, serpKeywords: false },
    })),

  // SEO Toolkit actions
  showSeoToolkit: () =>
    set((state) => ({
      visibility: { ...state.visibility, seotoolkit: true },
    })),
  hideSeoToolkit: () =>
    set((state) => ({
      visibility: { ...state.visibility, seotoolkit: false },
    })),

  // Extractor actions
  showExtractor: () =>
    set((state) => ({
      visibility: { ...state.visibility, extractor: true },
    })),
  hideExtractor: () =>
    set((state) => ({
      visibility: { ...state.visibility, extractor: false },
    })),
}));
