"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useLogAnalysis } from "@/store/ServerLogsStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const COLORS = {
  human: "hsl(var(--primary))",
  crawler: "hsl(var(--destructive))",
};

export function TimelineChart() {
  const [timeRange, setTimeRange] = React.useState("7d");
  const [viewMode, setViewMode] = React.useState<"daily" | "hourly">("daily");
  const { entries } = useLogAnalysis();

  // Process the log entries to create chart data
  const processData = () => {
    const dateMap = new Map<string, { human: number; crawler: number }>();

    entries.forEach((entry) => {
      const date = new Date(entry.timestamp);
      let key: string;

      if (viewMode === "daily") {
        key = date.toISOString().split("T")[0];
      } else {
        const hour = date.getHours();
        key = `${date.toISOString().split("T")[0]}T${hour.toString().padStart(2, "0")}:00`;
      }

      if (!dateMap.has(key)) {
        dateMap.set(key, { human: 0, crawler: 0 });
      }

      const counts = dateMap.get(key)!;
      if (entry.is_crawler) {
        counts.crawler += 1;
      } else {
        counts.human += 1;
      }
    });

    return Array.from(dateMap.entries())
      .map(([date, counts]) => ({
        date,
        human: counts.human,
        crawler: counts.crawler,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const chartData = processData();

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date();
    let daysToSubtract = 7;

    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "90d") {
      daysToSubtract = 90;
    }

    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

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
        <div className="bg-background dark:bg-gray-900 p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-sm">{formattedDate}</p>
          <div className="grid gap-1 mt-1">
            <div className="flex items-center">
              <div
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: COLORS.human }}
              />
              <span className="text-xs">Human: {payload[1].value}</span>
            </div>
            <div className="flex items-center">
              <div
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: COLORS.crawler }}
              />
              <span className="text-xs">Crawler: {payload[0].value}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

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

  return (
    <Card className="relative w-full h-64 rounded-none">
      {/* Absolute positioned controls */}
      <div className="absolute top-2 right-4 flex items-center gap-2 z-10">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => setViewMode(value as "daily" | "hourly")}
          variant="outline"
          size="sm"
          className="h-8"
        >
          <ToggleGroupItem value="daily" className="text-xs px-2 h-6">
            Day
          </ToggleGroupItem>
          <ToggleGroupItem value="hourly" className="text-xs px-2 h-6">
            Hour
          </ToggleGroupItem>
        </ToggleGroup>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[100px] h-6 text-xs">
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent>
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

      <CardContent className="pt-4 w-full">
        <div className="h-[258px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorHuman" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={COLORS.human}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={COLORS.human}
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="colorCrawler" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={COLORS.crawler}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={COLORS.crawler}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
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
                minTickGap={viewMode === "hourly" ? 4 : 32}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={30}
                tick={{ fontSize: 9 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "hsl(var(--border))",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
                wrapperStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "4px",
                }}
              />
              <Legend
                formatter={(value) => (
                  <div className="bg-white/50 inline-block dark:bg-slate-800/50">
                    <span className="text-xs flex">
                      {value === "human" ? "Human" : "Crawler"}
                    </span>
                  </div>
                )}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: "10px",
                  position: "absolute",
                  top: 0,
                  padding: "0 0 0 6px",
                  left: 50,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "auto",
                  height: "20px",
                  border: "1px solid hsl(var(--border))",
                  width: "140px",
                  borderRadius: "20px",
                  backgroundColor: "hsl(var(--card))",
                }}
              />
              <Area
                type="monotone"
                dataKey="crawler"
                stackId="1"
                stroke={COLORS.crawler}
                strokeWidth={2}
                fill="url(#colorCrawler)"
                fillOpacity={0.8}
              />
              <Area
                type="monotone"
                dataKey="human"
                stackId="1"
                stroke={COLORS.human}
                strokeWidth={2}
                fill="url(#colorHuman)"
                fillOpacity={0.8}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
