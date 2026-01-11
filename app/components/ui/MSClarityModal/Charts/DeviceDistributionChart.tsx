"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
} satisfies ChartConfig;

export function DeviceDistributionChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic">
        No device data available
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ChartContainer config={chartConfig} className="max-h-[180px] w-full">
        <BarChart
          accessibilityLayer
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey="name"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            className="text-[10px] font-bold uppercase tracking-wider fill-muted-foreground"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            className="text-[10px] font-bold fill-muted-foreground"
          />
          <ChartTooltip
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar
            dataKey="sessions"
            fill="#2B6CC4"
            radius={[4, 4, 0, 0]}
            barSize={40}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
