import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { VisualisationChartProps } from "../types";
import { STATUS, axisStyle, gridStroke, tooltipStyle } from "../shared/colors";
import EmptyState from "../shared/EmptyState";

// Pages found per click-depth from the start URL — reveals how deep the
// site's architecture is and whether important pages are buried. Depth is
// ordinal, not categorical identity, so this stays a single-hue series.
export default function CrawlDepthChart({ crawlData, isDark }: VisualisationChartProps) {
  const data = useMemo(() => {
    const byDepth = new Map<number, number>();
    for (const item of crawlData) {
      const depth = typeof item?.url_depth === "number" ? item.url_depth : 0;
      byDepth.set(depth, (byDepth.get(depth) || 0) + 1);
    }
    return Array.from(byDepth.entries())
      .sort((a, b) => a[0] - b[0])
      .slice(0, 12)
      .map(([depth, count]) => ({ depth: `Depth ${depth}`, count }));
  }, [crawlData]);

  if (!crawlData.length) return <EmptyState />;

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke(isDark)} />
        <XAxis dataKey="depth" {...axisStyle(isDark)} />
        <YAxis allowDecimals={false} {...axisStyle(isDark)} />
        <Tooltip {...tooltipStyle(isDark)} cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }} />
        <Bar dataKey="count" name="Pages" fill={STATUS.info} radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
