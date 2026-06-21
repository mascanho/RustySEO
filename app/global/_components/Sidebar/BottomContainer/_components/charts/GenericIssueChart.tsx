// @ts-nocheck
"use client";
import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";

const chartConfig = {
  visitors: { label: "Pages" },
  affected: { label: "Affected", color: "hsl(710, 100%, 60%)" },
  healthy: { label: "Healthy", color: "hsl(210, 100%, 70%)" },
} satisfies ChartConfig;

function GenericIssueChart() {
  const totalPages = useGlobalCrawlStore((state) => state.crawlData.length);
  const issuesData = useGlobalCrawlStore((state) => state.issuesData);
  const issuesView = useGlobalCrawlStore((state) => state.issuesView);

  const affected = issuesData?.length || 0;
  const healthy = Math.max(0, totalPages - affected);

  const chartData = [
    { browser: "Affected", visitors: affected, fill: "hsl(710, 100%, 60%)" },
    { browser: "Healthy", visitors: healthy, fill: "hsl(210, 100%, 70%)" },
  ];

  return (
    <Card className="flex flex-col dark:bg-gray-900 bg-slate-100 border-0 shadow-none">
      <CardHeader className="items-center pb-0">
        <CardTitle>Issues Found</CardTitle>
        <CardDescription>{issuesView}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="visitors"
              nameKey="browser"
              innerRadius={60}
              strokeWidth={5}
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
                          className="text-3xl dark:fill-white font-bold"
                        >
                          {affected.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground dark:fill-white/50 text-xs"
                        >
                          Affected
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-xs dark:text-white/50">
        <div className="leading-none text-muted-foreground">
          Found <span className="text-red-500">{affected}</span> URLs with this issue.
        </div>
        <div className="flex items-center gap-3 font-medium leading-none">
          From a total of {totalPages || 0} pages analyzed
        </div>
      </CardFooter>
    </Card>
  );
}

export default GenericIssueChart;
