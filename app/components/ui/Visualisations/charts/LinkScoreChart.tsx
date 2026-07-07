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

// Internal link equity distribution — same buckets as the General tab's
// Link Score dropdown. Surfaces how much of the site is well-linked vs.
// effectively orphaned.
export default function LinkScoreChart({ crawlData, isDark }: VisualisationChartProps) {
  const { data, avg, scored } = useMemo(() => {
    let strong = 0;
    let moderate = 0;
    let weak = 0;
    let orphaned = 0;
    let total = 0;
    let scoredCount = 0;

    for (const item of crawlData) {
      const score = item?.link_score;
      if (score === undefined || score === null) continue;
      scoredCount++;
      total += score;
      if (score === 0) orphaned++;
      else if (score < 40) weak++;
      else if (score < 70) moderate++;
      else strong++;
    }

    return {
      data: [
        { name: "Strong (70-100)", value: strong, color: STATUS.good },
        { name: "Moderate (40-69)", value: moderate, color: STATUS.warning },
        { name: "Weak (1-39)", value: weak, color: STATUS.serious },
        { name: "Orphaned (0)", value: orphaned, color: STATUS.critical },
      ],
      avg: scoredCount > 0 ? Math.round(total / scoredCount) : null,
      scored: scoredCount,
    };
  }, [crawlData]);

  if (!crawlData.length) return <EmptyState />;
  if (scored === 0) {
    return (
      <EmptyState message="Link Score isn't enabled for this crawl. Turn it on in Settings to see internal link equity here." />
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">
        Average link score:{" "}
        <span className="font-bold text-slate-700 dark:text-slate-200">{avg}</span>
      </p>
      <ResponsiveContainer width="100%" height="100%" minHeight={190}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke(isDark)} />
          <XAxis dataKey="name" {...axisStyle(isDark)} interval={0} angle={-15} textAnchor="end" height={40} />
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
