import { create } from "zustand";

interface LogEntry {
    timestamp: string;
    level: "info" | "warn" | "error" | "debug" | "success";
    message: string;
}

interface TerminalState {
    logs: LogEntry[];
    addLog: (message: string, level?: LogEntry["level"]) => void;
    clearLogs: () => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
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
    addLog: (message, level = "info") =>
        set((state) => ({
            logs: [
                ...state.logs,
                {
                    timestamp: new Date().toLocaleTimeString(),
                    level,
                    message,
                },
            ].slice(-100), // Keep last 100 logs
        })),
    clearLogs: () => set({ logs: [] }),
}));
