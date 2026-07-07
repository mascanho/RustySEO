import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { VisualisationChartProps } from "../types";
import { STATUS, tooltipStyle } from "../shared/colors";
import EmptyState from "../shared/EmptyState";

// Indexable/non-indexable split (donut — a clean binary composition), plus
// the ranked list of *why* pages are blocked, which is the actionable part.
// Matches the >= 0.5 threshold used everywhere else (table, exports, Indexing dropdown).
export default function IndexabilityChart({ crawlData, isDark }: VisualisationChartProps) {
  const { donutData, reasons, total } = useMemo(() => {
    let indexable = 0;
    let nonIndexable = 0;
    const reasonCounts = new Map<string, number>();

    for (const item of crawlData) {
      const score = item?.indexability?.indexability ?? 0;
      const reason = item?.indexability?.indexability_reason || "Unknown";
      if (score >= 0.5) indexable++;
      else nonIndexable++;
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    }

    const topReasons = Array.from(reasonCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([reason, count]) => ({ reason, count }));

    return {
      donutData: [
        { name: "Indexable", value: indexable, color: STATUS.good },
        { name: "Non-Indexable", value: nonIndexable, color: STATUS.critical },
      ].filter((d) => d.value > 0),
      reasons: topReasons,
      total: crawlData.length,
    };
  }, [crawlData]);

  if (!crawlData.length) return <EmptyState />;

  const maxReasonCount = Math.max(1, ...reasons.map((r) => r.count));

  return (
    <div className="flex-1 flex flex-col sm:flex-row gap-4 items-center">
      <div className="h-[160px] w-[160px] relative shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={donutData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={3}
              dataKey="value"
            >
              {donutData.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle(isDark)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pages</span>
          <span className="text-lg font-extrabold tracking-tight dark:text-white">{total}</span>
        </div>
      </div>

      <div className="flex-1 w-full min-w-0">
        <div className="flex gap-4 mb-3 text-[11px]">
          {donutData.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-slate-600 dark:text-slate-300 font-medium">{d.name}</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{d.value}</span>
            </div>
          ))}
        </div>

        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
          Top block reasons
        </p>
        <div className="space-y-1.5">
          {reasons.length === 0 && (
            <p className="text-[11px] text-slate-400">No blocked pages found.</p>
          )}
          {reasons.map((r) => (
            <div key={r.reason} className="flex items-center gap-2">
              <div className="flex-1 h-3.5 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${(r.count / maxReasonCount) * 100}%`,
                    backgroundColor: STATUS.critical,
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 w-6 text-right shrink-0">
                {r.count}
              </span>
              <span
                className="text-[10px] text-slate-600 dark:text-slate-300 truncate w-40 shrink-0"
                title={r.reason}
              >
                {r.reason}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
