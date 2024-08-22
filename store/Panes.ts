import create from "zustand";
import { persist } from "zustand/middleware";

// Define the Zustand store with persistence
const useStore = create(
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
      name: "visibility-store", // unique name for storage
      getStorage: () => localStorage, // use localStorage for persistence
    },
  ),
);

export default useStore;
