// @ts-nocheck
"use client";

import { useMemo } from "react";
import {
  FileText,
  Zap,
  Search as SearchIcon,
  Layers,
  Target,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import type { Ad } from "@/types/ad";
import { computeAdStrength } from "./utils/ad-strength";
import { AdStrengthBadge } from "./ad-strength";

interface AdsOverviewProps {
  ads: Ad[];
  onSelect: (ad: Ad) => void;
  onCreate?: () => void;
}

const LEVEL_ORDER = ["Excellent", "Good", "Average", "Poor", "Incomplete"];
const LEVEL_COLOR: Record<string, string> = {
  Excellent: "#10b981",
  Good: "#0ea5e9",
  Average: "#f59e0b",
  Poor: "#f43f5e",
  Incomplete: "#94a3b8",
};

export function AdsOverview({ ads, onSelect, onCreate }: AdsOverviewProps) {
  const data = useMemo(() => {
    const withStrength = ads.map((ad) => ({
      ad,
      strength: computeAdStrength(ad),
    }));

    const byType = {
      search: ads.filter((a) => a.type === "search").length,
      pmax: ads.filter((a) => a.type === "pmax").length,
      display: ads.filter((a) => a.type === "display").length,
    };

    const levelCounts: Record<string, number> = {};
    for (const l of LEVEL_ORDER) levelCounts[l] = 0;
    for (const w of withStrength) levelCounts[w.strength.level]++;

    const avgScore =
      withStrength.length > 0
        ? Math.round(
            withStrength.reduce((a, w) => a + w.strength.score, 0) /
              withStrength.length,
          )
        : 0;

    const totalHeadlines = ads.reduce(
      (a, ad) => a + (ad.headlines || []).filter((h) => h && h.trim()).length,
      0,
    );
    const totalKeywords = ads.reduce(
      (a, ad) => a + (ad.keywords || []).length,
      0,
    );
    const readyToLaunch = withStrength.filter(
      (w) => w.strength.level === "Excellent" || w.strength.level === "Good",
    ).length;

    // Aggregate the most common failing checks across the whole portfolio.
    const issueMap: Record<string, { label: string; hint: string; count: number }> =
      {};
    for (const w of withStrength) {
      for (const c of w.strength.checks) {
        if (!c.passed) {
          if (!issueMap[c.id])
            issueMap[c.id] = { label: c.label, hint: c.hint, count: 0 };
          issueMap[c.id].count++;
        }
      }
    }
    const topIssues = Object.values(issueMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const needsAttention = [...withStrength]
      .sort((a, b) => a.strength.score - b.strength.score)
      .slice(0, 5);

    return {
      withStrength,
      byType,
      levelCounts,
      avgScore,
      totalHeadlines,
      totalKeywords,
      readyToLaunch,
      topIssues,
      needsAttention,
      total: ads.length,
    };
  }, [ads]);

  if (ads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500 mb-4">
          <FileText className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          No ads yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
          Create your first ad to unlock portfolio analytics, ad-strength scoring
          and optimisation insights.
        </p>
        {onCreate && (
          <button
            onClick={onCreate}
            className="mt-5 inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-brand-bright text-white text-xs font-bold hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" /> Create your first ad
          </button>
        )}
      </div>
    );
  }

  const avgTone =
    data.avgScore >= 85
      ? "emerald"
      : data.avgScore >= 65
        ? "sky"
        : data.avgScore >= 40
          ? "amber"
          : "rose";
  const avgToneClass = {
    emerald: "text-emerald-500",
    sky: "text-sky-500",
    amber: "text-amber-500",
    rose: "text-rose-500",
  }[avgTone];
  const avgBarClass = {
    emerald: "bg-emerald-500",
    sky: "bg-sky-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  }[avgTone];

  const kpis = [
    {
      label: "Total Ads",
      value: data.total,
      icon: FileText,
      color: "text-indigo-500 bg-indigo-500/10",
      sub: `${data.byType.search} search · ${data.byType.pmax} pmax · ${data.byType.display} display`,
    },
    {
      label: "Avg Ad Strength",
      value: `${data.avgScore}`,
      icon: Zap,
      color: `${avgToneClass} ${avgToneClass.replace("text", "bg").replace("-500", "-500/10")}`,
      sub: "Portfolio quality score /100",
    },
    {
      label: "Ready to Launch",
      value: data.readyToLaunch,
      icon: CheckCircle2,
      color: "text-emerald-500 bg-emerald-500/10",
      sub: `${Math.round((data.readyToLaunch / data.total) * 100)}% rated Good or better`,
    },
    {
      label: "Total Keywords",
      value: data.totalKeywords.toLocaleString(),
      icon: Target,
      color: "text-sky-500 bg-sky-500/10",
      sub: `${data.totalHeadlines.toLocaleString()} headlines written`,
    },
  ];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-5 pb-6">
      {/* KPI ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="bg-white dark:bg-brand-darker/60 border border-gray-100 dark:border-white/5 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {k.label}
                </span>
                <div className={`p-1.5 rounded-lg ${k.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white mt-2">
                {k.value}
              </div>
              <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                {k.sub}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Ad strength distribution */}
        <div className="lg:col-span-5 bg-white dark:bg-brand-darker/60 border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1">
            Ad Strength Distribution
          </h3>
          <p className="text-[10px] text-gray-400 mb-4">
            How your portfolio scores across quality tiers.
          </p>

          {/* Stacked bar */}
          <div className="flex w-full h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-white/5 mb-4">
            {LEVEL_ORDER.map((lvl) => {
              const count = data.levelCounts[lvl];
              if (!count) return null;
              return (
                <div
                  key={lvl}
                  style={{
                    width: `${(count / data.total) * 100}%`,
                    backgroundColor: LEVEL_COLOR[lvl],
                  }}
                  title={`${lvl}: ${count}`}
                />
              );
            })}
          </div>

          <div className="space-y-2.5">
            {LEVEL_ORDER.map((lvl) => {
              const count = data.levelCounts[lvl];
              const pct = data.total > 0 ? (count / data.total) * 100 : 0;
              return (
                <div key={lvl} className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: LEVEL_COLOR[lvl] }}
                  />
                  <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 w-20">
                    {lvl}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: LEVEL_COLOR[lvl],
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 w-6 text-right tabular-nums">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Avg score meter */}
          <div className="mt-5 pt-4 border-t border-gray-50 dark:border-white/5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Portfolio Average
              </span>
              <span className={`text-sm font-extrabold ${avgToneClass}`}>
                {data.avgScore}/100
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full ${avgBarClass}`}
                style={{ width: `${data.avgScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Needs attention */}
        <div className="lg:col-span-7 bg-white dark:bg-brand-darker/60 border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                Needs Attention
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Your weakest ads — biggest opportunities first.
              </p>
            </div>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>

          <div className="space-y-2">
            {data.needsAttention.map((w) => (
              <button
                key={w.ad.id}
                onClick={() => onSelect(w.ad)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition text-left group"
              >
                <div className="flex-shrink-0">
                  <AdStrengthBadge result={w.strength} showBar={false} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {w.ad.name || "Untitled ad"}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 border border-gray-200 dark:border-white/10 rounded px-1 py-px">
                      {w.ad.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {w.strength.topSuggestion || "All strength checks passed."}
                  </p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top portfolio issues */}
      {data.topIssues.length > 0 && (
        <div className="bg-white dark:bg-brand-darker/60 border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">
              Top Optimisation Opportunities
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {data.topIssues.map((issue) => (
              <div
                key={issue.label}
                className="rounded-xl border border-gray-100 dark:border-white/5 p-3.5"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-100">
                    {issue.label}
                  </span>
                  <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 rounded-full px-2 py-0.5">
                    {issue.count} ad{issue.count === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  {issue.hint}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
