import create from "zustand";
import { persist } from "zustand/middleware";

interface ModelStore {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

const useModelStore = create<ModelStore>()(
  persist(
    (set) => ({
      selectedModel: "",
      setSelectedModel: (model) => {
        set({ selectedModel: model });
        localStorage.setItem("selectedModel", model);
      },
    }),
    {
      name: "model-storage",
      getStorage: () => localStorage,
    },
  ),
);

export default useModelStore;
