// @ts-nocheck
import { create } from "zustand";

interface ServerLogSettings {
  storingLogs: boolean;
  setStoringLogs: (logs: LogEntry[]) => void;

  storedLogsFromDBStore: LogEntry[];
  setStoredLogsFromDBStore: (logs: LogEntry[]) => void;

  uploadedLogFiles: File[];
  setUploadedLogFiles: (files: File[]) => void;

  reset: () => void;
}

export const useServerLogsStore = create<ServerLogSettings>((set) => ({
  storingLogs: false,
  setStoringLogs: (logs) => set({ storingLogs: logs }),

  storedLogsFromDBStore: [],
  setStoredLogsFromDBStore: (logs) => set({ storedLogsFromDBStore: logs }),

  uploadedLogFiles: [],
  setUploadedLogFiles: (newEntry) =>
    set((state) => ({
      uploadedLogFiles: [...state.uploadedLogFiles, newEntry],
    })),

  reset: () =>
    set({
      storingLogs: false,
      storedLogsFromDBStore: [],
      uploadedLogFiles: [],
    }),
}));
