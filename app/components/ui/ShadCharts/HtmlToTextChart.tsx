"use client";

import { TrendingUp } from "lucide-react";
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

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

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function HtmlToTextChart({ htmlToTextRatio }: any) {
  const totalVisitors =
    htmlToTextRatio?.[0]?.[0].toFixed(2) * 100 + "%" ?? 0 * 100 + "%";

  // Safely accessing htmlToTextRatio values for chartData
  const chartData = [
    {
      month: "January",
      desktop: htmlToTextRatio?.[0]?.[1] ?? 0, // Provide a default value if undefined
      mobile: htmlToTextRatio?.[0]?.[2] ?? 0, // Provide a default value if undefined
    },
  ];

  return (
    <Card className="flex flex-col dark:bg-brand-darker">
      <CardHeader className="items-center pb-0">
        <CardTitle>Content Ratio</CardTitle>
        {/* <CardDescription>January - June 2024</CardDescription> */}
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[280px]"
        >
          <RadialBarChart
            data={chartData}
            endAngle={180}
            innerRadius={80}
            outerRadius={130}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 16}
                          className="fill-foreground text-2xl font-bold dark:fill-white"
                        >
                          {totalVisitors?.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 4}
                          className="fill-muted-foreground dark:fill-white/50"
                        >
                          Text / HTML
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="desktop"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-desktop)"
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="mobile"
              fill="var(--color-mobile)"
              stackId="a"
              cornerRadius={5}
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      {htmlToTextRatio && (
        <CardFooter className="flex-col gap-2 text-center text-sm -mt-8 mb-10 dark:text-white/50">
          <div className="flex items-center gap-2 font-medium leading-none -mt-10">
            Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            Showing total visitors for the last 6 months
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export default HtmlToTextChart;
