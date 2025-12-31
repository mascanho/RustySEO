"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Define the type for the visible state
interface VisibleState {
  widgets: boolean;
  head: boolean;
  charts: boolean;
  serp: boolean;
  opengraph: boolean;
  headings: boolean;
  links: boolean;
  images: boolean;
  scripts: boolean;
  tbw: boolean;
  renderBlocking: boolean;
  schema: boolean;
  networkRequests: boolean;
  longTasks: boolean;
}

// Define the type for the store
interface StoreState {
  Visible: VisibleState;
  showComponent: (component: keyof VisibleState) => void;
  hideComponent: (component: keyof VisibleState) => void;
  toggleComponent: (component: keyof VisibleState) => void;
}

// Check if we are in the browser
const isBrowser = typeof window !== "undefined";

const useStore = create<StoreState>()(
  persist(
    (set) => ({
      Visible: {
        widgets: true,
        head: true,
        charts: true,
        serp: true,
        opengraph: true,
        headings: true,
        links: true,
        images: true,
        scripts: true,
        tbw: true,
        renderBlocking: true,
        schema: true,
        networkRequests: true,
        longTasks: true,
      },
      showComponent: (component) =>
        set((state) => ({
          Visible: { ...state.Visible, [component]: true },
        })),
      hideComponent: (component) =>
        set((state) => ({
          Visible: { ...state.Visible, [component]: false },
        })),
      toggleComponent: (component) =>
        set((state) => ({
          Visible: { ...state.Visible, [component]: !state.Visible[component] },
        })),
    }),
    {
      name: "visibility-store",
      storage: isBrowser ? createJSONStorage(() => localStorage) : undefined, // undefined during SSR
    },
  ),
);

export default useStore;
