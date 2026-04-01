// @ts-nocheck
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ServerLogSettings {
  storingLogs: boolean;
  setStoringLogs: (logs: LogEntry[]) => void;

  storedLogsFromDBStore: LogEntry[];
  setStoredLogsFromDBStore: (logs: LogEntry[]) => void;

  uploadedLogFiles: any[]; // Changed to any[] since it's an array of log entries
  setUploadedLogFiles: (files: any) => void;
  updateLogEntry: (time: string, data: any) => void;

  reset: () => void;

  // Actions
  ExcelLoaded: boolean;
  setExcelLoaded: () => void;
}

export const useServerLogsStore = create<ServerLogSettings>()(
  persist(
    (set) => ({
      storingLogs: false,
      setStoringLogs: (logs) => set({ storingLogs: logs }),

      storedLogsFromDBStore: [],
      setStoredLogsFromDBStore: (logs) => set({ storedLogsFromDBStore: logs }),

      uploadedLogFiles: [],
      setUploadedLogFiles: (newEntry) =>
        set((state) => ({
          uploadedLogFiles: [...state.uploadedLogFiles, newEntry],
        })),

      updateLogEntry: (time, data) =>
        set((state) => ({
          uploadedLogFiles: state.uploadedLogFiles.map((log) =>
            log.time === time ? { ...log, ...data } : log
          ),
        })),

      reset: () =>
        set({
          storingLogs: false,
          storedLogsFromDBStore: [],
          uploadedLogFiles: [],
        }),

      ExcelLoaded: false,
      setExcelLoaded: () => set({ ExcelLoaded: true }),
    }),
    {
      name: "server-logs-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const useExcelLoading = create((set) => ({
  ExcelLoaded: false,
  setExcelLoaded: () => set({ ExcelLoaded: true }),
}));
