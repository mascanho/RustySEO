"use client";

import { TrendingUp } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

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
    label: "amount:",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function KeywordChart({
  keywords,
  url,
}: {
  keywords: string[];
  url: string;
}) {
  function changeData(keywordsArr: string[]): any[] {
    let data: any = [];

    keywordsArr.forEach((keyword: any) => {
      for (let i = 0; i < keywordsArr.length; i++) {
        keyword?.map((key: any) => {
          data.push({ month: key[i], desktop: key[i + 1] });
        });
      }
    });

    return data;
  }

  const chartData = changeData(keywords);

  return (
    <Card className="dark:bg-brand-darker w-full shadow dark:border-0 overflow-x-hidden keyword-chart">
      <CardHeader className="items-center pb-4">
        <CardTitle>Top 10 Keywords</CardTitle>
        {/* <CardDescription>{url}</CardDescription> */}
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="month" />
            <PolarGrid gridType="circle" />
            <PolarAngleAxis dataKey="month" />
            <Radar
              dataKey="desktop"
              fill="var(--color-desktop)"
              fillOpacity={0.6}
              dot={{
                r: 4,
                fillOpacity: 1,
              }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-xs dark:text-white/50 min-h-[5.5rem] mt-2 text-center">
        {keywords.length > 0 && (
          <>
            <div className="flex items-center gap-2 font-medium leading-none">
              {keywords.length > 0 && (
                <span>
                  Top keyword:{" "}
                  <span className="font-bold text-brand-bright">
                    {keywords?.length > 0 && keywords[0]?.length > 0
                      ? keywords[0][0][0]
                      : "No keywords available"}
                  </span>
                </span>
              )}
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

export default KeywordChart;
