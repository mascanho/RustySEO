"use client";

import Link from "next/link";
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
import { use, useEffect } from "react";

const chartConfig = {
  visitors: {
    label: "Total Images",
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

export function ImagesChart({ images, url }: { images: any; url: string }) {
  const imagesAltText = images?.filter((image: any) => image.alt_text);
  const imagesLinks = images?.filter((image: any) => image.link);
  const imagesNoAltText = images?.filter((image: any) => !image.alt_text);

  const chartData = [
    {
      browser: "With Alt Text",
      visitors: imagesAltText?.length,
      fill: "var(--color-chrome)",
    },
    {
      browser: "No Alt Text",
      visitors: imagesNoAltText?.length,
      fill: "var(--color-safari)",
    },
  ];

  return (
    <Card className="flex flex-col dark:bg-brand-darker dark:border-0 overflow-hidden">
      <CardHeader className="items-center pb-0">
        <CardTitle>Images on page</CardTitle>
        {/* <CardDescription>{url}</CardDescription> */}
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
                        className="text-white"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground dark:fill-white text-3xl font-bold"
                        >
                          {images?.length}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foregroundod  dark:fill-white text-sm text-black"
                        >
                          Total Images
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
      <CardFooter className="flex-col gap-2 text-xs min-h-[5.5rem] text-center">
        {images.length === 0 ? (
          ""
        ) : (
          <>
            <div className="flex items-center gap-2 font-medium leading-none dark:text-black">
              {imagesNoAltText?.length > 0 ? (
                <span className="dark:text-white/50">
                  Discovered
                  <Link
                    href="#imagestable"
                    className=" font-semibold text-muted-foreground dark:text-white/50"
                  >
                    {" "}
                    {imagesNoAltText?.length} images{" "}
                  </Link>
                  with no alt text.
                </span>
              ) : (
                ""
              )}
            </div>
            <div className="leading-none text-muted-foreground dark:text-white/50">
              {imagesNoAltText?.length > 0
                ? "Ensure there is a descriptive alt text for each image"
                : "Good job, All images have alt text 🎉"}
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
export default ImagesChart;
