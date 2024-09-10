// @ts-nocheck
"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import FcpEl from "../../Fcp";

export const description = "Technical / Performance Averages";

const chartConfig = {
  performance: {
    label: "Performance",
    color: "hsl(var(--chart-1))",
  },
  speed: {
    label: "Speed",
    color: "hsl(var(--chart-2))",
  },
  fcp: {
    label: "FCP",
    color: "hsl(var(--chart-3))",
  },
  lcp: {
    label: "LCP",
    color: "hsl(var(--chart-4))",
  },
  tti: {
    label: "TTI",
    color: "hsl(var(--chart-5))",
  },
  cls: {
    label: "CLS",
    color: "hsl(var(--chart-3))",
  },
  tbt: {
    label: "TBT",
    color: "hsl(var(--chart-4))",
  },
  dom: {
    label: "DOM",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function TechnicalChart({ dbdata }: any) {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("performance");

  console.log(dbdata, "DATA");

  const chartData = React.useMemo(() => {
    return Array.isArray(dbdata)
      ? dbdata.map((data: any) => {
          return {
            date: data.date,
            performance: data.performance,
            speed: data.speed_index,
            fcp: data.fcp,
            lcp: data.lcp,
            tti: data.tti,
            cls: data.cls,
            tbt: data.tbt,
            dom: data.dom_size,
          };
        })
      : [];
  }, [dbdata]);

  const averages = React.useMemo(() => {
    const initialAverages = {
      performance: 0,
      speed: 0,
      fcp: 0,
      lcp: 0,
      tti: 0,
      cls: 0,
      tbt: 0,
      dom: 0,
    };

    if (chartData.length === 0) {
      return initialAverages;
    }

    const sums = chartData.reduce(
      (acc, curr) => {
        Object.keys(initialAverages).forEach((key) => {
          acc[key] += curr[key] || 0;
        });
        return acc;
      },
      { ...initialAverages },
    );

    Object.keys(sums).forEach((key) => {
      sums[key] = sums[key] / chartData.length;
    });

    return sums;
  }, [chartData]);

  return (
    <Card className="dark:bg-brand-darker dark:border-brand-dark">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b dark:border-brand-dark p-0 sm:flex-row dark:bg-brand-darker">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-2 sm:py-3 ">
          <CardTitle>Core Web Vitals</CardTitle>
          <CardDescription>
            Showing the averages for the pages you crawled
          </CardDescription>
        </div>
        <div id="chart-buttons" className="flex flex-wrap">
          {Object.keys(chartConfig).map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-2 text-left data-[active=true]:bg-brand-dark/10 data-[active=true]:dark:text-red-500 sm:border-l sm:border-l-brand-dark/10 sm:border-t-0 sm:px-8 sm:py-4 data-[active=true]:text-red-500  dark:border-brand-dark "
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground dark:text-white">
                  {chartConfig[chart].label}
                </span>
                <span className="text-sm font-bold leading-none ">
                  {averages[chart] ? averages[chart].toFixed(2) : "N/A"}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey={activeChart}
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <Line
              dataKey={activeChart}
              type="monotone"
              stroke={chartConfig[activeChart].color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
