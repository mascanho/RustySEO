"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, AlertCircle, Info, Clock } from "lucide-react";

type LogLevel = "success" | "error" | "warning" | "info" | "debug";

interface LogEntry {
  id: number;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: string;
}

export default function ConsoleLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Generate sample logs on component mount
  useEffect(() => {
    const sampleLogs: LogEntry[] = [
      {
        id: 1,
        timestamp: new Date(Date.now() - 5000),
        level: "info",
        message: "Application starting...",
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 4800),
        level: "debug",
        message: "Loading configuration from /etc/app/config.json",
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 4600),
        level: "success",
        message: "Configuration loaded successfully",
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 4400),
        level: "info",
        message: "Connecting to database at db.example.com:5432",
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 4200),
        level: "error",
        message: "Failed to connect to database",
        details: "Connection timeout after 5000ms",
      },
      {
        id: 6,
        timestamp: new Date(Date.now() - 4000),
        level: "warning",
        message: "Retrying database connection (1/3)",
      },
      {
        id: 7,
        timestamp: new Date(Date.now() - 3800),
        level: "success",
        message: "Connected to database successfully",
      },
      {
        id: 8,
        timestamp: new Date(Date.now() - 3600),
        level: "info",
        message: "Initializing API endpoints",
      },
      {
        id: 9,
        timestamp: new Date(Date.now() - 3400),
        level: "success",
        message: "API endpoints initialized",
      },
      {
        id: 10,
        timestamp: new Date(Date.now() - 3200),
        level: "info",
        message: "Starting server on port 3000",
      },
      {
        id: 11,
        timestamp: new Date(Date.now() - 3000),
        level: "success",
        message: "Server started successfully",
      },
      {
        id: 12,
        timestamp: new Date(Date.now() - 2800),
        level: "info",
        message: "Checking system resources",
      },
      {
        id: 13,
        timestamp: new Date(Date.now() - 2600),
        level: "warning",
        message: "Low memory available",
        details: "Only 512MB free of 8GB total",
      },
      {
        id: 14,
        timestamp: new Date(Date.now() - 2400),
        level: "info",
        message: "Running garbage collection",
      },
      {
        id: 15,
        timestamp: new Date(Date.now() - 2200),
        level: "success",
        message: "Garbage collection complete",
        details: "Freed 256MB of memory",
      },
      {
        id: 16,
        timestamp: new Date(Date.now() - 2000),
        level: "info",
        message: "Application ready",
      },
    ];

    // Simulate logs appearing over time
    let index = 0;
    const interval = setInterval(() => {
      if (index < sampleLogs.length) {
        setLogs((prev) => [...prev, sampleLogs[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

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
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-500" />;
      case "debug":
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case "success":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-500 border-green-500/20"
          >
            SUCCESS
          </Badge>
        );
      case "error":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-500 border-red-500/20"
          >
            ERROR
          </Badge>
        );
      case "warning":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          >
            WARNING
          </Badge>
        );
      case "info":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-500 border-blue-500/20"
          >
            INFO
          </Badge>
        );
      case "debug":
        return (
          <Badge
            variant="outline"
            className="bg-gray-500/10 text-gray-400 border-gray-500/20"
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
    <div className="w-full max-w-[600px] overflow-hidden bg-gray-50 dark:bg-zinc-900  font-mono text-xs h-[calc(100vh-39rem)]">
      {/* <div className="flex items-center justify-between px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-b dark:border-zinc-700 ">
        <div className="text-zinc-500 text-xs">{logs.length} entries</div>
      </div> */}

      <ScrollArea className="h-[calc(100vh-41rem)]" ref={scrollAreaRef}>
        <div className="p-4 space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="space-y-1">
              <div className="flex items-center gap-2">
                {getLevelIcon(log.level)}
                {/* <span className="text-zinc-400">
                  [{formatTimestamp(log.timestamp)}]
                </span> */}
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
        <div className="text-zinc-400 text-xs">Process: app.main</div>
        <div className="text-zinc-400 text-xs">PID: 12345</div>
      </div>
    </div>
  );
}
