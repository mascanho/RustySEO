import React, { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { VisualisationChartProps } from "../types";
import { STATUS, axisStyle, gridStroke, tooltipStyle } from "../shared/colors";
import EmptyState from "../shared/EmptyState";

const MAX_POINTS = 600;

// Content length vs. reading ease — reveals whether the site's longer pages
// are also its most difficult to read (a common thin-vs-bloated content
// tension). Single series, so no legend/second hue is spent on it.
export default function ReadabilityScatter({ crawlData, isDark }: VisualisationChartProps) {
  const points = useMemo(() => {
    const all = crawlData
      .filter(
        (item) =>
          typeof item?.flesch === "number" &&
          typeof item?.word_count === "number" &&
          item.word_count > 0,
      )
      .map((item) => ({
        wordCount: item.word_count,
        flesch: Math.max(0, Math.min(100, item.flesch)),
        url: item.url,
      }));

    if (all.length <= MAX_POINTS) return all;

    // Deterministic even sample rather than a random one, so the chart
    // doesn't visually jitter between opens of the same dataset.
    const step = all.length / MAX_POINTS;
    const sampled: typeof all = [];
    for (let i = 0; i < MAX_POINTS; i++) sampled.push(all[Math.floor(i * step)]);
    return sampled;
  }, [crawlData]);

  if (!crawlData.length) return <EmptyState />;
  if (points.length === 0) {
    return (
      <EmptyState message="No readability scores found — this dataset may predate Flesch scoring, or all pages have zero word count." />
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">
        Each dot is a page. Higher on the Y axis = easier to read (Flesch Reading Ease).
        {points.length < crawlData.length && (
          <> Showing a {points.length.toLocaleString()}-page sample.</>
        )}
      </p>
      <ResponsiveContainer width="100%" height="100%" minHeight={220}>
        <ScatterChart margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke(isDark)} />
          <XAxis
            type="number"
            dataKey="wordCount"
            name="Word Count"
            {...axisStyle(isDark)}
            label={{ value: "Word Count", position: "insideBottom", offset: -2, fontSize: 10, fill: axisStyle(isDark).style.fill }}
          />
          <YAxis
            type="number"
            dataKey="flesch"
            name="Flesch Reading Ease"
            domain={[0, 100]}
            {...axisStyle(isDark)}
          />
          <ZAxis range={[28, 28]} />
          <Tooltip
            {...tooltipStyle(isDark)}
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(value: number, name: string) => [Math.round(value), name]}
            labelFormatter={() => ""}
          />
          <Scatter data={points} fill={STATUS.info} fillOpacity={0.55} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
