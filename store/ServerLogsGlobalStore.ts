// @ts-nocheck
import { create } from "zustand";

interface ServerLogSettings {
  storingLogs: boolean; // Replace LogEntry with your actual type
  setStoringLogs: (logs: LogEntry[]) => void;
  storedLogsFromDBStore: LogEntry[];
  setStoredLogsFromDBStore: (logs: LogEntry[]) => void;
}

export const useServerLogsStore = create<ServerLogSettings>((set) => ({
  storingLogs: false,
  setStoringLogs: (logs) => set({ storingLogs: logs }),

  storedLogsFromDBStore: [],
  setStoredLogsFromDBStore: (logs) => set({ storedLogsFromDBStore: logs }),
}));
