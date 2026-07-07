import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { VisualisationChartProps } from "../types";
import { STATUS, axisStyle, gridStroke, tooltipStyle } from "../shared/colors";
import EmptyState from "../shared/EmptyState";

// Response status composition — the first thing any crawler audit checks:
// how much of the site is healthy (2xx) vs broken (4xx/5xx) vs redirecting.
export default function StatusCodeChart({ crawlData, isDark }: VisualisationChartProps) {
  const data = useMemo(() => {
    const buckets = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0, Other: 0 };
    for (const item of crawlData) {
      const code = item?.status_code || 0;
      if (code >= 200 && code < 300) buckets["2xx"]++;
      else if (code >= 300 && code < 400) buckets["3xx"]++;
      else if (code >= 400 && code < 500) buckets["4xx"]++;
      else if (code >= 500) buckets["5xx"]++;
      else buckets.Other++;
    }
    return [
      { name: "2xx Success", key: "2xx", value: buckets["2xx"], color: STATUS.good },
      { name: "3xx Redirect", key: "3xx", value: buckets["3xx"], color: STATUS.warning },
      { name: "4xx Client Error", key: "4xx", value: buckets["4xx"], color: STATUS.serious },
      { name: "5xx Server Error", key: "5xx", value: buckets["5xx"], color: STATUS.critical },
    ].filter((d) => d.value > 0 || d.key !== "Other");
  }, [crawlData]);

  if (!crawlData.length) return <EmptyState />;

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke(isDark)} />
        <XAxis dataKey="name" {...axisStyle(isDark)} />
        <YAxis allowDecimals={false} {...axisStyle(isDark)} />
        <Tooltip {...tooltipStyle(isDark)} cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }} />
        <Bar dataKey="value" name="Pages" radius={[4, 4, 0, 0]} maxBarSize={64}>
          {data.map((d) => (
            <Cell key={d.key} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
