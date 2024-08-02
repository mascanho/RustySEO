import create from "zustand";

// Define the types for the state and actions
interface VisibilityState {
  sidebar: boolean;
}

interface BearState {
  visibility: VisibilityState;
  showSidebar: () => void;
  hideSidebar: () => void;
}

// Create the Zustand store with proper types
export const useVisibilityStore = create<BearState>((set) => ({
  visibility: {
    sidebar: true,
  },

  // Action to hide the sidebar
  hideSidebar: () =>
    set((state) => ({
      visibility: { sidebar: false },
    })),

  // Action to show the sidebar
  showSidebar: () =>
    set((state) => ({
      visibility: { sidebar: true },
    })),
}));
