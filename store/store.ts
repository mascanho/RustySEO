// @ts-ignore
import create from "zustand";

interface BearState {
  bears: number;
  increase: () => void;
  decrease: () => void;
}

export const useBearStore = create<BearState>((set: any) => ({
  bears: 2,
  increase: () => set((state: any) => ({ bears: state.bears + 1 })),
  decrease: () => set((state: any) => ({ bears: state.bears - 1 })),
}));
