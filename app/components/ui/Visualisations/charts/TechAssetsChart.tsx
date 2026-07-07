import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { VisualisationChartProps } from "../types";
import { CATEGORICAL, tooltipStyle } from "../shared/colors";
import EmptyState from "../shared/EmptyState";

// What the crawl actually pulled in — pages vs. the CSS/JS/image/redirect
// assets discovered alongside them. Same "asset mix" idea as the historical
// dashboard's chart, but for the live/current crawl sitting in memory.
export default function TechAssetsChart({ crawlData, aggregatedData, isDark }: VisualisationChartProps) {
  const data = useMemo(
    () =>
      [
        { name: "Pages", value: crawlData.length, color: CATEGORICAL[0] },
        { name: "CSS", value: aggregatedData.css?.length || 0, color: CATEGORICAL[1] },
        { name: "JavaScript", value: aggregatedData.scripts?.length || 0, color: CATEGORICAL[2] },
        { name: "Images", value: aggregatedData.images?.length || 0, color: CATEGORICAL[3] },
        { name: "Redirects", value: aggregatedData.redirects?.length || 0, color: CATEGORICAL[4] },
      ].filter((d) => d.value > 0),
    [crawlData.length, aggregatedData],
  );

  if (!crawlData.length) return <EmptyState />;

  const totalAssets = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="h-[160px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle(isDark)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Assets</span>
          <span className="text-lg font-extrabold tracking-tight dark:text-white">{totalAssets}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full mt-4">
        {data.map((d) => (
          <div
            key={d.name}
            className="flex items-center justify-between text-[11px] border-b border-slate-100 dark:border-slate-800 pb-1"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="font-medium text-slate-600 dark:text-slate-400">{d.name}</span>
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
