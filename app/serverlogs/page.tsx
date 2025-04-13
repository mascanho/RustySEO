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
import WidgetLogs from "./_components/WidgetLogs";

interface CrawlResult {
  url: string;
  title: string;
  h1: string;
  file_type: string;
}

export default function Page() {
  return (
    <section className="flex flex-col dark:bg-brand-darker   w-[100%] pt-[4rem] h-[calc(100vh - 20-rem)] overflow-hidden  ">
      <InputZone handleDomainCrawl={""} />
      <main className="pb-[6.2rem] overflow-auto">
        <div className="flex">
          <TimelineChart />
          <WidgetLogs />
        </div>
        <LogAnalyzer />
      </main>
    </section>
  );
}
