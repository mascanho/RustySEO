// @ts-nocheck
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, AlertCircle, Info, Clock } from "lucide-react";
import useGlobalConsoleStore from "@/store/GlobalConsoleLog";
import useGSCStatusStore from "@/store/GSCStatusStore";
import useGA4StatusStore from "@/store/GA4StatusStore";
import useSettingsStore from "@/store/SettingsStore";
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
  pageSpeedKey: string | null,
  ga4ID: string | null,
  gscCredentials: any,
  isGscConfigured: boolean,
  clarityApi: string,
  isGa4Configured: boolean,
): LogEntry[] => {
  const now = Date.now();
  const timestamp = new Date();

  async function get_settings() {
    const settings = await invoke<any>("get_settings_command");
    // console.log(settings, "These are the settings");
    return settings;
  }

  const psiKeys = get_settings().then((settings) => {
    return settings.page_speed_key;
  });

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
      level: psiKeys !== "" ? "success" : "error",
      message: psiKeys !== "" ? "PSI Key: Found" : "No PSI Keys configured",
    },
    {
      id: now + 4,
      timestamp,
      level:
        isGa4Configured || (ga4ID !== null && ga4ID !== "")
          ? "success"
          : "error",
      message:
        isGa4Configured || (ga4ID !== null && ga4ID !== "")
          ? "Google Analytics: Enabled"
          : "No GA4 ID configured",
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
  const { crawler, isGlobalCrawling, isFinishedDeepCrawl, tasks, setCrawler } =
    useGlobalConsoleStore();

  // Use stores for reactive state management
  const {
    credentials: gscCredentials,
    isConfigured: isGscConfigured,
    setLoading: setGscLoading,
    updateStatus: updateGscStatus,
    lastChecked: gscLastChecked,
  } = useGSCStatusStore();

  const { isConfigured: isGa4Configured } = useGA4StatusStore();

  const {
    pageSpeedKey,
    ga4Id,
    clarityApi,
    aiModel,
    lastUpdated,
    refreshSettings,
  } = useSettingsStore();

  // Function to refresh all configuration data
  const refreshAllConfigurations = useCallback(async () => {
    try {
      await refreshSettings();
      const gsc = await invoke<any>("read_credentials_file").catch(() => null);
      updateGscStatus(gsc);

      // Check localStorage for crawler type
      const savedCrawlerType = localStorage.getItem("crawlerType");
      if (
        savedCrawlerType &&
        (savedCrawlerType === "Spider" || savedCrawlerType === "Custom Search")
      ) {
        setCrawler(savedCrawlerType);
      }
    } catch (err) {
      console.error("[Error] Failed to refresh configurations:", err);
    }
  }, [refreshSettings, updateGscStatus, setCrawler]);

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

  // Initial configuration fetch on mount and handle storage events
  useEffect(() => {
    refreshAllConfigurations();

    // Listen for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "crawlerType" && e.newValue) {
        setCrawler(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshAllConfigurations, setCrawler]);

  // Periodic configuration refresh - every 30 seconds for all configs
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAllConfigurations();
    }, 30000); // Check every 30 seconds (30000ms)

    return () => clearInterval(interval);
  }, [refreshAllConfigurations]);

  // Memoized logs generation
  const memoizedLogs = useMemo(() => {
    return generateLogs(
      crawler,
      isGlobalCrawling,
      isFinishedDeepCrawl,
      tasks,
      aiModel,
      pageSpeedKey,
      ga4Id,
      gscCredentials,
      isGscConfigured,
      clarityApi,
      isGa4Configured,
    );
  }, [
    crawler,
    isGlobalCrawling,
    isFinishedDeepCrawl,
    tasks,
    aiModel,
    pageSpeedKey,
    ga4Id,
    gscCredentials,
    isGscConfigured,
    clarityApi,
    isGa4Configured,
    lastUpdated, // Include lastUpdated to trigger re-render when settings change
  ]);

  // Update logs when crawler type changes in localStorage
  useEffect(() => {
    const savedCrawlerType = localStorage.getItem("crawlerType");
    if (savedCrawlerType !== crawler) {
      setLogs(memoizedLogs);
    }
  }, [crawler, memoizedLogs]);

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
    <div className="w-full max-w-[600px] overflow-hidden bg-gray-50 dark:bg-zinc-900 font-mono text-xs h-full flex flex-col">
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
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
