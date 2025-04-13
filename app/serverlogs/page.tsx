// @ts-nocheck
"use client";

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

interface CrawlResult {
  url: string;
  title: string;
  h1: string;
  file_type: string;
}

export default function Page() {
  return (
    <section className="flex flex-col dark:bg-brand-darker  overflow-visible w-[100%] pt-[3rem] h-screen">
      <InputZone handleDomainCrawl={""} />
      <main className="h-screen  pb-[6.2rem] overflow-auto">
        <TimelineChart />
        <div className="flex w-full flex-1 justify-evenly bg-white">
          {/* <PieChartStatus /> */}
          {/* <PieChartStatus /> */}
          {/* <PieChartStatus /> */}
          {/* <PieChartStatus /> */}
        </div>
        <LogAnalyzer />
      </main>
    </section>
  );
}
