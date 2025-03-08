import { useEffect, useRef, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, AlertCircle, Info, Clock } from "lucide-react";
import useGlobalConsoleStore from "@/store/GlobalConsoleLog";
import { invoke } from "@tauri-apps/api/core";

type LogLevel = "success" | "error" | "warning" | "info" | "debug";

interface LogEntry {
  id: number;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: string;
}

// Log generator function
const generateLogs = (
  crawler: string,
  isGlobalCrawling: boolean,
  isFinishedDeepCrawl: boolean,
  tasks: number,
  aiModelLog: string,
): LogEntry[] => {
  const logs: LogEntry[] = [
    {
      id: Date.now(),
      timestamp: new Date(),
      level: crawler === "Spider" ? "info" : "warning",
      message: `Mode: ${crawler}`,
    },
    {
      id: Date.now() + 2,
      timestamp: new Date(),
      level: aiModelLog === "gemini" ? "success" : "error",
      message:
        aiModelLog === "gemini"
          ? "AI Model: Gemini"
          : "No AI model configured ",
    },
    {
      id: Date.now() + 1,
      timestamp: new Date(),
      level: isGlobalCrawling
        ? "info"
        : isFinishedDeepCrawl
          ? "success"
          : "info",
      message: isGlobalCrawling
        ? "Crawling..."
        : isFinishedDeepCrawl
          ? "Crawl Complete"
          : "RustySEO is idle...",
    },
    {
      id: Date.now() + 3,
      timestamp: new Date(),
      level: tasks === 0 ? "success" : "warning",
      message: `TODO: ${tasks}`,
    },
  ];

  return logs;
};

// Uptime Timer Component (Extracted for performance optimization)
function UptimeTimer() {
  const [uptime, setUptime] = useState("00:00:00");

  useEffect(() => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const hours = Math.floor(elapsedTime / (1000 * 60 * 60))
        .toString()
        .padStart(2, "0");
      const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60)
        .toString()
        .padStart(2, "0");
      const seconds = Math.floor((elapsedTime / 1000) % 60)
        .toString()
        .padStart(2, "0");

      setUptime(`${hours}:${minutes}:${seconds}`);
    }, 1000); // Update every second

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  return <div className="text-zinc-400 text-xs">Uptime: {uptime}</div>;
}

export default function ConsoleLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const {
    crawler,
    isGlobalCrawling,
    isFinishedDeepCrawl,
    tasks,
    aiModelLog,
    setAiModelLog,
  } = useGlobalConsoleStore();

  useEffect(() => {
    invoke("get_ai_model").then((result: any) => {
      setAiModelLog(result);
    });
    invoke("check_ai_model").then((result: any) => {
      setAiModelLog(result);
    });
  }, []);

  // Update logs whenever `crawler`, `isGlobalCrawling`, or `isFinishedDeepCrawl` changes
  useEffect(() => {
    if (crawler) {
      const newLogs = generateLogs(
        crawler,
        isGlobalCrawling,
        isFinishedDeepCrawl,
        tasks,
        aiModelLog,
      ); // Generate logs based on the current state
      setLogs((prev) => newLogs); // Append the new logs
    }
  }, [crawler, isGlobalCrawling, isFinishedDeepCrawl, tasks, aiModelLog]);

  // Auto-scroll to bottom when new logs appear
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [logs]);

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
      case "warning":
        return (
          <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        );
      case "info":
        return <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />;
      case "debug":
        return <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />;
    }
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case "success":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-500 border-green-500/20 flex-shrink-0"
          >
            SUCCESS
          </Badge>
        );
      case "error":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-500 border-red-500/20 flex-shrink-0"
          >
            ERROR
          </Badge>
        );
      case "warning":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 flex-shrink-0"
          >
            WARNING
          </Badge>
        );
      case "info":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-500 border-blue-500/20 flex-shrink-0"
          >
            INFO
          </Badge>
        );
      case "debug":
        return (
          <Badge
            variant="outline"
            className="bg-gray-500/10 text-gray-400 border-gray-500/20 flex-shrink-0"
          >
            DEBUG
          </Badge>
        );
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toISOString().split("T")[1].slice(0, 12);
  };

  return (
    <div className="w-full max-w-[600px] overflow-hidden bg-gray-50 dark:bg-zinc-900 font-mono text-xs h-[calc(100vh-39rem)]">
      <ScrollArea className="h-[calc(100vh-41rem)]" ref={scrollAreaRef}>
        <div className="p-2 space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="space-y-1">
              <div className="flex items-center gap-2">
                {getLevelIcon(log.level)}
                {getLevelBadge(log.level)}
                <span
                  className={`
                  ${log.level === "success" ? "text-green-400" : ""}
                  ${log.level === "error" ? "text-red-400" : ""}
                  ${log.level === "warning" ? "text-yellow-400" : ""}
                  ${log.level === "info" ? "text-blue-400" : ""}
                  ${log.level === "debug" ? "text-zinc-400" : ""}
                `}
                >
                  {log.message}
                </span>
              </div>
              {log.details && (
                <div className="pl-6 text-xs text-zinc-500 border-l border-zinc-700 ml-2">
                  {log.details}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex items-center text-xs justify-between px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-t dark:border-zinc-700">
        <UptimeTimer /> {/* Use the extracted UptimeTimer component */}
        <div className="text-zinc-400 text-xs">PID: 12345</div>
      </div>
    </div>
  );
}
