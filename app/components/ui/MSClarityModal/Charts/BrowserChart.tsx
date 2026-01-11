// @ts-nocheck
"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  chrome: {
    label: "Chrome",
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

interface BrowserChartProps {
  data: Array<{
    name: string;
    sessions: number;
  }>;
}

export function BrowserChart({ data }: BrowserChartProps) {
  const totalSessions = React.useMemo(() => {
    if (!data) return 0;
    return data.reduce((acc, curr) => acc + curr.sessions, 0);
  }, [data]);

  const processedData = React.useMemo(() => {
    if (!data) return [];
    return data.map((item) => ({
      browser: item.name,
      visitors: item.sessions,
      fill: `var(--color-${item.name.toLowerCase()})` || "var(--color-other)",
    }));
  }, [data]);

  const dynamicConfig = React.useMemo(() => {
    const config = { ...chartConfig };
    data?.forEach((item, idx) => {
      const name = item.name.toLowerCase();
      if (!config[name]) {
        config[name] = {
          label: item.name,
          color: `hsl(215, 75%, ${50 + (idx % 3) * 10}%)`, // Varied shades of blue
        };
      }
    });
    return config;
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic">
        No browser data available
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <ChartContainer
        config={dynamicConfig}
        className="mx-auto aspect-square w-full max-w-[280px]"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={processedData}
            dataKey="visitors"
            nameKey="browser"
            innerRadius={65}
            strokeWidth={0}
            paddingAngle={2}
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
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-slate-900 dark:fill-white text-2xl font-black tracking-tighter"
                      >
                        {totalSessions.toLocaleString()}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 18}
                        className="fill-slate-400 dark:fill-slate-500 text-[10px] font-bold uppercase tracking-tight"
                      >
                        Total Sessions
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
    </div>
  );
}
