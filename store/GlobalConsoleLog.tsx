// @ts-nocheck
import { create } from "zustand";
import { shallow } from "zustand/shallow";

export interface ConsoleStore {
  isGlobalCrawling: boolean;
  isFinishedDeepCrawl: boolean;
  setCrawler: (type: string) => void;
  crawler: string;
}

const useGlobalConsoleStore = create<ConsoleStore>((set) => ({
  deepConsoleLog: [],
  crawler: "Spider",
  setCrawler: (type) => set({ crawler: type }),

  isGlobalCrawling: false,
  isFinishedDeepCrawl: false,
  setIsGlobalCrawling: (value) => set({ isGlobalCrawling: value }),
  setIsFinishedDeepCrawl: (value) => set({ isFinishedDeepCrawl: value }),
}));

export default useGlobalConsoleStore;
