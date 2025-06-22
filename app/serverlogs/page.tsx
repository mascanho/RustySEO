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
  const { setLogData } = useLogAnalysis();

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
  let chunks: any[] = [];
  useEffect(() => {
    listen("log-analysis-chunk", (event) => {
      chunks.push(event.payload); // Append the chunk to a local array or process as needed
      const result = event?.payload;

      setLogData({
        entries: result?.entries || [],
        overview: result?.overview || {
          message: "",
          line_count: 0,
          unique_ips: 0,
          unique_user_agents: 0,
          crawler_count: 0,
          success_rate: 0,
          totals: {
            google: 0,
            bing: 0,
            semrush: 0,
            hrefs: 0,
            moz: 0,
            uptime: 0,
            openai: 0,
            claude: 0,
            google_bot_pages: [],
            google_bot_pages_frequency: {},
          },
          log_start_time: "",
          log_finish_time: "",
        },
      });
    });

    listen("log-analysis-complete", (event) => {
      console.log("Analysis complete:", event.payload);

      // Optionally process final result or finalize UI
      // e.g., you might want to use `chunks` to build the full log
    });
  }, []);

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
