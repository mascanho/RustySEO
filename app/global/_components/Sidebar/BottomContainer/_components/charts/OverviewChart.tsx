// @ts-nocheck
"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { listen } from "@tauri-apps/api/event";

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  chrome: {
    label: "HTML",
    color: "hsl(var(--chart-1))",
  },
  safari: {
    label: "Safari",
    color: "hsl(var(--chart-2))",
  },
  firefox: {
    label: "Firefox",
    color: "hsl(var(--chart-3))",
  },
  edge: {
    label: "Edge",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

function OverviewChart() {
  const { crawlData, javascript, css, domainCrawlLoading } =
    useGlobalCrawlStore();
  const [sessionCrawls, setSessionCrawls] = useState<number>(0);
  const [totalCrawlPages, setTotalCrawlPages] = useState<number[]>([]);

  // Default values for optional data
  const totalPages = crawlData?.length || 0;
  const inlineJs = javascript?.inline || 0;
  const externalJs = javascript?.external || 0;
  const inlineCss = css?.inline || 0;
  const externalCss = css?.external || 0;

  // UPDATE THE CRAWLED PAGES IN REALTIME

  const [crawledPages, setCrawledPages] = useState<number>(0);
  const [percentageCrawled, setPercentageCrawled] = useState<number>(0);
  const [crawledPagesCount, setCrawledPagesCount] = useState<number>(0);
  useEffect(() => {
    const unlisten = listen("progress_update", (event) => {
      const progressData = event.payload as {
        crawled_urls: number;
        percentage: number;
        total_urls: number;
      };
      setCrawledPages(progressData.crawled_urls);
      setPercentageCrawled(progressData.percentage);
      setCrawledPagesCount(progressData.total_urls);
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const chartData = [
    { browser: "HTML", visitors: totalPages, fill: "hsl(210, 100%, 50%)" },
    {
      browser: "Inline JS",
      visitors: inlineJs,
      fill: "hsl(210, 100%, 60%)",
    },
    {
      browser: "External JS",
      visitors: externalJs,
      fill: "hsl(210, 100%, 70%)",
    },
    {
      browser: "Inline CSS",
      visitors: inlineCss,
      fill: "hsl(210, 100%, 80%)",
    },
    {
      browser: "External CSS",
      visitors: externalCss,
      fill: "hsl(210, 100%, 90%)",
    },
  ];

  useEffect(() => {
    try {
      // Safely read from sessionStorage
      const crawls = sessionStorage.getItem("crawlNumber");
      setSessionCrawls(crawls ? parseInt(crawls, 10) : 0);

      const crawledPages = JSON.parse(
        sessionStorage.getItem("CrawledLinks") || "[]",
      );
      setTotalCrawlPages(Array.isArray(crawledPages) ? crawledPages : []);
    } catch (error) {
      console.error("Error reading sessionStorage:", error);
      setSessionCrawls(0);
      setTotalCrawlPages([]);
    }
  }, [domainCrawlLoading, crawlData]);

  const totalPagesCrawledInSession = (() => {
    try {
      return Array.isArray(totalCrawlPages)
        ? totalCrawlPages.reduce((acc, item) => acc + (item || 0), 0)
        : 0;
    } catch (error) {
      console.error("Error calculating total pages crawled in session:", error);
      return 0;
    }
  })();

  return (
    <Card className="flex flex-col dark:bg-gray-900 bg-slate-100 border-0 shadow-none">
      <CardHeader className="items-center pb-0">
        <CardTitle>Latest Crawl</CardTitle>
        <CardDescription>{`${new Date().toLocaleString("default", {
          month: "long",
          day: "numeric",
        })} ${new Date().getFullYear()}`}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="visitors"
              nameKey="browser"
              innerRadius={60}
              strokeWidth={5}
              className="text-white"
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="dark:text-white"
                        aria-label="Total Pages"
                        role="text"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          style={{ color: "white" }}
                          className="text-3xl dark:fill-white text-white font-bold dark:text-white"
                        >
                          {crawledPages?.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground dark:fill-white/50 dark:text-white"
                        >
                          Pages
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-xs dark:text-white/50">
        <div className="leading-none text-muted-foreground">
          This session has recorded {sessionCrawls || 0} crawls.
        </div>
        <div className="flex items-center gap-3 font-medium leading-none">
          With a total of {[totalPagesCrawledInSession + crawlData.length] || 0}{" "}
          pages analyzed
          <TrendingUp className="h-5 w-4" aria-hidden="true" />
        </div>
      </CardFooter>
    </Card>
  );
}

export default OverviewChart;
