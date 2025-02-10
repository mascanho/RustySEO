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
  const [sessionCrawls, setSessionCrawls] = useState<number[]>([]);
  const [totalCrawlPages, setTotalCrawlPages] = useState<number>(0);

  const totalPages = crawlData?.length;
  const inlineJs = javascript?.inline;
  const externalJs = javascript?.external;
  const inlineCss = css?.inline;
  const externalCss = css?.external;

  const chartData = [
    { browser: "HTML", visitors: totalPages, fill: "var(--color-chrome)" },
    {
      browser: "Inline JS",
      visitors: inlineJs || 100,
      fill: "var(--color-safari)",
    },
    {
      browser: "External JS",
      visitors: externalJs || 100,
      fill: "hsl(610, 100%, 50%)",
    },
    {
      browser: "Inline CSS",
      visitors: inlineCss || 100,
      fill: "var(--color-firefox)",
    },
    {
      browser: "External CSS",
      visitors: externalCss || 100,
      fill: "hsl(210, 100%, 50%)",
    },
  ];

  useEffect(() => {
    const crawls = sessionStorage.getItem("crawlNumber");
    console.log("Crawls", crawls);
    setSessionCrawls(crawls);

    const crawledPages = JSON.parse(sessionStorage.getItem("CrawledLinks"));

    setTotalCrawlPages(crawledPages);
  }, [domainCrawlLoading]);

  console.log("Total crawl pages", totalCrawlPages);

  const totalPagesCrawledInSession = totalCrawlPages?.reduce((acc, item) => {
    return acc + item;
  }, 0);

  return (
    <Card className="flex flex-col dark:bg-brand-darker bg-white border-0 shadow-none">
      <CardHeader className="items-center pb-0">
        <CardTitle>Latest Crawl</CardTitle>
        <CardDescription>{`${new Date().toLocaleString("default", { month: "long", day: "numeric" })} ${new Date().getFullYear()}`}</CardDescription>
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
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          style={{ color: "white" }}
                          className="text-3xl dark:fill-white text-white font-bold dark:text-white"
                        >
                          {totalPages.toLocaleString()}
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
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-xs dark:text-white/50">
        <div className="leading-none text-muted-foreground">
          This session has recorded {""}
          {sessionCrawls ? sessionCrawls : 0} crawls.
        </div>
        <div className="flex items-center gap-3 font-medium leading-none">
          With a total of {totalPagesCrawledInSession} pages analyzed
          <TrendingUp className="h-5 w-4" />
        </div>
      </CardFooter>
    </Card>
  );
}
export default OverviewChart;
