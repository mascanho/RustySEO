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

export const description = "An interactive line chart";

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
    color: "hsl(var(--chart-6))",
  },
  tbt: {
    label: "TBT",
    color: "hsl(var(--chart-7))",
  },
  dom: {
    label: "DOM",
    color: "hsl(var(--chart-8))",
  },
} satisfies ChartConfig;

export function TechnicalChart({ dbdata }: any) {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("performance");

  console.log(dbdata, "DATA");

  const chartData = dbdata.map((data: any) => {
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
  });

  const total = React.useMemo(
    () => ({
      performance: chartData.reduce((acc, curr) => acc + curr.performance, 0),
      speed: chartData.reduce((acc, curr) => acc + curr.speed, 0),
      fcp: chartData.reduce((acc, curr) => acc + curr.fcp, 0),
      lcp: chartData.reduce((acc, curr) => acc + curr.lcp, 0),
      tti: chartData.reduce((acc, curr) => acc + curr.tti, 0),
      cls: chartData.reduce((acc, curr) => acc + curr.cls, 0),
      tbt: chartData.reduce((acc, curr) => acc + curr.tbt, 0),
      dom: chartData.reduce((acc, curr) => acc + curr.dom, 0),
    }),
    [],
  );

  return (
    <Card className="dark:bg-brand-darker">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b dark:border-brand-darker p-0 sm:flex-row dark:bg-brand-darker">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6 ">
          <CardTitle>Line Chart - Interactive</CardTitle>
          <CardDescription>
            Showing metrics for the last 3 months
          </CardDescription>
        </div>
        <div id="chart-buttons" className="flex flex-wrap">
          {Object.keys(chartConfig).map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-brand-darker/5 sm:border-l sm:border-t-0 sm:px-8 sm:py-6 dark:bg-brand-darker dark:border-brand-dark "
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground dark:text-white">
                  {chartConfig[chart].label}
                </span>
                <span className="text-sm font-bold leading-none ">
                  {total[chart].toLocaleString()}
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
