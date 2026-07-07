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

// Page weight (HTML transfer size) distribution — same thresholds as the
// Page Weight dropdown (<100KB light ... >1MB very heavy).
export default function PageWeightHistogram({ crawlData, isDark }: VisualisationChartProps) {
  const { data, avgKb } = useMemo(() => {
    let light = 0;
    let medium = 0;
    let heavy = 0;
    let veryHeavy = 0;
    let totalKb = 0;
    let count = 0;

    for (const item of crawlData) {
      const kb = item?.page_size?.[0]?.kb;
      if (kb === undefined || kb === null) continue;
      count++;
      totalKb += kb;
      if (kb < 100) light++;
      else if (kb < 500) medium++;
      else if (kb < 1024) heavy++;
      else veryHeavy++;
    }

    return {
      data: [
        { name: "Light (<100KB)", value: light, color: STATUS.good },
        { name: "Medium (100-500KB)", value: medium, color: STATUS.warning },
        { name: "Heavy (500KB-1MB)", value: heavy, color: STATUS.serious },
        { name: "Very Heavy (>1MB)", value: veryHeavy, color: STATUS.critical },
      ],
      avgKb: count > 0 ? Math.round(totalKb / count) : null,
    };
  }, [crawlData]);

  if (!crawlData.length) return <EmptyState />;

  return (
    <div className="flex-1 flex flex-col">
      {avgKb !== null && (
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">
          Average page size:{" "}
          <span className="font-bold text-slate-700 dark:text-slate-200">{avgKb} KB</span>
        </p>
      )}
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
