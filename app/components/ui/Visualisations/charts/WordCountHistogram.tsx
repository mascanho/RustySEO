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

// Word-count distribution — same bucket boundaries as the General tab's
// Word Count dropdown, visualised as a histogram to spot thin-content spikes.
export default function WordCountHistogram({ crawlData, isDark }: VisualisationChartProps) {
  const data = useMemo(() => {
    const buckets = { "No Content": 0, "1-100": 0, "101-300": 0, "301-600": 0, "601-1000": 0, "1000+": 0 };
    for (const item of crawlData) {
      const wc = item?.word_count || 0;
      if (wc === 0) buckets["No Content"]++;
      else if (wc <= 100) buckets["1-100"]++;
      else if (wc <= 300) buckets["101-300"]++;
      else if (wc <= 600) buckets["301-600"]++;
      else if (wc <= 1000) buckets["601-1000"]++;
      else buckets["1000+"]++;
    }
    return Object.entries(buckets).map(([bucket, count]) => ({ bucket, count }));
  }, [crawlData]);

  if (!crawlData.length) return <EmptyState />;

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke(isDark)} />
        <XAxis dataKey="bucket" {...axisStyle(isDark)} interval={0} angle={-20} textAnchor="end" height={40} />
        <YAxis allowDecimals={false} {...axisStyle(isDark)} />
        <Tooltip {...tooltipStyle(isDark)} cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }} />
        <Bar dataKey="count" name="Pages" fill={STATUS.info} radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
