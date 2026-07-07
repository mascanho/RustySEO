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

// Server response speed buckets — same thresholds as the Response Time
// dropdown (< 200ms fast, 200ms-1s average, > 1s slow).
export default function ResponseTimeHistogram({ crawlData, isDark }: VisualisationChartProps) {
  const { data, avgMs } = useMemo(() => {
    let fast = 0;
    let average = 0;
    let slow = 0;
    let total = 0;
    let count = 0;

    for (const item of crawlData) {
      if (item?.response_time === undefined || item?.response_time === null) continue;
      const ms = item.response_time * 1000;
      total += ms;
      count++;
      if (ms < 200) fast++;
      else if (ms <= 1000) average++;
      else slow++;
    }

    return {
      data: [
        { name: "Fast (<200ms)", value: fast, color: STATUS.good },
        { name: "Average (200ms-1s)", value: average, color: STATUS.warning },
        { name: "Slow (>1s)", value: slow, color: STATUS.critical },
      ],
      avgMs: count > 0 ? Math.round(total / count) : null,
    };
  }, [crawlData]);

  if (!crawlData.length) return <EmptyState />;

  return (
    <div className="flex-1 flex flex-col">
      {avgMs !== null && (
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">
          Average response time:{" "}
          <span className="font-bold text-slate-700 dark:text-slate-200">{avgMs}ms</span>
        </p>
      )}
      <ResponsiveContainer width="100%" height="100%" minHeight={190}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke(isDark)} />
          <XAxis dataKey="name" {...axisStyle(isDark)} />
          <YAxis allowDecimals={false} {...axisStyle(isDark)} />
          <Tooltip {...tooltipStyle(isDark)} cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }} />
          <Bar dataKey="value" name="Pages" radius={[4, 4, 0, 0]} maxBarSize={64}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
