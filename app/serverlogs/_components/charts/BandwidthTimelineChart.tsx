// @ts-nocheck
"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useLogAnalysisStore } from "@/store/ServerLogsStore";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

const chartConfig = {
  bytes: {
    label: "Bandwidth",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function BandwidthTimelineChart() {
  const [timeRange, setTimeRange] = React.useState("all");
  const [viewMode, setViewMode] = React.useState<"daily" | "hourly">("daily");
  const bandwidthTimelineData = useLogAnalysisStore((state) => state.bandwidthTimelineData);
  const fetchBandwidthAggregations = useLogAnalysisStore((state) => state.fetchBandwidthAggregations);
  const activeFilters = useLogAnalysisStore((state) => state.activeFilters);
  const isProcessingLogs = useLogAnalysisStore((state) => state.isProcessingLogs);
  const totalCount = useLogAnalysisStore((state) => state.totalCount);
  const chartRefreshToken = useLogAnalysisStore((state) => state.chartRefreshToken);

  const prevIsProcessingRef = React.useRef(isProcessingLogs);

  React.useEffect(() => {
    const justFinishedProcessing = prevIsProcessingRef.current === true && isProcessingLogs === false;
    prevIsProcessingRef.current = isProcessingLogs;

    if (isProcessingLogs) return;
    if (totalCount === 0) return;
    if (justFinishedProcessing) return;

    const timer = setTimeout(() => {
      fetchBandwidthAggregations(viewMode, activeFilters);
    }, 300);
    return () => clearTimeout(timer);
  }, [viewMode, activeFilters, fetchBandwidthAggregations, isProcessingLogs, totalCount, chartRefreshToken]);

  const chartData = React.useMemo(() => {
    if (!bandwidthTimelineData || bandwidthTimelineData.length === 0) return [];

    const endDate = new Date();
    let startDate = new Date(0);

    if (timeRange === "7d") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === "30d") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeRange === "90d") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
    }

    const filtered = bandwidthTimelineData.filter((item) => {
      if (timeRange === "all") return true;
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });

    if (filtered.length > 1000) {
      const bucketSize = Math.ceil(filtered.length / 1000);
      const downsampled = [];
      for (let i = 0; i < filtered.length; i += bucketSize) {
        const bucket = filtered.slice(i, i + bucketSize);
        downsampled.push({
          date: bucket[0].date,
          bytes: bucket.reduce((sum, d) => sum + (d.bytes ?? 0), 0),
        });
      }
      return downsampled;
    }
    return filtered;
  }, [bandwidthTimelineData, timeRange]);

  const xAxisTickFormatter = (value: string) => {
    const date = new Date(value);
    if (viewMode === "daily") {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
      return date.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
    }
  };

  return (
    <Card className="relative w-full ml-0 h-64 rounded-none dark:border-brand-dark border-r-0 bg-transparent shadow-none pr-2">
      <div className="absolute top-2 right-4 flex items-center gap-2 z-10 transition-all duration-300">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && setViewMode(value as "daily" | "hourly")}
          variant="outline"
          size="sm"
          className="h-8 z-0"
        >
          <ToggleGroupItem value="daily" className="text-[9px] px-2 h-6 dark:bg-slate-950">
            Day
          </ToggleGroupItem>
          <ToggleGroupItem value="hourly" className="text-[9px] px-2 h-6 dark:bg-slate-950">
            Hour
          </ToggleGroupItem>
        </ToggleGroup>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[100px] h-6 text-[9px] dark:bg-slate-950 dark:border-brand-dark">
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent className="dark:bg-slate-950 dark:border-brand-dark">
            <SelectItem value="all" className="text-[9px]">All time</SelectItem>
            <SelectItem value="7d" className="text-[9px]">Last 7 days</SelectItem>
            <SelectItem value="30d" className="text-[9px]">Last 30 days</SelectItem>
            <SelectItem value="90d" className="text-[9px]">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CardContent className="mt-0 w-full h-[255px] p-0">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBandwidth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-bytes)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-bytes)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tickFormatter={xAxisTickFormatter}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9 }}
              tickMargin={8}
              minTickGap={viewMode === "hourly" ? 4 : 32}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={36}
              tick={{ fontSize: 8 }}
              tickFormatter={(v) => formatBytes(v)}
              stroke="hsl(var(--muted-foreground))"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return viewMode === "daily"
                      ? date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
                      : date.toLocaleTimeString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "numeric", hour12: true });
                  }}
                  formatter={(value) => [formatBytes(Number(value)), "Bandwidth"]}
                />
              }
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "3 3" }}
            />
            <ChartLegend
              content={<ChartLegendContent />}
              verticalAlign="top"
              wrapperStyle={{
                fontSize: "10px",
                position: "absolute",
                top: 14,
                left: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "20px",
                width: "120px",
                borderRadius: "20px",
                backgroundColor: "hsl(var(--card))",
                padding: "0 6px",
              }}
            />
            <Area
              type="monotone"
              dataKey="bytes"
              stroke="var(--color-bytes)"
              strokeWidth={2}
              fill="url(#colorBandwidth)"
              fillOpacity={0.8}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
