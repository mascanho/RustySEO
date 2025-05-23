// @ts-nocheck
"use client";
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
    <Card className="flex flex-col dark:bg-brand-darker dark:border-brand-darker h-[22rem]">
      <CardHeader className="items-center pb-0">
        <CardTitle>Content Ratio</CardTitle>
        {/* <CardDescription>January - June 2024</CardDescription> */}
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[280px] mt-5"
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
                          {htmlToTextRatio?.[0] &&
                            Math.round(htmlToTextRatio?.[0]?.[0] * 100) + "%"}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 4}
                          className="fill-muted-foreground dark:fill-white/50"
                        >
                          {htmlToTextRatio?.[0] && "Text to HTML"}
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
        <CardFooter className="flex-col gap-2 text-center text-xs -mt-2.5  mb-10 dark:text-white/50">
          <div className="flex flex-col items-center gap-2 font-medium leading-none -mt-10">
            {htmlToTextRatio?.[0] &&
              Math.round(htmlToTextRatio?.[0]?.[0] * 100) < 25 && (
                <>
                  <span>There is a small Text to HTML ratio.</span>
                  <span>This page needs more text to rank better.</span>
                </>
              )}

            {htmlToTextRatio?.[0] &&
              Math.round(htmlToTextRatio?.[0]?.[0] * 100) > 25 && (
                <>
                  <span>You have a good text to HTML ratio.</span>
                </>
              )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export default HtmlToTextChart;
