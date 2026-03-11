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
import { useEffect, useState } from "react";
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

export default function Page() {
  const [chartView, setChartView] = useState<"overall" | "crawlers" | "status">(
    "overall",
  );

  // Select only the method we need to prevent Page from re-rendering on every log chunk
  const setLogData = useLogAnalysisStore((state) => state.setLogData);
  const fetchLogsFromDb = useLogAnalysisStore((state) => state.fetchLogsFromDb);
  const setTotalCount = useLogAnalysisStore((state) => state.setTotalCount);
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
    try {
      // Fetch all IP ranges to verify IPs from Google, OpenAI and BING
      invoke("fetch_all_bot_ranges", {});
    } catch (error) {
      console.error("Error loading taxonomies:", error);
      toast.error("RustySEO failed to load Google's IP ranges");
    }
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

    const setupListeners = async () => {
      try {
        //TODO: IMPLEMENT A LOADER HERE
        const unlistenProgress = await listen<ProgressUpdate>(
          "progress-update",
          ({ payload }) => isMounted && setProgress(payload),
        );

        const unlistenChunk = await listen<LogResult>(
          "log-analysis-chunk",
          ({ payload }) => {
            if (!isMounted) return;
            // Single setLogData call per chunk — avoids 2x state updates + re-renders
            if (payload.entries?.length || payload.overview) {
              setLogData({
                entries: payload.entries || [],
                overview: payload.overview || {},
              });
            }
          },
        );

        const unlistenComplete = await listen<LogResult>(
          "log-analysis-complete",
          async ({ payload }) => {
            if (!isMounted) return;
            console.log("Analysis complete", payload);
            if (payload.overview) {
              setLogData({ overview: payload.overview }, "replace");
              setTotalCount(payload.overview.line_count || 0);

              // Update the latest batch in the history with the line count
              if (payload.overview.line_count) {
                const logs = useServerLogsStore.getState().uploadedLogFiles;
                if (logs.length > 0) {
                  const latestLog = logs[logs.length - 1];
                  useServerLogsStore
                    .getState()
                    .updateLogEntry(latestLog.time, {
                      lineCount: payload.overview.line_count,
                    });
                }
              }

              // Fetch first page of logs from DB
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
              await fetchLogsFromDb(1, 100, defaultFilters);
              await useLogAnalysisStore.getState().fetchWidgetAggregations(defaultFilters);
            }
          },
          // TODO: DO SOMETHIG HERE ON COMPLETE - A LOADER MAYBE
        );

        return () => {
          unlistenProgress();
          unlistenChunk();
          unlistenComplete();
        };
      } catch (error) {
        console.error("Listener error:", error);
      }
    };

    setupListeners();

    return () => {
      isMounted = false;
    };
  }, [setLogData, fetchLogsFromDb, setTotalCount]);

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

  // CLEAR THE TABLE FROM THE LOGS IN THE DB
  useEffect(() => {
    async function clearDB() {
      try {
        await invoke("clear_all_log_data_command");
        resetAll();
      } catch (error) {
        console.error("Failed to clear database:", error);
      }
    }

    clearDB();
  }, [resetAll]);

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
                    className={`text-[9px] uppercase tracking-wider font-black cursor-pointer transition-all px-3 py-2 rounded-lg mb-0.5 ${chartView === "overall"
                      ? "bg-brand-bright text-white shadow-md focus:bg-brand-bright focus:text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                      }`}
                  >
                    Overall Traffic
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setChartView("crawlers")}
                    className={`text-[9px] uppercase tracking-wider font-black cursor-pointer transition-all px-3 py-2 rounded-lg mb-0.5 ${chartView === "crawlers"
                      ? "bg-brand-bright text-white shadow-md focus:bg-brand-bright focus:text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 focus:bg-gray-100 dark:focus:bg-slate-800"
                      }`}
                  >
                    AI Crawlers
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setChartView("status")}
                    className={`text-[9px] uppercase tracking-wider font-black cursor-pointer transition-all px-3 py-2 rounded-lg ${chartView === "status"
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
