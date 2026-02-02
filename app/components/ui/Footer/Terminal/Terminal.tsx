"use client";
import React, { useEffect, useRef } from "react";
import { useTerminalStore } from "@/store/TerminalStore";
import { useVisibilityStore } from "@/store/VisibilityStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Trash2, Terminal as TerminalIcon } from "lucide-react";

const Terminal = () => {
    const { logs, clearLogs } = useTerminalStore();
    const { visibility, hideTerminal } = useVisibilityStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom whenever logs change
    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector(
                "[data-radix-scroll-area-viewport]"
            );
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [logs, visibility.terminal]);

    if (!visibility.terminal) return null;

    return (
        <div className="fixed bottom-[35px] left-0 w-full z-[999999999999998] border-t-2 border-brand-dark bg-brand-darker/95 backdrop-blur-md shadow-2xl transition-all duration-300 ease-in-out h-72 overflow-hidden animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center justify-between px-4 py-1.5 border-b border-brand-dark bg-brand-darker/50">
                <div className="flex items-center space-x-3">
                    <div className="flex space-x-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-black/10 shadow-inner" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-black/10 shadow-inner" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-black/10 shadow-inner" />
                    </div>
                    <div className="flex items-center space-x-2 border-l border-white/10 pl-3">
                        <TerminalIcon className="w-3.5 h-3.5 text-brand-bright" />
                        <span className="text-[10px] font-mono font-medium text-white/50 uppercase tracking-[0.2em]">
                            RustySEO Terminal
                        </span>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={clearLogs}
                        className="group flex items-center space-x-1.5 text-white/40 hover:text-white transition-colors duration-200"
                        title="Clear Logs"
                    >
                        <span className="text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">CLEAR</span>
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
                    {logs.map((log, index) => (
                        <div key={index} className="flex space-x-3 group hover:bg-white/[0.02] -mx-2 px-2 rounded-sm transition-colors">
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
                    {logs.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 space-y-3 opacity-20">
                            <TerminalIcon className="w-8 h-8" />
                            <div className="text-[10px] uppercase tracking-widest italic">
                                No logs to display
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
