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
import InputZone from "./_components/InputZone";
import { LogAnalyzer } from "./_components/table/log-analyzer";
import UploadButton from "./_components/UploadButton";
import WidgetLogs from "./_components/WidgetLogs";
import { toast, Toaster } from "sonner";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useLogAnalysis } from "@/store/ServerLogsStore";

interface CrawlResult {
  url: string;
  title: string;
  h1: string;
  file_type: string;
}

export default function Page() {
  const [keysPressed, setKeysPressed] = useState(new Set());
  const [shortcutActivated, setShortcutActivated] = useState(false);
  const { setLogData, logData } = useLogAnalysis();

  // ALWAYS CHECK THE TAXONOMIES FROM THE LOCALSTORAGE AND SEND THEM TO THE TAURI COMMAND ON FIRST RUN
  useEffect(() => {
    const getTaxonomies = async () => {
      try {
        const taxonomies = localStorage.getItem("taxonomies");

        if (taxonomies) {
          const parsedTaxonomies = JSON.parse(taxonomies);
          const taxonomyNames = parsedTaxonomies.map(
            (tax: { name: string }) => tax.name,
          );
          await invoke("set_taxonomies", { newTaxonomies: taxonomyNames });
        } else {
          // toast.error("No taxonomies found");
        }
      } catch (error) {
        console.error("Error loading taxonomies:", error);
        toast.error("Failed to load taxonomies");
      }
    };

    getTaxonomies();
  }, []);

  // FETCH THE GOOGLE'S IP AND HAVE IT READY TO BE USED BY THE BE
  useEffect(() => {
    try {
      invoke("fetch_google_ip_ranges", {});
    } catch (error) {
      console.error("Error loading taxonomies:", error);
      toast.error("RustySEO failed to load Google's IP ranges");
    }
  }, []);

  // SHORTCUT TO CLEAR ALL THE LOGS
  useEffect(() => {
    const handleKeyDown = (e) => {
      const newKeysPressed = new Set(keysPressed);
      newKeysPressed.add(e.key.toLowerCase());
      setKeysPressed(newKeysPressed);

      // Check for Ctrl+L+C sequence
      if (
        newKeysPressed.has("control") &&
        newKeysPressed.has("shift") &&
        newKeysPressed.has("c")
      ) {
        setShortcutActivated(true);
        // Your action here
        // Perform your specific action
        performCustomAction();
      }
    };

    const handleKeyUp = (e) => {
      const newKeysPressed = new Set(keysPressed);
      newKeysPressed.delete(e.key.toLowerCase());
      setKeysPressed(newKeysPressed);

      // Reset activation state when keys are released
      if (e.key.toLowerCase() === "c") {
        setShortcutActivated(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [keysPressed]);

  const performCustomAction = () => {
    // REMOVE ALL THE LOGS FROM DB
    handleRemoveAllLogs();

    toast.message("All logs have been removed from database");
  };

  const handleRemoveAllLogs = () => {
    try {
      invoke("remove_all_logs_from_serverlog_db", { dbName: "serverlog.db" });
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
        const unlistenProgress = await listen<ProgressUpdate>(
          "progress-update",
          ({ payload }) => isMounted && setProgress(payload),
        );

        const unlistenChunk = await listen<LogResult>(
          "log-analysis-chunk",
          ({ payload }) => {
            if (!isMounted) return;
            console.log("Received chunk", payload);
            if (payload.entries?.length) {
              setLogData({ entries: payload.entries });
            }
            if (payload.overview) {
              setLogData({ overview: payload.overview });
            }
          },
        );

        // const unlistenComplete = await listen<LogResult>(
        //   "log-analysis-complete",
        //   ({ payload }) => {
        //     if (!isMounted) return;
        //     console.log("Analysis complete", payload);
        //     if (payload.overview) {
        //       setLogData({ overview: payload.entries });
        //     }
        //   },
        // );

        return () => {
          unlistenProgress();
          unlistenChunk();
          // unlistenComplete();
        };
      } catch (error) {
        console.error("Listener error:", error);
      }
    };

    setupListeners();

    return () => {
      isMounted = false;
    };
  }, [setLogData]);

  // Debug store changes
  useEffect(() => {
    console.log("Zustand logData updated:", logData);
  }, [logData]);

  console.log(logData, "FROM OUTSIDE THE USEFFECT");

  return (
    <section className="flex flex-col dark:bg-brand-darker   w-[100%] pt-[4rem] h-[calc(100vh - 20-rem)] overflow-hidden  ">
      <UploadButton />

      <InputZone handleDomainCrawl={""} />
      <main className="pb-[6.2rem] overflow-hidden h-[100%]">
        <div className="flex flex-1 h-full w-full ">
          <TimelineChart />
          <WidgetLogs />
        </div>
        <LogAnalyzer />
      </main>
    </section>
  );
}
