import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, AlertCircle, Info, Clock } from "lucide-react";
import useGlobalConsoleStore from "@/store/GlobalConsoleLog";

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
): LogEntry[] => {
  const logs: LogEntry[] = [
    {
      id: Date.now(),
      timestamp: new Date(),
      level: crawler === "Spider" ? "info" : "warning",
      message: `Mode: ${crawler}`,
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
          : "Idle...",
    },

    // Add more logs here as needed
    // Example:
    // {
    //   id: Date.now() + 1,
    //   timestamp: new Date(),
    //   level: "debug",
    //   message: "Debugging crawler performance",
    //   details: "Additional details about the debug log",
    // },
  ];

  return logs;
};

export default function ConsoleLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { crawler, isGlobalCrawling, isFinishedDeepCrawl } =
    useGlobalConsoleStore();

  // Update logs whenever `crawler` changes
  useEffect(() => {
    if (crawler) {
      const newLogs = generateLogs(
        crawler,
        isGlobalCrawling,
        isFinishedDeepCrawl,
      ); // Generate logs based on the current state
      setLogs((prev) => newLogs); // Append the new logs
    }
  }, [crawler, isGlobalCrawling, isFinishedDeepCrawl]);

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
        <div className="p-4 space-y-2">
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
        <div className="text-zinc-400 text-xs">Uptime: app.main</div>
        <div className="text-zinc-400 text-xs">PID: 12345</div>
      </div>
    </div>
  );
}
