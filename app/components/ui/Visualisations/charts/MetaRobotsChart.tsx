import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { VisualisationChartProps } from "../types";
import { STATUS, tooltipStyle } from "../shared/colors";
import EmptyState from "../shared/EmptyState";

// Indexing directive breakdown — same categories as the Meta Robots dropdown.
// A quick visual check for how much of the crawl is silently blocked.
export default function MetaRobotsChart({ crawlData, isDark }: VisualisationChartProps) {
  const data = useMemo(() => {
    let notSet = 0;
    let indexFollow = 0;
    let noindex = 0;
    let nofollow = 0;
    let noindexNofollow = 0;

    for (const item of crawlData) {
      const directives = (item?.meta_robots?.meta_robots || []).join(", ").toLowerCase();
      if (!directives) {
        notSet++;
        continue;
      }
      const hasNoindex = directives.includes("noindex");
      const hasNofollow = directives.includes("nofollow");
      if (hasNoindex && hasNofollow) noindexNofollow++;
      else if (hasNoindex) noindex++;
      else if (hasNofollow) nofollow++;
      else indexFollow++;
    }

    return [
      { name: "No Tag", value: notSet, color: "#94a3b8" },
      { name: "Index, Follow", value: indexFollow, color: STATUS.good },
      { name: "Noindex", value: noindex, color: STATUS.critical },
      { name: "Nofollow", value: nofollow, color: STATUS.warning },
      { name: "Noindex, Nofollow", value: noindexNofollow, color: STATUS.serious },
    ].filter((d) => d.value > 0);
  }, [crawlData]);

  if (!crawlData.length) return <EmptyState />;

  return (
    <div className="flex-1 flex flex-col sm:flex-row items-center gap-4">
      <div className="h-[160px] w-[160px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle(isDark)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 grid grid-cols-1 gap-1.5 w-full">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-[11px] border-b border-slate-100 dark:border-slate-800 pb-1">
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
