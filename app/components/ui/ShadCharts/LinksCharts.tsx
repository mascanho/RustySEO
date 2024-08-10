// @ts-nocheck
"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
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

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  chrome: {
    label: "Chrome",
    color: "hsl(var(--chart-1))",
  },
  safari: {
    label: "Safari",
    color: "hsl(var(--chart-2))",
  },
  firefox: {
    label: "Firefox",
    color: "hsl(var(--chart-3))",
  },
  edge: {
    label: "Edge",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export function LinksChart({
  linkStatusCodes,
  linkStatusCodeStatus,
}: {
  linksStatusCodes: any;
  linkStatusCodeStatus: any;
}) {
  console.log(linkStatusCodes, "linksStatusCodes from the charts");

  const externalLinks = linkStatusCodes?.filter(
    (link: any) => link?.is_external === true,
  );

  const internalLinks = linkStatusCodes?.filter(
    (link: any) => link?.is_external === false,
  );

  const statusError = linkStatusCodes?.filter(
    (link: any) => link?.status_code === 404,
  );

  console.log(externalLinks, "The external links");

  const chartData = [
    {
      browser: "External",
      visitors: externalLinks.length,
      fill: "var(--color-chrome)",
    },
    {
      browser: "Internal",
      visitors: internalLinks.length,
      fill: "var(--color-safari)",
    },
    {
      browser: "404",
      visitors: statusError.length,
      fill: "var(--color-safari)",
    },
  ];

  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.visitors, 0);
  }, []);

  if (linkStatusCodeStatus === true) {
    return "loading";
  }

  return (
    <Card className="flex flex-col dark:bg-brand-darker">
      <CardHeader className="items-center pb-0">
        <CardTitle>On page Links</CardTitle>
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
                          className="fill-foreground text-3xl font-bold dark:fill-white"
                        >
                          {linkStatusCodes.length}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground dark:fill-white"
                        >
                          Links
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      {linkStatusCodes?.length > 0 && (
        <CardFooter className="flex-col gap-2 text-sm text-center mb-6 dark:text-white/50">
          <p className="flex items-center font-medium leading-none -mt-10">
            This page contains {linkStatusCodes?.length} links.
          </p>
          <p className="leading-none text-muted-foreground">
            <span className="font-bold">Internal Links: </span>
            {internalLinks?.length}
            <span className="font-bold ml-2">External Links:</span>{" "}
            {externalLinks?.length}
          </p>
          <p className="leading-none text-muted-foreground">
            <span className="font-bold">404 Links:</span> {statusError?.length}{" "}
          </p>
        </CardFooter>
      )}
    </Card>
  );
}

export default LinksChart;
