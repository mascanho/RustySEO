// @ts-nocheck
import create from "zustand";

interface BearState {
  bears: number;
  increase: () => void;
  decrease: () => void;
}

interface OllamaStatus {
  ollama: boolean;
  increase: () => void;
  decrease: () => void;
}

export const useBearStore = create<BearState>((set: any) => ({
  bears: 2,
  increase: () => set((state: any) => ({ bears: state.bears + 1 })),
  decrease: () => set((state: any) => ({ bears: state.bears - 1 })),
}));

export const useOllamaStore = create<OllamaStatus>((set: any) => ({
  ollama: false,
  ollamaIsRunning: () => set((state: any) => ({ ollama: true })),
  decrease: () => set((state: any) => ({ ollama: false })),
}));
