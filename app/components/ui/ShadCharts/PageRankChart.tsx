"use client";

import { TrendingUp } from "lucide-react";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

export function PageRankChart({ pageRank }: { pageRank: any }) {
  const chartData = [
    {
      source: "safari",
      visitors: pageRank?.[0] ?? 0,
      fill: "var(--color-safari)",
    },
  ];

  const chartConfig = {
    visitors: {
      label: "Rank",
    },
    safari: {
      label: "Safari",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  if (!pageRank) {
    return (
      <div className="h-[20rem] flex items-center ">
        <span className="text-black/50 darK:text-white/50 m-auto text-center translate-y-1/2 h-full">
          No page crawled
        </span>
      </div>
    );
  }

  return (
    <Card className="flex flex-col border-0 p-0 shadow-none  dark:bg-brand-darker">
      <CardHeader className="items-center pb-0">
        <CardTitle>Page Rank</CardTitle>
        <CardDescription>{new Date().toDateString()}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={0}
            endAngle={250}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-gray-500 last:fill-white dark:last:fill-brand-darker"
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey="visitors" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
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
                          className="fill-foreground text-4xl font-bold dark:fill-white"
                        >
                          {chartData[0].visitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-black dark:fill-white"
                        >
                          Domain Rank
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium text-center text-xs text-gray-500 leading-none">
          This represents the page rank of the domain. based on open page rank
        </div>
      </CardFooter>
    </Card>
  );
}

export default PageRankChart;
