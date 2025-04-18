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
        // Format as YYYY-MM-DD for daily view
        key = date.toISOString().split("T")[0];
      } else {
        // Format as YYYY-MM-DDTHH:00 for hourly view
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

    // Convert the map to an array of objects sorted by date
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
    let daysToSubtract = 7; // Default to 7 days

    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "90d") {
      daysToSubtract = 90;
    }

    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  // Custom tooltip component
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
        <div className="bg-background p-4 border rounded-lg shadow-sm">
          <p className="font-medium">{formattedDate}</p>
          <div className="grid gap-1">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: COLORS.human }}
              />
              <span className="text-sm">Human: {payload[1].value}</span>
            </div>
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: COLORS.crawler }}
              />
              <span className="text-sm">Crawler: {payload[0].value}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // X-axis tick formatting based on view mode
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Traffic Overview</CardTitle>
          <CardDescription>
            {viewMode === "daily" ? "Daily" : "Hourly"} human vs crawler traffic
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => setViewMode(value as "daily" | "hourly")}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="daily">Day</ToggleGroupItem>
            <ToggleGroupItem value="hourly">Hour</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <AreaChart
            width={800}
            height={250}
            data={filteredData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorHuman" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.human} stopOpacity={0.8} />
                <stop offset="95%" stopColor={COLORS.human} stopOpacity={0.1} />
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
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={xAxisTickFormatter}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={viewMode === "hourly" ? 4 : 32}
            />
            <YAxis tickLine={false} axisLine={false} width={30} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span className="text-sm">
                  {value === "human" ? "Human" : "Crawler"}
                </span>
              )}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone"
              dataKey="crawler"
              stackId="1"
              stroke={COLORS.crawler}
              fill="url(#colorCrawler)"
            />
            <Area
              type="monotone"
              dataKey="human"
              stackId="1"
              stroke={COLORS.human}
              fill="url(#colorHuman)"
            />
          </AreaChart>
        </div>
      </CardContent>
    </Card>
  );
}
