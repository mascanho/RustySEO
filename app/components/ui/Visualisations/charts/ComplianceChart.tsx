import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { VisualisationChartProps } from "../types";
import { STATUS } from "../shared/colors";
import EmptyState from "../shared/EmptyState";

interface CoverageRingProps {
  label: string;
  covered: number;
  total: number;
}

function CoverageRing({ label, covered, total }: CoverageRingProps) {
  const pct = total > 0 ? Math.round((covered / total) * 100) : 0;
  const data = [
    { name: "Covered", value: covered },
    { name: "Remaining", value: Math.max(0, total - covered) },
  ];
  const color = pct >= 80 ? STATUS.good : pct >= 40 ? STATUS.warning : STATUS.critical;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-[100px] w-[100px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={44} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
              <Cell fill={color} />
              <Cell fill="rgba(148,163,184,0.18)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-sm font-extrabold tracking-tight dark:text-white">{pct}%</span>
        </div>
      </div>
      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 text-center">{label}</span>
      <span className="text-[9px] text-slate-400">
        {covered} / {total}
      </span>
    </div>
  );
}

// Three coverage rings for the compliance signals that matter most across a
// whole crawl: HTTPS, structured data, and mobile-friendliness.
export default function ComplianceChart({ crawlData }: VisualisationChartProps) {
  const stats = useMemo(() => {
    let https = 0;
    let schema = 0;
    let mobile = 0;
    for (const item of crawlData) {
      if (item?.https === true) https++;
      if (item?.schema === true || item?.schema === "Yes") schema++;
      if (item?.mobile === true) mobile++;
    }
    return { https, schema, mobile, total: crawlData.length };
  }, [crawlData]);

  if (!crawlData.length) return <EmptyState />;

  return (
    <div className="flex-1 flex items-center justify-around gap-2 flex-wrap">
      <CoverageRing label="HTTPS Secure" covered={stats.https} total={stats.total} />
      <CoverageRing label="Structured Data" covered={stats.schema} total={stats.total} />
      <CoverageRing label="Mobile Friendly" covered={stats.mobile} total={stats.total} />
    </div>
  );
}
