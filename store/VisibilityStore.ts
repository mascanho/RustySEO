import create from "zustand";

// Define the types for the state and actions
interface VisibilityState {
  sidebar: boolean;
  serpKeywords: boolean;
  seotoolkit: boolean; // Added seotoolkit
}

interface BearState {
  visibility: VisibilityState;
  showSidebar: () => void;
  hideSidebar: () => void;
  showSerpKeywords: () => void;
  hideSerpKeywords: () => void;
  showSeoToolkit: () => void;
  hideSeoToolkit: () => void;
}

// Create the Zustand store with proper types
export const useVisibilityStore = create<BearState>((set) => ({
  visibility: {
    sidebar: true,
    serpKeywords: false,
    seotoolkit: true, // Ensure this is included
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

  // Action to hide the SEO Toolkit
  hideSeoToolkit: () =>
    set((state) => ({
      visibility: { ...state.visibility, seotoolkit: false },
    })),

  // Action to show the SEO Toolkit
  showSeoToolkit: () =>
    set((state) => ({
      visibility: { ...state.visibility, seotoolkit: true },
    })),
}));
