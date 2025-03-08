// @ts-nocheck
import { create } from "zustand";
import { shallow } from "zustand/shallow";

export interface ConsoleStore {
  isGlobalCrawling: boolean;
  isFinishedDeepCrawl: boolean;
  setCrawler: (type: string) => void;
  crawler: string;

  // TODOs & Tasks
  tasks: number;
  setTasksNumber: (value: number) => void;

  // AI MODEL
  aiModelLog: string;
  setAiModelLog: (value: string) => void;
}

const useGlobalConsoleStore = create<ConsoleStore>((set) => ({
  deepConsoleLog: [],
  crawler: "Spider",
  setCrawler: (type) => set({ crawler: type }),

  isGlobalCrawling: false,
  isFinishedDeepCrawl: false,
  setIsGlobalCrawling: (value) => set({ isGlobalCrawling: value }),
  setIsFinishedDeepCrawl: (value) => set({ isFinishedDeepCrawl: value }),

  // Tasks
  tasks: 0,
  setTasksNumber: (value) => set({ tasks: value }),

  // AI Model
  aiModelLog: "",
  setAiModelLog: (value) => set({ aiModelLog: value }),
}));

export default useGlobalConsoleStore;
