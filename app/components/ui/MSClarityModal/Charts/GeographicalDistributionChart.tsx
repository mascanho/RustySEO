"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  sessions: {
    label: "Sessions",
    color: "hsl(var(--brand-bright))",
  },
  label: {
    color: "hsl(var(--background))",
  },
} satisfies ChartConfig;

export function GeographicalDistributionChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic">
        No geographical data available
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
        <BarChart
          accessibilityLayer
          data={data}
          layout="vertical"
          margin={{
            right: 40,
            left: 10,
          }}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.1} />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            hide
          />
          <XAxis dataKey="sessions" type="number" hide />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />
          <Bar
            dataKey="sessions"
            layout="vertical"
            fill="#2B6CC4"
            radius={4}
            barSize={24}
          >
            <LabelList
              dataKey="name"
              position="insideLeft"
              offset={8}
              className="fill-white dark:fill-white font-bold text-[10px] uppercase tracking-tighter"
            />
            <LabelList
              dataKey="sessions"
              position="right"
              offset={8}
              className="fill-foreground font-mono text-[10px] font-bold"
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
