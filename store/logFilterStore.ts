// @ts-nocheck
import { create } from "zustand";

interface CurrentLogsState {
  currentLogs: LogEntry[]; // Replace LogEntry with your actual type
  setCurrentLogs: (logs: LogEntry[]) => void;
}

export const useCurrentLogs = create<CurrentLogsState>((set) => ({
  currentLogs: [],
  setCurrentLogs: (logs) => set({ currentLogs: logs }),
}));
