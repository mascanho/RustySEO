// @ts-nocheck
"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useLogAnalysis } from "@/store/ServerLogsStore";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCurrentLogs } from "@/store/logFilterStore";

const COLORS = {
  google: "#2B6CC4",
  bing: "#00a1f1",
  openai: "#10a37f",
  claude: "#d97757",
  other: "#94a3b8",
};

export function CrawlerTimelineBarChart() {
  const [timeRange, setTimeRange] = React.useState("all");
  const [viewMode, setViewMode] = React.useState<"daily" | "hourly">("hourly");
  const { entries } = useLogAnalysis();
  const { currentLogs } = useCurrentLogs();

  const processData = () => {
    if (!entries || entries.length === 0) return [];

    const dateMap = new Map<string, any>();
    const allDates: Date[] = [];

    const logsToProcess =
      currentLogs && currentLogs.length > 0 ? currentLogs : entries;

    logsToProcess.forEach((entry) => {
      // Only process entries that are crawlers according to our logic
      if (
        !entry.is_crawler &&
        (!entry.crawler_type || entry.crawler_type === "Human")
      )
        return;

      const date = new Date(entry.timestamp);
      allDates.push(date);

      let key: string;
      if (viewMode === "daily") {
        key = date.toISOString().split("T")[0];
      } else {
        const hour = date.getHours();
        key = `${date.toISOString().split("T")[0]}T${hour.toString().padStart(2, "0")}:00`;
      }

      if (!dateMap.has(key)) {
        dateMap.set(key, {
          date: key,
          google: 0,
          bing: 0,
          openai: 0,
          claude: 0,
          other: 0,
        });
      }

      const counts = dateMap.get(key);
      const crawlerType = (entry.crawler_type || "").toLowerCase();
      const ua = (entry.user_agent || "").toLowerCase();

      if (crawlerType.includes("google")) {
        counts.google += 1;
      } else if (crawlerType.includes("bing")) {
        counts.bing += 1;
      } else if (
        crawlerType.includes("openai") ||
        crawlerType.includes("gpt") ||
        ua.includes("chatgpt") ||
        ua.includes("gptbot") ||
        ua.includes("oai-")
      ) {
        counts.openai += 1;
      } else if (crawlerType.includes("claude") || ua.includes("claude")) {
        counts.claude += 1;
      } else {
        counts.other += 1;
      }
    });

    if (allDates.length === 0) return [];

    allDates.sort((a, b) => a.getTime() - b.getTime());
    const minDate = allDates[0];
    const maxDate = allDates[allDates.length - 1];

    let startDate = new Date(minDate);
    const endDate = new Date(maxDate);

    if (timeRange === "7d") {
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === "30d") {
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeRange === "90d") {
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 90);
    }

    return Array.from(dateMap.values())
      .filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const chartData = processData();

  const xAxisTickFormatter = (value: string) => {
    const date = new Date(value);
    if (viewMode === "daily") {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } else {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
      });
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedDate =
        viewMode === "daily"
          ? date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : date.toLocaleTimeString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            });

      return (
        <div className="bg-white dark:bg-slate-900 p-3 border dark:border-brand-dark rounded-lg shadow-lg">
          <p className="font-medium text-xs mb-2  ">{formattedDate}</p>
          <div className="grid gap-1">
            {payload.map((entry: any) => (
              <div
                key={entry.dataKey}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center">
                  <div
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: entry.fill }}
                  />
                  <span className="text-xs capitalize">{entry.name}:</span>
                </div>
                <span className="text-xs font-bold">{entry.value}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1 flex items-center justify-between gap-4">
              <span className="text-xs font-medium">Total:</span>
              <span className="text-xs font-bold">
                {payload.reduce(
                  (sum: number, entry: any) => sum + entry.value,
                  0,
                )}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="relative w-full h-64 rounded-none dark:border-brand-dark border-r-0 overflow-hidden">
      <div className="absolute top-2 right-4 flex items-center gap-2 z-10">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) =>
            value && setViewMode(value as "daily" | "hourly")
          }
          variant="outline"
          size="sm"
          className="h-8 z-0"
        >
          <ToggleGroupItem
            value="daily"
            className="text-xs px-2 h-6 dark:bg-slate-950"
          >
            Day
          </ToggleGroupItem>
          <ToggleGroupItem
            value="hourly"
            className="text-xs px-2 h-6 dark:bg-slate-950"
          >
            Hour
          </ToggleGroupItem>
        </ToggleGroup>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[100px] h-6 text-xs dark:bg-slate-950 dark:border-brand-dark">
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent className="dark:bg-slate-950 dark:border-brand-dark">
            <SelectItem value="all" className="text-xs">
              All time
            </SelectItem>
            <SelectItem value="7d" className="text-xs">
              Last 7 days
            </SelectItem>
            <SelectItem value="30d" className="text-xs">
              Last 30 days
            </SelectItem>
            <SelectItem value="90d" className="text-xs">
              Last 90 days
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CardContent className="mt-4 w-full h-[270px] ">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="date"
              tickFormatter={xAxisTickFormatter}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9 }}
              tickMargin={8}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={26}
              tick={{ fontSize: 8 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                fontSize: "10px",
                paddingTop: "10px",
              }}
              style={{ fontSize: "10px", position: "fixed", top: 0, right: 0 }}
              className="absolute top-0 mt-20"
            />
            <Bar
              dataKey="google"
              name="Google"
              stackId="a"
              fill={COLORS.google}
              activeBar={{
                fillOpacity: 0.8,
                stroke: COLORS.google,
                strokeWidth: 1,
              }}
            />
            <Bar
              dataKey="bing"
              name="Bing"
              stackId="a"
              fill={COLORS.bing}
              activeBar={{
                fillOpacity: 0.8,
                stroke: COLORS.bing,
                strokeWidth: 1,
              }}
            />
            <Bar
              dataKey="openai"
              name="OpenAI"
              stackId="a"
              fill={COLORS.openai}
              activeBar={{
                fillOpacity: 0.8,
                stroke: COLORS.openai,
                strokeWidth: 1,
              }}
            />
            <Bar
              dataKey="claude"
              name="Claude"
              stackId="a"
              fill={COLORS.claude}
              activeBar={{
                fillOpacity: 0.8,
                stroke: COLORS.claude,
                strokeWidth: 1,
              }}
            />
            <Bar
              dataKey="other"
              name="Other Bots"
              stackId="a"
              fill={COLORS.other}
              radius={[2, 2, 0, 0]}
              activeBar={{
                fillOpacity: 0.8,
                stroke: COLORS.other,
                strokeWidth: 1,
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
