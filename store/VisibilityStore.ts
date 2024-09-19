import create from "zustand";

// Define the types for the state and actions
interface VisibilityState {
  sidebar: boolean;
  serpKeywords: boolean;
}

interface BearState {
  visibility: VisibilityState;
  showSidebar: () => void;
  hideSidebar: () => void;
  showSerpKeywords: () => void;
  hideSerpKeywords: () => void;
}

// Create the Zustand store with proper types
export const useVisibilityStore = create<BearState>((set) => ({
  visibility: {
    sidebar: true,
    serpKeywords: false,
  },

  // Action to hide the sidebar
  hideSidebar: () =>
    set((state) => ({
      visibility: { ...state.visibility, sidebar: false },
    })),

  // Action to show the sidebar
  showSidebar: () =>
    set((state) => ({
      visibility: { ...state.visibility, sidebar: true },
    })),

  // Action to hide the SERP keywords
  hideSerpKeywords: () =>
    set((state) => ({
      visibility: { ...state.visibility, serpKeywords: false },
    })),

  // Action to show the SERP keywords
  showSerpKeywords: () =>
    set((state) => ({
      visibility: { ...state.visibility, serpKeywords: true },
    })),
}));
