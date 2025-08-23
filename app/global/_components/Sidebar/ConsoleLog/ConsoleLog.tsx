// @ts-nocheck
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, AlertCircle, Info, Clock } from "lucide-react";
import useGlobalConsoleStore from "@/store/GlobalConsoleLog";
import useGSCStatusStore from "@/store/GSCStatusStore";
import { invoke } from "@tauri-apps/api/core";

type LogLevel = "success" | "error" | "warning" | "info" | "debug";

interface LogEntry {
  id: number;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: string;
}

// Predefined log level configurations to avoid repetitive JSX creation
const LEVEL_CONFIGS = {
  success: {
    icon: <CheckCircle className="w-4 h-4 text-green-700 flex-shrink-0" />,
    badge: (
      <Badge
        variant="outline"
        className="bg-green-700/10 text-center text-green-700 border-green-700/20 flex-shrink-0 rounded-sm"
        style={{ width: "70px", textAlign: "center", display: "inline-block" }}
      >
        OK
      </Badge>
    ),
    textClass: "text-green-700",
  },
  error: {
    icon: <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
    badge: (
      <Badge
        variant="outline"
        className="bg-red-500/10 text-red-500 border-red-500/20 flex-shrink-0 rounded-sm"
        style={{ width: "70px", textAlign: "center", display: "inline-block" }}
      >
        ERROR
      </Badge>
    ),
    textClass: "text-red-400",
  },
  warning: {
    icon: <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />,
    badge: (
      <Badge
        variant="outline"
        className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 flex-shrink-0 rounded-sm"
        style={{ width: "70px", textAlign: "center", display: "inline-block" }}
      >
        WARNING
      </Badge>
    ),
    textClass: "text-yellow-400",
  },
  info: {
    icon: <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />,
    badge: (
      <Badge
        variant="outline"
        className="bg-blue-500/10 text-blue-500 border-blue-500/20 flex-shrink-0 rounded-sm"
        style={{ width: "70px", textAlign: "center", display: "inline-block" }}
      >
        INFO
      </Badge>
    ),
    textClass: "text-blue-400",
  },
  debug: {
    icon: <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />,
    badge: (
      <Badge
        variant="outline"
        className="bg-gray-500/10 text-gray-400 border-gray-500/20 flex-shrink-0 rounded-sm"
        style={{ width: "70px", textAlign: "center", display: "inline-block" }}
      >
        DEBUG
      </Badge>
    ),
    textClass: "text-zinc-400",
  },
} as const;

const generateLogs = (
  crawler: string,
  isGlobalCrawling: boolean,
  isFinishedDeepCrawl: boolean,
  tasks: number,
  aiModelLog: string,
  pageSpeedKeys: string[],
  ga4ID: string | null,
  gscCredentials: any,
  isGscConfigured: boolean,
  clarityApi: string,
): LogEntry[] => {
  const now = Date.now();
  const timestamp = new Date();

  return [
    {
      id: now + 1,
      timestamp,
      level: crawler === "Spider" ? "success" : "warning",
      message: `Crawler Mode: ${crawler}`,
    },
    {
      id: now + 2,
      timestamp,
      level: aiModelLog === "gemini" ? "success" : "error",
      message:
        aiModelLog === "gemini" ? "AI Model: Gemini" : "No AI model configured",
    },
    {
      id: now + 3,
      timestamp,
      level:
        pageSpeedKeys?.page_speed_key &&
        pageSpeedKeys.page_speed_key.trim() !== ""
          ? "success"
          : "error",
      message:
        pageSpeedKeys?.page_speed_key &&
        pageSpeedKeys.page_speed_key.trim() !== ""
          ? "PSI: Enabled"
          : "No PSI Keys configured",
    },
    {
      id: now + 4,
      timestamp,
      level: ga4ID === null || ga4ID === "" ? "error" : "success",
      message:
        ga4ID === null || ga4ID === ""
          ? "No GA4 ID configured"
          : "Google Analytics: Enabled",
    },
    {
      id: now + 5,
      timestamp,
      level: clarityApi !== "" ? "success" : "error",
      message:
        clarityApi !== "" ? "MS Clarity: Enabled" : "MS Clarity: Disabled",
    },
    {
      id: now + 6,
      timestamp,
      level: isGscConfigured ? "success" : "error",
      message: isGscConfigured ? "GSC: Enabled" : "GSC is not configured",
      details: gscCredentials?.project_id
        ? `Project: ${gscCredentials.project_id}`
        : undefined,
    },
    {
      id: now + 7,
      timestamp,
      level: isGlobalCrawling
        ? "info"
        : isFinishedDeepCrawl
          ? "success"
          : "info",
      message: isGlobalCrawling
        ? "Crawling..."
        : isFinishedDeepCrawl
          ? "Crawl Complete!"
          : "RustySEO is idle...",
    },
    {
      id: now + 8,
      timestamp,
      level: tasks === 0 ? "success" : "warning",
      message: tasks === 0 ? "No tasks pending" : `${tasks} tasks remaining`,
    },
  ];
};

function UptimeTimer() {
  const [uptime, setUptime] = useState("00:00:00");
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const hours = Math.floor(elapsed / 3600000)
        .toString()
        .padStart(2, "0");
      const minutes = Math.floor((elapsed % 3600000) / 60000)
        .toString()
        .padStart(2, "0");
      const seconds = Math.floor((elapsed % 60000) / 1000)
        .toString()
        .padStart(2, "0");
      setUptime(`${hours}:${minutes}:${seconds}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return <div className="text-zinc-400 text-[11px]">Uptime: {uptime}</div>;
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
  const [pageSpeedKeys, setPageSpeedKeys] = useState<{
    page_speed_key?: string;
  } | null>(null);
  const [ga4ID, setGa4ID] = useState<string | null>(null);
  const [clarityApi, setClarityApi] = useState("");

  // Use GSC status store instead of local state
  const {
    credentials: gscCredentials,
    isConfigured: isGscConfigured,
    setLoading: setGscLoading,
    updateStatus: updateGscStatus,
    lastChecked: gscLastChecked,
  } = useGSCStatusStore();

  // Function to refresh GSC status specifically
  const refreshGscStatus = useCallback(async () => {
    try {
      setGscLoading(true);
      const gsc = await invoke<any>("read_credentials_file");
      updateGscStatus(gsc);
    } catch (err) {
      console.error("[Error] Failed to refresh GSC status:", err);
      updateGscStatus(null, err.message || "Failed to fetch GSC credentials");
    }
  }, [setGscLoading, updateGscStatus]);

  // Initial configuration fetch on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aiModel, aiModelCheck, pageSpeed, ga4, clarity] =
          await Promise.all([
            invoke<string>("get_ai_model"),
            invoke<string>("check_ai_model"),
            invoke<{ page_speed_key: string }>("load_api_keys"),
            invoke<string | null>("get_google_analytics_id"),
            invoke<string>("get_microsoft_clarity_command"),
          ]);

        setAiModelLog(aiModelCheck || aiModel || "none");
        setPageSpeedKeys(pageSpeed);
        setGa4ID(ga4);
        setClarityApi(clarity || "");

        // Refresh GSC status separately
        await refreshGscStatus();
      } catch (err) {
        console.error("[Error] Failed to fetch configuration:", err);
        // Set safe defaults on error
        setAiModelLog("none");
        setPageSpeedKeys(null);
        setGa4ID(null);
        setClarityApi("");
      }
    };

    fetchData();
  }, [setAiModelLog, refreshGscStatus]);

  // Periodic GSC status refresh - every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshGscStatus();
    }, 600000); // Check every 10 minutes (600000ms)

    return () => clearInterval(interval);
  }, [refreshGscStatus]);

  // Memoized logs generation
  const memoizedLogs = useMemo(() => {
    return generateLogs(
      crawler,
      isGlobalCrawling,
      isFinishedDeepCrawl,
      tasks,
      aiModelLog,
      pageSpeedKeys,
      ga4ID,
      gscCredentials,
      isGscConfigured,
      clarityApi,
    );
  }, [
    crawler,
    isGlobalCrawling,
    isFinishedDeepCrawl,
    tasks,
    aiModelLog,
    pageSpeedKeys,
    ga4ID,
    gscCredentials,
    isGscConfigured,
    clarityApi,
  ]);

  // Update logs and handle scrolling
  useEffect(() => {
    setLogs(memoizedLogs);
    const scrollContainer = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [memoizedLogs]);

  return (
    <div className="w-full max-w-[600px] overflow-hidden bg-gray-50 dark:bg-zinc-900 font-mono text-xs h-[calc(100vh-39rem)]">
      <ScrollArea className="h-[calc(100vh-40.6rem)]" ref={scrollAreaRef}>
        <div className="p-2 space-y-2">
          {logs.map((log) => {
            const config = LEVEL_CONFIGS[log.level];
            return (
              <div key={log.id} className="space-y-1">
                <div className="flex items-center gap-2 text-center">
                  {config.icon}
                  {config.badge}
                  <span className={config.textClass}>{log.message}</span>
                </div>
                {log.details && (
                  <div className="pl-6 text-xs text-zinc-500 border-l border-zinc-700 ml-2">
                    {log.details}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="flex items-center text-xs justify-between px-4 py-1 bg-zinc-100 dark:bg-zinc-800 border-t dark:border-zinc-700">
        <UptimeTimer />
        {/*<div className="flex items-center gap-2">
          {gscLastChecked && (
            <span className="text-xs text-gray-500">
              Last: {new Date(gscLastChecked).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refreshGscStatus}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              isGscConfigured
                ? "bg-green-500/10 hover:bg-green-500/20 text-green-400"
                : "bg-red-500/10 hover:bg-red-500/20 text-red-400"
            }`}
            title={`GSC Status: ${isGscConfigured ? "Configured" : "Not Configured"}`}
          >
            GSC {isGscConfigured ? "✓" : "✗"}
          </button>
        </div>*/}
      </div>
    </div>
  );
}
