// @ts-nocheck
"use client";

import * as React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
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
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart";

const chartConfig = {
    success: {
        label: "Success (2xx)",
        color: "#22c55e",
    },
    redirect: {
        label: "Redirect (3xx)",
        color: "#3b82f6",
    },
    clientError: {
        label: "Client Error (4xx)",
        color: "#f59e0b",
    },
    serverError: {
        label: "Server Error (5xx)",
        color: "#ef4444",
    },
} satisfies ChartConfig;

export function StatusCodeBarChart() {
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
                    success: 0,
                    redirect: 0,
                    clientError: 0,
                    serverError: 0,
                });
            }

            const counts = dateMap.get(key);
            const status = entry.status;

            if (status >= 200 && status < 300) {
                counts.success += 1;
            } else if (status >= 300 && status < 400) {
                counts.redirect += 1;
            } else if (status >= 400 && status < 500) {
                counts.clientError += 1;
            } else if (status >= 500 && status < 600) {
                counts.serverError += 1;
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

    return (
        <Card className="relative w-full ml-0 h-64 rounded-none dark:border-brand-dark border-r-0 bg-transparent shadow-none pr-2">
            <div className="absolute top-2 right-4 flex items-center gap-2 z-10 transition-all duration-300">
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
                        className="text-[9px] px-2 h-6 dark:bg-slate-950"
                    >
                        Day
                    </ToggleGroupItem>
                    <ToggleGroupItem
                        value="hourly"
                        className="text-[9px] px-2 h-6 dark:bg-slate-950"
                    >
                        Hour
                    </ToggleGroupItem>
                </ToggleGroup>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[100px] h-6 text-[9px] dark:bg-slate-950 dark:border-brand-dark">
                        <SelectValue placeholder="Range" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-950 dark:border-brand-dark">
                        <SelectItem value="all" className="text-[9px]">
                            All time
                        </SelectItem>
                        <SelectItem value="7d" className="text-[9px]">
                            Last 7 days
                        </SelectItem>
                        <SelectItem value="30d" className="text-[9px]">
                            Last 30 days
                        </SelectItem>
                        <SelectItem value="90d" className="text-[9px]">
                            Last 90 days
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <CardContent className="mt-0 w-full h-[255px] p-0">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
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
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(value) => {
                                        const date = new Date(value);
                                        return viewMode === "daily"
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
                                    }}
                                />
                            }
                            cursor={false}
                        />
                        <ChartLegend
                            content={<ChartLegendContent />}
                            verticalAlign="top"
                            wrapperStyle={{
                                fontSize: "10px",
                                position: "absolute",
                                top: 14,
                                left: -3,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "20px",
                                // border: "1px solid hsl(var(--border))",
                                width: "260px",
                                borderRadius: "20px",
                                backgroundColor: "hsl(var(--card))",
                                padding: "0 6px",
                            }}
                        />
                        <Bar
                            dataKey="success"
                            stackId="a"
                            fill="var(--color-success)"
                            activeBar={{ fillOpacity: 0.8 }}
                        />
                        <Bar
                            dataKey="redirect"
                            stackId="a"
                            fill="var(--color-redirect)"
                            activeBar={{ fillOpacity: 0.8 }}
                        />
                        <Bar
                            dataKey="clientError"
                            stackId="a"
                            fill="var(--color-clientError)"
                            activeBar={{ fillOpacity: 0.8 }}
                        />
                        <Bar
                            dataKey="serverError"
                            stackId="a"
                            fill="var(--color-serverError)"
                            radius={[2, 2, 0, 0]}
                            activeBar={{ fillOpacity: 0.8 }}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
