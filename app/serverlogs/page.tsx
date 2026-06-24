// @ts-nocheck
"use client";

import { Tabs } from "@mantine/core";
import { BarSeriesChart } from "./_components/charts/BarSeriesChart";
import {
  PieChart,
  PieChartLogs,
  PieChartStatus,
} from "./_components/charts/PieChartStatus";
import { TimelineChart } from "./_components/charts/TimelineChart";
import { CrawlerTimelineBarChart } from "./_components/charts/CrawlerTimelineBarChart";
import { StatusCodeBarChart } from "./_components/charts/StatusCodeBarChart";
import InputZone from "./_components/InputZone";
import { LogAnalyzer } from "./_components/table/log-analyzer";
import UploadButton from "./_components/UploadButton";
import WidgetLogs from "./_components/WidgetLogs";
import { toast, Toaster } from "sonner";
import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useLogAnalysisStore } from "@/store/ServerLogsStore";
import { useServerLogsStore } from "@/store/ServerLogsGlobalStore";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CrawlResult {
  url: string;
  title: string;
  h1: string;
  file_type: string;
}

interface ProgressUpdate {
  current_file: number;
  total_files: number;
  percentage: number;
  filename: string;
  phase: string;
}

interface LogEntry {
  ip: string;
  timestamp: string;
  method: string;
  path: string;
  position: number | null;
  clicks: number | null;
  ctr: number | null;
  impressions: number | null;
  gsc_url: string | null;
  status: number;
  user_agent: string;
  referer: string | null;
  response_size: number;
  country: string | null;
  crawler_type: string;
  is_crawler: boolean;
  file_type: string;
  browser: string;
  verified: boolean;
  segment: string;
  segment_match: string | null;
  taxonomy: string | null;
  filename: string;
}

interface LogAnalysisResult {
  message: string;
  line_count: number;
  unique_ips: number;
  unique_user_agents: number;
  crawler_count: number;
  success_rate: number;
  totals: Record<string, number>;
  log_start_time: string;
  log_finish_time: string;
  file_count: number;
  segmentations: Array<Record<string, unknown>>;
  segment_summary: Record<string, unknown>;
}

interface LogResult {
  overview: LogAnalysisResult;
  entries: LogEntry[];
}

export default function Page() {
  const [chartView, setChartView] = useState<"overall" | "crawlers" | "status">(
    "overall",
  );
  // progress is stored in the Zustand store (logProgress) so LogsDBprojectsManager
  // can display it without prop-drilling

  // Select only the method we need to prevent Page from re-rendering on every log chunk
  const setLogData = useLogAnalysisStore((state) => state.setLogData);
  const fetchLogsFromDb = useLogAnalysisStore((state) => state.fetchLogsFromDb);
  const setIsProcessingLogs = useLogAnalysisStore((state) => state.setIsProcessingLogs);
  const setLogProgress = useLogAnalysisStore((state) => state.setLogProgress);

  // Throttle chunk state updates — log-analysis-complete always does a full replace,
  // so intermediate chunk updates only need to fire occasionally for progress display.
  const lastChunkUpdateRef = useRef<number>(0);
  const CHUNK_THROTTLE_MS = 1500;
  // const appWindow = getCurrentWindow();

  // ALWAYS CHECK THE TAXONOMIES FROM THE LOCALSTORAGE AND SEND THEM TO THE TAURI COMMAND ON FIRST RUN
  // In your main Page component
  useEffect(() => {
    const getTaxonomies = async () => {
      try {
        const taxonomies = localStorage.getItem("taxonomies");

        if (taxonomies) {
          const parsedTaxonomies = JSON.parse(taxonomies);
          if (Array.isArray(parsedTaxonomies)) {
            const taxonomyInfo = parsedTaxonomies.flatMap((tax) =>
              tax.paths.map((pathConfig) => ({
                path: pathConfig.path || "",
                match_type: pathConfig.matchType || "contains",
                name: tax.name || "",
              })),
            );

            // Only send if we have actual taxonomies
            if (taxonomyInfo.length > 0) {
              await invoke("set_taxonomies", { newTaxonomies: taxonomyInfo });
              console.log(
                "Taxonomies loaded from localStorage and sent to backend",
              );
            }
          }
        }
      } catch (error) {
        console.error("Error loading taxonomies:", error);
      }
    };

    getTaxonomies();
  }, []);

  // FETCH THE GOOGLE'S IP AND HAVE IT READY TO BE USED BY THE BE
  useEffect(() => {
    invoke("fetch_all_bot_ranges", {}).catch((error) => {
      console.error("Error loading bot IP ranges:", error);
      toast.error("RustySEO failed to load Google's IP ranges");
    });
  }, []);

  // SHORTCUT TO CLEAR ALL THE LOGS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "c") {
        performCustomAction();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performCustomAction = () => {
    // REMOVE ALL THE LOGS FROM DB
    handleRemoveAllLogs();

    toast.message("All logs have been removed from database");
  };

  const handleRemoveAllLogs = () => {
    try {
      invoke("clear_all_log_data_command");
      // setSaveLogs(false);
      toast.success("All logs have been removed from database");
    } catch (error) {
      console.error(error);
      toast.error(error);
    }
  };

  // Listen to TAURI EVENTS STREAMING THE DATA FROM THE BACKEND
  useEffect(() => {
    let isMounted = true;
    let cleanupListeners: (() => void) | undefined;

    const setupListeners = async () => {
      try {
        const unlistenProgress = await listen<ProgressUpdate>(
          "progress-update",
          ({ payload }) => {
            if (!isMounted) return;
            setLogProgress({
              value: payload.percentage ?? 0,
              status: `Log ${payload.current_file} of ${payload.total_files} — ${payload.filename} (${payload.phase})`,
            });
          },
        );

        const unlistenChunk = await listen<LogResult>(
          "log-analysis-chunk",
          ({ payload }) => {
            if (!isMounted) return;
            // Throttle to at most once per CHUNK_THROTTLE_MS. With large datasets
            // (e.g. 21 logs × 200k lines) chunks arrive faster than the JS main
            // thread can merge and reconcile, causing the beach ball. The
            // log-analysis-complete handler does a full replace anyway, so skipping
            // intermediate chunks only reduces progress granularity, not correctness.
            const now = Date.now();
            if (now - lastChunkUpdateRef.current < CHUNK_THROTTLE_MS) return;
            lastChunkUpdateRef.current = now;
            if (payload.entries?.length || payload.overview) {
              // Strip the same large unused fields as the complete handler
              const { totals, ...restOverview } = (payload.overview || {}) as any;
              const {
                google_bot_page_frequencies: _gbf,
                bing_bot_page_frequencies: _bbf,
                openai_bot_page_frequencies: _obf,
                claude_bot_page_frequencies: _cbf,
                google_bot_pages: _gbp,
                bing_bot_pages: _bbp,
                openai_bot_pages: _obp,
                claude_bot_pages: _cbp,
                bot_stats: _bs,
                ...restTotals
              } = totals || {};
              setLogData({
                entries: payload.entries || [],
                overview: { ...restOverview, totals: restTotals },
              });
            }
          },
        );

        const unlistenComplete = await listen<LogResult>(
          "log-analysis-complete",
          async ({ payload }) => {
            if (!isMounted) return;
            if (payload.overview) {
              // Strip large fields no UI component reads from the store.
              // bot_stats.page_frequencies, *_bot_page_frequencies, and *_bot_pages
              // can contain millions of URL entries and are never read from Zustand —
              // WidgetTables use fetchBotPathsAggregated (DB query) instead.
              // Keeping them in state causes immer/React to churn on huge objects.
              const { totals, ...restOverview } = payload.overview as any;
              const {
                google_bot_page_frequencies: _gbf,
                bing_bot_page_frequencies: _bbf,
                openai_bot_page_frequencies: _obf,
                claude_bot_page_frequencies: _cbf,
                google_bot_pages: _gbp,
                bing_bot_pages: _bbp,
                openai_bot_pages: _obp,
                claude_bot_pages: _cbp,
                bot_stats: _bs,
                ...restTotals
              } = totals || {};
              const slimOverview = { ...restOverview, totals: restTotals };
              // setLogData already updates state.totalCount internally — no
              // separate setTotalCount call needed (that would flush a second
              // React reconciliation for every subscriber unnecessarily).
              setLogData({ overview: slimOverview }, "replace");

              // Update the latest batch in the history with the line count
              if (payload.overview.line_count) {
                const logs = useServerLogsStore.getState().uploadedLogFiles;
                if (logs.length > 0) {
                  const latestLog = logs[logs.length - 1];
                  useServerLogsStore.getState().updateLogEntry(latestLog.time, {
                    lineCount: payload.overview.line_count,
                  });
                }
              }

              const defaultFilters = {
                search_term: "",
                status_filter: [],
                method_filter: [],
                file_type_filter: [],
                bot_filter: null,
                bot_type_filter: null,
                verified_filter: null,
                sort_key: "timestamp",
                sort_dir: "ascending",
              };

              // Fetch first page BEFORE releasing the processing lock.
              // setLogData("replace") sets totalCount = overview.line_count (this
              // batch only), but fetchLogsFromDb sets totalCount = DB row count
              // (cumulative across all appended batches). If those two values differ
              // (e.g. on a second append of the same project, N vs 2N), the second
              // totalCount change would fire the useEffect in log-analyzer again
              // AFTER isProcessingLogs is false, bypassing the justFinishedProcessing
              // guard and scheduling redundant fetchLogsFromDb + fetchWidgetAggregations
              // calls that pile up on DB_CONN and freeze the UI.
              // Keeping isProcessingLogs=true until AFTER the DB fetch means both
              // totalCount changes happen while the guard blocks the effect, and the
              // single true→false transition at the end is the only trigger.
              await fetchLogsFromDb(1, 100, defaultFilters);
              if (isMounted) setIsProcessingLogs(false);
            }
          },
        );

        // Fires when the background aggregation rebuild (GROUP BY tables) finishes.
        // At this point widget tables AND timeline aggregation tables have data.
        const unlistenAggReady = await listen(
          "log-aggregations-ready",
          async () => {
            if (!isMounted) return;
            const defaultFilters = {
              search_term: "",
              status_filter: [],
              method_filter: [],
              file_type_filter: [],
              bot_filter: null,
              bot_type_filter: null,
              verified_filter: null,
              sort_key: "timestamp",
              sort_dir: "ascending",
            };
            const store = useLogAnalysisStore.getState();
            await store.fetchWidgetAggregations(defaultFilters);
            store.bumpChartRefreshToken();
          },
        );

        cleanupListeners = () => {
          unlistenProgress();
          unlistenChunk();
          unlistenComplete();
          unlistenAggReady();
        };
      } catch (error) {
        console.error("Listener error:", error);
      }
    };

    setupListeners();

    return () => {
      isMounted = false;
      cleanupListeners?.();
    };
  }, [setLogData, fetchLogsFromDb, setIsProcessingLogs, setLogProgress]);

  // useEffect(() => {
  //   if (window) {
  //     window?.addEventListener("beforeunload", () => {
  //       console.log("App closing");
  //       localStorage.removeItem("GscExcel");
  //       appWindow.close();
  //     });
  //   }
  // }, []);

  // HANDLE REMOVING THE LOCALSTORAGE EXCEL WHEN THE COMPONENT MOUNTS
  useEffect(() => {
    if (localStorage.getItem("GscExcel")) {
      localStorage.removeItem("GscExcel");
    }
  }, []);

  const resetAll = useLogAnalysisStore((state) => state.resetAll);

  return (
    <section className="flex flex-col dark:bg-brand-darker  w-[100%] pt-[4rem] h-[calc(100vh - 20-rem)] overflow-hidden  ">
      <UploadButton />

      <InputZone handleDomainCrawl={""} />
      <main className="pb-[6.2rem] overflow-hidden h-[100%] relative">
        <div className="flex flex-1 h-full w-full ">
          <div className="w-1/2 relative bg-white dark:bg-slate-950 border-r dark:border-brand-dark h-64">
            <div className="absolute right-52 mt-3 z-40">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex p-1.5 items-center justify-center bg-gray-100/80 dark:bg-slate-800/80 rounded-full border dark:border-brand-dark backdrop-blur-sm shadow-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">
                    <MoreVertical className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-40 bg-white dark:bg-slate-900 dark:border-brand-dark rounded-xl shadow-2xl border border-gray-100 p-1.5"
                >
                  <DropdownMenuItem
                    onClick={() => setChartView("overall")}
                    className={`text-[9px] uppercase tracking-wider font-black cursor-pointer transition-all px-3 py-2 rounded-lg mb-0.5 ${
                      chartView === "overall"
                        ? "bg-brand-bright text-white shadow-md focus:bg-brand-bright focus:text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                    }`}
                  >
                    Overall Traffic
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setChartView("crawlers")}
                    className={`text-[9px] uppercase tracking-wider font-black cursor-pointer transition-all px-3 py-2 rounded-lg mb-0.5 ${
                      chartView === "crawlers"
                        ? "bg-brand-bright text-white shadow-md focus:bg-brand-bright focus:text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                    }`}
                  >
                    AI Crawlers
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setChartView("status")}
                    className={`text-[9px] uppercase tracking-wider font-black cursor-pointer transition-all px-3 py-2 rounded-lg ${
                      chartView === "status"
                        ? "bg-brand-bright text-white shadow-md focus:bg-brand-bright focus:text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                    }`}
                  >
                    HTTP Status
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {chartView === "overall" ? (
              <TimelineChart />
            ) : chartView === "crawlers" ? (
              <CrawlerTimelineBarChart />
            ) : (
              <StatusCodeBarChart />
            )}
          </div>
          <WidgetLogs />
        </div>
        <LogAnalyzer />
      </main>
    </section>
  );
}
