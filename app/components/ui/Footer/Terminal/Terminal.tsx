"use client";
import React, { useEffect, useRef } from "react";
import { useTerminalStore } from "@/store/TerminalStore";
import { useVisibilityStore } from "@/store/VisibilityStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Trash2, Terminal as TerminalIcon, Copy, Ghost, Loader2 } from "lucide-react";
import { listen } from "@tauri-apps/api/event";
import { toast } from "sonner";

const Terminal = () => {
  const { logs, clearLogs, addLogs } = useTerminalStore();
  const { visibility, hideTerminal } = useVisibilityStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [filterLevel, setFilterLevel] = React.useState<string>("all");

  // Handle Hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const logBatchRef = useRef<any[]>([]);

  // Filter logs based on selected level
  const filteredLogs = React.useMemo(() => {
    if (filterLevel === "all") return logs;
    return logs.filter((log) => log.level === filterLevel);
  }, [logs, filterLevel]);

  // Batch logs listener to prevent UI freezes
  useEffect(() => {
    if (!isHydrated) return;

    const flushBatch = () => {
      if (logBatchRef.current.length > 0) {
        console.log(`[Terminal] Flushing ${logBatchRef.current.length} logs to store`);
        addLogs([...logBatchRef.current]);
        logBatchRef.current = [];
      }
    };

    const flushInterval = setInterval(flushBatch, 150);

    console.log("[Terminal] Starting tui-log listener...");
    const unlistenPromise = listen("tui-log", (event) => {
      console.log("[Terminal] Received event:", event);
      const payload = event.payload as any;
      if (payload && typeof payload === 'object' && payload.message) {
        logBatchRef.current.push({
          timestamp: payload.timestamp,
          level: payload.level,
          message: payload.message,
        });
      } else {
        logBatchRef.current.push({
          timestamp: new Date().toLocaleTimeString(),
          level: "info",
          message: String(event.payload),
        });
      }
    });

    return () => {
      console.log("[Terminal] Cleaning up tui-log listener...");
      unlistenPromise.then((unlisten) => unlisten());
      clearInterval(flushInterval);
      flushBatch(); // Final flush on cleanup
    };
  }, [addLogs, isHydrated]);

  // Auto-scroll to bottom whenever logs change
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [filteredLogs, visibility.terminal]);

  const copyLogs = () => {
    if (filteredLogs.length === 0) return;
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Logs copied to clipboard");
  };

  return (
    <div
      className={`fixed bottom-[35px] left-0 w-full z-[999999999999998] border-t-2 border-brand-dark bg-brand-darker/95 backdrop-blur-md shadow-2xl transition-all duration-300 ease-in-out h-72 overflow-hidden animate-in slide-in-from-bottom duration-500 ${!visibility.terminal ? "opacity-0 pointer-events-none translate-y-full" : "opacity-100 translate-y-0"}`}
      style={{ visibility: visibility.terminal ? "visible" : "hidden" }}
    >
      <div className="flex items-center justify-between pl-2 pr-4 py-1.5 border-b border-brand-dark bg-brand-darker/50">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 border-white/10">
            <TerminalIcon className="w-3.5 h-3.5 text-brand-bright" />
            <span className="text-[10px] font-mono font-medium text-white/50 uppercase tracking-[0.2em]">
              RustySEO Logs
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-1.5 bg-brand-darker/80 border border-white/10 rounded-md p-0.5 ml-4">
            {["all", "info", "warn", "error"].map((level) => (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`px-2 py-0.5 rounded-[3px] text-[8px] uppercase font-mono transition-all duration-200 ${filterLevel === level
                  ? "bg-brand-bright text-white shadow-sm font-bold"
                  : "text-white/40 hover:text-white/70"
                  }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={copyLogs}
            className="group flex items-center space-x-2 text-white/40 hover:text-brand-bright transition-all duration-200"
            title="Copy Filtered Logs"
          >
            <span className="text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity uppercase">
              COPY
            </span>
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={clearLogs}
            className="group flex items-center space-x-1.5 text-white/40 hover:text-white transition-colors duration-200"
            title="Clear Logs"
          >
            <span className="text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity uppercase">
              CLEAR
            </span>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={hideTerminal}
            className="text-white/40 hover:text-red-400 transition-all duration-200 transform hover:rotate-90"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <ScrollArea
        className="h-[calc(100%-40px)] p-4 font-mono text-[11px] leading-relaxed selection:bg-brand-bright/30"
        ref={scrollRef}
      >
        <div className="space-y-1.5">
          {filteredLogs.map((log, index) => (
            <div
              key={index}
              className="flex space-x-3 group hover:bg-white/[0.02] -mx-2 px-2 rounded-sm transition-colors"
            >
              <span className="text-white/20 select-none whitespace-nowrap">
                {log.timestamp}
              </span>
              <span
                className={`uppercase font-bold text-[9px] pt-[2px] w-12 text-center rounded-[2px] inline-block h-fit px-1 ${log.level === "info"
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : log.level === "warn"
                    ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                    : log.level === "error"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  }`}
              >
                {log.level}
              </span>
              <span className="text-white/90 break-all font-light">
                {log.message}
              </span>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 space-y-3 opacity-20">
              <Ghost className="w-8 h-8" />
              <div className="text-[10px] uppercase tracking-widest italic">
                {logs.length === 0 ? "No logs to display" : `No ${filterLevel} logs found`}
              </div>
            </div>
          )}
          <div className="h-4" /> {/* Bottom padding */}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Terminal;
