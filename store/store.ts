import create from "zustand";

interface BearState {
  bears: number;
  increase: () => void;
  decrease: () => void;
}

export const useBearStore = create<BearState>((set) => ({
  bears: 2,
  increase: () => set((state) => ({ bears: state.bears + 1 })),
  decrease: () => set((state) => ({ bears: state.bears - 1 })),
}));
