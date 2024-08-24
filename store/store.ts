// @ts-nocheck
import create from "zustand";

interface OllamaStatus {
  ollama: boolean;
  increase: () => void;
  decrease: () => void;
}

export const useOllamaStore = create<OllamaStatus>((set: any) => ({
  ollama: false,
  ollamaIsRunning: () => set((state: any) => ({ ollama: true })),
  decrease: () => set((state: any) => ({ ollama: false })),
}));
