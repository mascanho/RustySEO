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
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface CrawlResult {
  url: string;
  title: string;
  h1: string;
  file_type: string;
}

export default function Page() {
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

  return (
    <section className="flex flex-col dark:bg-brand-darker   w-[100%] pt-[4rem] h-[calc(100vh - 20-rem)] overflow-hidden  ">
      <UploadButton />

      <InputZone handleDomainCrawl={""} />
      <main className="pb-[6.2rem] overflow-hidden h-[100%]">
        <div className="flex flex-1 h-full ">
          <TimelineChart />
          <WidgetLogs />
        </div>
        <LogAnalyzer />
      </main>
    </section>
  );
}
