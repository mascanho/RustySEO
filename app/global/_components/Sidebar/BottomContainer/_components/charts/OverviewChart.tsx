// @ts-nocheck
"use client";
import * as React from "react";
import { useEffect, useState, useMemo, useCallback } from "react";
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
import { debounce } from "lodash";

const chartConfig = {
  crawled: {
    label: "Crawled",
    color: "hsl(210, 100%, 50%)", // Blue
  },
  failed4xx: {
    label: "4XX Errors",
    color: "hsl(210, 100%, 65%)", // Medium Blue
  },
  failed5xx: {
    label: "5XX Errors",
    color: "hsl(210, 100%, 80%)", // Light Blue
  },
  queued: {
    label: "Queued",
    color: "hsl(210, 100%, 90%)", // Very Light Blue
  },
} satisfies ChartConfig;

function OverviewChart() {
  const {
    crawlData,
    javascript,
    css,
    domainCrawlLoading,
    setStreamedTotalPages,
    setStreamedCrawledPages,
    streamedCrawledPages,
    streamedTotalPages,
  } = useGlobalCrawlStore();
  const [sessionCrawls, setSessionCrawls] = useState<number>(0);
  const [totalCrawlPages, setTotalCrawlPages] = useState<number[]>([]);
  const [failed4xxCount, setFailed4xxCount] = useState<number>(0);
  const [failed5xxCount, setFailed5xxCount] = useState<number>(0);

  // Calculate crawled and queued pages
  const crawledPages = useMemo(() => {
    return streamedCrawledPages || crawlData?.length || 0;
  }, [streamedCrawledPages, crawlData]);

  const queuedPages = useMemo(() => {
    // During crawl: total - crawled, After crawl: 0
    const total = streamedTotalPages || crawlData?.length || 0;
    const crawled = streamedCrawledPages || crawlData?.length || 0;
    return Math.max(0, total - crawled);
  }, [streamedTotalPages, streamedCrawledPages, crawlData]);

  // Debounced update function
  const debouncedUpdate = useCallback(
    debounce((crawled_urls, total_urls, failed_urls) => {
      setStreamedCrawledPages(crawled_urls);
      setStreamedTotalPages(total_urls);
      // For now, put all failed in 4xx until we get separate counts from backend
      // Backend sends total failed_urls_count, we'll split on completion
      setFailed4xxCount(failed_urls);
    }, 300),
    [setStreamedCrawledPages, setStreamedTotalPages],
  );

  // Update the crawled pages in real-time with debounce
  useEffect(() => {
    const progressUnlisten = listen("progress_update", (event) => {
      const progressData = event.payload as {
        crawled_urls: number;
        percentage: number;
        total_urls: number;
        failed_urls_count: number;
      };

      // Validate and sanitize the received data to prevent NaN
      const safeCrawledUrls = Math.max(0, progressData.crawled_urls || 0);
      const safeTotalUrls = Math.max(1, progressData.total_urls || 1);
      const safeFailedUrls = Math.max(0, progressData.failed_urls_count || 0);

      debouncedUpdate(safeCrawledUrls, safeTotalUrls, safeFailedUrls);
    });

    const completeUnlisten = listen("crawl_complete", () => {
      // Ensure chart shows completion state and sync with actual data
      setStreamedCrawledPages(crawlData.length);
      setStreamedTotalPages(crawlData.length);

      // Calculate 4XX and 5XX separately from crawlData
      const count4xx = crawlData?.filter((page) => {
        const status = page?.status_code || 0;
        return status >= 400 && status < 500;
      }).length || 0;

      const count5xx = crawlData?.filter((page) => {
        const status = page?.status_code || 0;
        return status >= 500;
      }).length || 0;

      setFailed4xxCount(count4xx);
      setFailed5xxCount(count5xx);

      console.log(
        "Crawl completed - overview chart synchronized with actual data",
      );
    });

    return () => {
      progressUnlisten.then((f) => f());
      completeUnlisten.then((f) => f());
    };
  }, [
    debouncedUpdate,
    crawlData.length,
    setStreamedCrawledPages,
    setStreamedTotalPages,
    crawlData,
  ]);

  // Memoized chart data
  const chartData = useMemo(
    () => [
      {
        browser: "Crawled",
        visitors: crawledPages,
        fill: "hsl(210, 100%, 50%)"
      },
      {
        browser: "4XX Errors",
        visitors: failed4xxCount,
        fill: "hsl(210, 100%, 65%)"
      },
      {
        browser: "5XX Errors",
        visitors: failed5xxCount,
        fill: "hsl(210, 100%, 80%)"
      },
      {
        browser: "Queued",
        visitors: queuedPages,
        fill: "hsl(210, 100%, 90%)",
      },
    ],
    [crawledPages, failed4xxCount, failed5xxCount, queuedPages],
  );

  // Memoized total pages crawled in session
  const totalPagesCrawledInSession = useMemo(() => {
    try {
      return Array.isArray(totalCrawlPages)
        ? totalCrawlPages.reduce((acc, item) => acc + (item || 0), 0)
        : 0;
    } catch (error) {
      console.error("Error calculating total pages crawled in session:", error);
      return 0;
    }
  }, [totalCrawlPages]);

  // Read sessionStorage data
  useEffect(() => {
    try {
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

  // Memoized label renderer
  const renderLabel = useCallback(
    ({ viewBox }) => {
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
              {crawlData?.length || 0}
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
    },
    [crawlData],
  );

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
              <Label content={renderLabel} />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-xs dark:text-white/50">
        <div className="leading-none text-muted-foreground">
          This session has recorded {sessionCrawls || 0} crawls.
        </div>
        <div className="flex items-center gap-3 font-medium leading-none">
          {/* WARNING: Something strange on this It is not adding up with the CSV doenload */}
          With a total of {[totalPagesCrawledInSession + crawlData.length] || 0}{" "}
          pages analyzed
          <TrendingUp className="h-5 w-4" aria-hidden="true" />
        </div>
      </CardFooter>
    </Card>
  );
}

export default OverviewChart;
