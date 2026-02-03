import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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

export const useTerminalStore = create<TerminalState>()(
    persist(
        (set) => ({
            logs: [
                {
                    timestamp: new Date().toLocaleTimeString(),
                    level: "info",
                    message: "🚀 RustySEO Terminal initialized...",
                },
                {
                    timestamp: new Date().toLocaleTimeString(),
                    level: "debug",
                    message: "Scanning system configuration...",
                },
                {
                    timestamp: new Date().toLocaleTimeString(),
                    level: "info",
                    message: "System: macOS detected. Engine: Rust-Tauri.",
                },
                {
                    timestamp: new Date().toLocaleTimeString(),
                    level: "success",
                    message: "All systems go. Ready for crawling.",
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
                    ].slice(-500),
                })),
            addLogs: (newLogs) =>
                set((state) => ({
                    logs: [...state.logs, ...newLogs].slice(-500),
                })),
            clearLogs: () => set({ logs: [] }),
        }),
        {
            name: "rusty-terminal-logs",
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
