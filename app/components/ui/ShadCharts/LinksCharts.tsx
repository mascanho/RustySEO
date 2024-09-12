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
import useOnPageSeo from "@/store/storeOnPageSeo";

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
  const externalLinks = linkStatusCodes?.filter(
    (link: any) => link?.is_external === true,
  );

  const internalLinks = linkStatusCodes?.filter(
    (link: any) => link?.is_external === false,
  );

  const statusError = linkStatusCodes?.filter(
    (link: any) => link?.status_code === 404,
  );

  const { setSeoStatusCodes } = useOnPageSeo((state) => state);

  React.useEffect(() => {
    setSeoStatusCodes(statusError);
  }, [linkStatusCodes]);

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

  return (
    <Card className="flex flex-col dark:bg-brand-darker dark:border-brand-darker h-[22rem]">
      <CardHeader className="items-center pb-0">
        <CardTitle>On page Links</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0 items-center relative">
        {!linkStatusCodes && (
          <div className="loader absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        )}
        {linkStatusCodes && (
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
        )}
      </CardContent>
      {linkStatusCodes?.length > 0 && (
        <CardFooter className="flex-col gap-2 text-xs text-left mb-12 dark:text-white/50">
          {/* <p className="flex items-center font-medium leading-none -mt-10"> */}
          {/*   This page contains{" "} */}
          {/*   <span className="mx-1 font-bold text-brand-bright"> */}
          {/*     {linkStatusCodes?.length} */}
          {/*   </span> */}
          {/*   links. */}
          {/* </p> */}
          <p className="leading-none text-muted-foreground">
            <span className="font-bold">Internal Links: </span>
            <span className="text-brand-bright font-bold">
              {internalLinks?.length}
            </span>
            <span className="font-bold ml-2">External Links:</span>{" "}
            <span className="text-brand-bright font-bold">
              {externalLinks?.length}
            </span>
          </p>
          <p className="leading-none text-muted-foreground">
            <span className="font-bold">404 Links:{""}</span>
            <span className="text-brand-bright font-bold ml-1">
              {statusError?.length}{" "}
            </span>
          </p>
        </CardFooter>
      )}
    </Card>
  );
}

export default LinksChart;
