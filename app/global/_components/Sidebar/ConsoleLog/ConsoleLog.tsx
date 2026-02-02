// @ts-nocheck
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Cpu,
  Globe,
  Database,
  Search,
  Zap,
  Bot,
  Settings2,
  ShieldCheck,
  Server,
} from "lucide-react";
import useGlobalConsoleStore from "@/store/GlobalConsoleLog";
import useGSCStatusStore from "@/store/GSCStatusStore";
import useGA4StatusStore from "@/store/GA4StatusStore";
import useSettingsStore from "@/store/SettingsStore";
import { invoke } from "@tauri-apps/api/core";

interface LogEntry {
  id: number;
  label: string;
  status: string;
  level: "success" | "error" | "warning" | "info";
  details?: string;
  icon: React.ReactNode;
}

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
  return [
    {
      id: 1,
      label: "Crawler Engine",
      status: crawler || "Spider",
      level: crawler === "Spider" ? "success" : "warning",
      icon: <Cpu size={14} />,
    },
    {
      id: 2,
      label: "AI Neural",
      status: aiModelLog === "gemini" ? "Gemini" : "Ollama",
      level: "success",
      icon: <Bot size={14} />,
    },
    {
      id: 3,
      label: "PSI Insights",
      status: pageSpeedKey ? "Connected" : "Offline",
      level: pageSpeedKey ? "success" : "error",
      icon: <Zap size={14} />,
    },
    {
      id: 4,
      label: "Google Analytics",
      status: isGa4Configured || ga4ID ? "Running" : "Not Configured",
      level: isGa4Configured || ga4ID ? "success" : "warning",
      icon: <Activity size={14} />,
    },
    {
      id: 5,
      label: "MS Clarity",
      status: clarityApi !== "" ? "Running" : "Not Configured",
      level: clarityApi !== "" ? "success" : "warning",
      icon: <Globe size={14} />,
    },
    {
      id: 6,
      label: "Search Console",
      status: isGscConfigured ? "Authorized" : "Required",
      level: isGscConfigured ? "success" : "error",
      details: gscCredentials?.project_id
        ? `ID: ${gscCredentials.project_id}`
        : undefined,
      icon: <Database size={14} />,
    },
    {
      id: 7,
      label: "Operation Status",
      status: isGlobalCrawling ? "Busy" : isFinishedDeepCrawl ? "Done" : "Idle",
      level: isGlobalCrawling
        ? "info"
        : isFinishedDeepCrawl
          ? "success"
          : "info",
      icon: <Search size={14} />,
    },
    {
      id: 8,
      label: "Workload Queue",
      status: tasks === 0 ? "Empty" : `${tasks} Tasks`,
      level: tasks === 0 ? "success" : "warning",
      icon: <Settings2 size={14} />,
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

  return (
    <div className="text-zinc-500 dark:text-zinc-400">UPTIME: {uptime}</div>
  );
}

export default function ConsoleLog() {
  const { crawler, isGlobalCrawling, isFinishedDeepCrawl, tasks } =
    useGlobalConsoleStore();
  const {
    credentials: gscCredentials,
    isConfigured: isGscConfigured,
    updateStatus: updateGscStatus,
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

  const refreshConfigs = useCallback(async () => {
    try {
      await refreshSettings();
      const gsc = await invoke<any>("read_credentials_file").catch(() => null);
      updateGscStatus(gsc);
    } catch (err) {}
  }, [refreshSettings, updateGscStatus]);

  useEffect(() => {
    refreshConfigs();
    const interval = setInterval(refreshConfigs, 30000);
    return () => clearInterval(interval);
  }, [refreshConfigs]);

  const items = useMemo(() => {
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
    lastUpdated,
  ]);

  return (
    <div className="text-xs w-full h-full flex flex-col bg-white dark:bg-brand-darker overflow-hidden">
      {/* App-standard header style */}
      <section className="w-full flex justify-end bg-gradient-to-r from-gray-100 to-white font-bold sticky top-0 py-1 dark:bg-gradient-to-l dark:from-brand-darker dark:to-blue-950/40 shadow dark:text-blue-500 flex-none z-10 px-2 uppercase tracking-tighter">
        <div className="w-full pl-2">System Diagnostic</div>
        <div className="w-[10.5em] text-right pr-4">Status</div>
      </section>

      <ScrollArea className="flex-1">
        <div className="flex flex-col not-selectable">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col border-b dark:border-b-brand-dark hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center text-[11px] w-full px-2 py-2 justify-between">
                <div className="w-2/3 pl-2 flex items-center gap-2">
                  <span
                    className={`flex-none ${
                      item.level === "error"
                        ? "text-red-500"
                        : item.level === "warning"
                          ? "text-amber-500"
                          : "text-brand-bright"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="font-medium dark:text-zinc-200">
                    {item.label}
                  </span>
                </div>
                <div
                  className={`w-1/3 text-right pr-4 font-mono font-bold tracking-tighter uppercase ${
                    item.level === "success"
                      ? "text-emerald-500 dark:text-emerald-400"
                      : item.level === "error"
                        ? "text-red-500"
                        : item.level === "warning"
                          ? "text-amber-500"
                          : "text-blue-500 dark:text-sky-400"
                  }`}
                >
                  {item.status}
                </div>
              </div>
              {item.details && (
                <div className="px-4 pb-2 -mt-1">
                  <span className="text-[9px] text-zinc-400 italic font-mono truncate block line-clamp-1 border-l-2 border-zinc-200 dark:border-zinc-800 pl-2 ml-1">
                    {item.details}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Standard sidebar footer */}
      <div className="flex items-center text-[10px] font-mono justify-between px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800/50 border-t dark:border-zinc-700 flex-none">
        <UptimeTimer />
        <div className="flex items-center gap-2">
          <div
            className={`w-1.5 h-1.5 rounded-full ${isGlobalCrawling ? "bg-orange-500 animate-pulse" : "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.3)]"}`}
          />
          <span className="opacity-50 tracking-widest">
            {isGlobalCrawling ? "CRAWLING" : "IDLE"}
          </span>
        </div>
      </div>
    </div>
  );
}
