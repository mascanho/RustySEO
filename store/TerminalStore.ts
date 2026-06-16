import { create } from "zustand";

interface LogEntry {
    timestamp: string;
    level: "info" | "warn" | "error" | "debug" | "success";
    message: string;
}

interface TerminalState {
    logs: LogEntry[];
    addLog: (message: string, level?: LogEntry["level"], timestamp?: string) => void;
    addLogs: (newLogs: LogEntry[]) => void;
    clearLogs: () => void;
}

const MAX_LOGS = 500;

export const useTerminalStore = create<TerminalState>((set) => ({
    logs: [
        {
            timestamp: new Date().toLocaleTimeString(),
            level: "info",
            message: "🚀 RustySEO Terminal initialized...",
        },
        {
            timestamp: new Date().toLocaleTimeString(),
            level: "info",
            message: "System ready. Waiting for crawl activity.",
        },
    ],
    addLog: (message, level = "info", timestamp?: string) =>
        set((state) => ({
            logs: [
                ...state.logs,
                {
                    timestamp: timestamp || new Date().toLocaleTimeString(),
                    level,
                    message,
                },
            ].slice(-MAX_LOGS),
        })),
    addLogs: (newLogs) =>
        set((state) => ({
            logs: [...state.logs, ...newLogs].slice(-MAX_LOGS),
        })),
    clearLogs: () => set({ logs: [] }),
}));
