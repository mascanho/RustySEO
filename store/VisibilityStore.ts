import create from "zustand";

// Define the types for the state
interface VisibilityState {
  sidebar: boolean;
  serpKeywords: boolean;
  seotoolkit: boolean;
  customSearch: boolean; // Ensure this matches the actions
  chatbar: boolean;
  changelog: boolean;
  urlchecker: boolean;
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
  showCustomSearch: () => void;
  hideCustomSearch: () => void;
  showChatbar: () => void;
  hideChatbar: () => void;
  showChangelog: () => void;
  hideChangelog: () => void;
  showUrlChecker: () => void;
  hideUrlChecker: () => void;
}

// Create the Zustand store with proper types
export const useVisibilityStore = create<BearState>((set) => ({
  visibility: {
    sidebar: true,
    serpKeywords: false,
    seotoolkit: false,
    customSearch: false, // Ensure this matches the initial state
    chatbar: false,
    changelog: false,
    urlchecker: false,
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

  // Custom Search actions
  showCustomSearch: () =>
    set((state) => ({
      visibility: { ...state.visibility, customSearch: true },
    })),
  hideCustomSearch: () =>
    set((state) => ({
      visibility: { ...state.visibility, customSearch: false },
    })),

  // Chat bar
  showChatbar: () =>
    set((state) => ({
      visibility: { ...state.visibility, chatbar: true },
    })),

  hideChatbar: () =>
    set((state) => ({
      visibility: { ...state.visibility, chatbar: false },
    })),

  showChangelog: () =>
    set((state) => ({
      visibility: { ...state.visibility, changelog: true },
    })),
  hideChangelog: () =>
    set((state) => ({
      visibility: { ...state.visibility, changelog: false },
    })),

  showUrlChecker: () =>
    set((state) => ({
      visibility: { ...state.visibility, urlchecker: true },
    })),
  hideUrlChecker: () =>
    set((state) => ({
      visibility: { ...state.visibility, urlchecker: false },
    })),
}));
