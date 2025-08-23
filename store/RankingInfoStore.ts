import { create } from "zustand";

type Item = {
  id: number;
  name: string;
};

type StoreState = {
  items: Item[];
  addItem: (item: Item) => void;
  removeItem: (id: number) => void;
  clearItems: () => void;
};

const useRankinInfoStore = create<StoreState>((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => ({
      items: [item],
    })),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),
  clearItems: () => set({ items: [] }),
}));

export default useRankinInfoStore;
