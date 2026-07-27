// @ts-nocheck
"use client";

import { Check, X, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { Ad } from "@/types/ad";
import {
  computeAdStrength,
  type AdStrengthResult,
  type StrengthTone,
} from "./utils/ad-strength";

const TONE: Record<
  StrengthTone,
  { text: string; bar: string; soft: string; ring: string; border: string }
> = {
  slate: {
    text: "text-slate-500",
    bar: "bg-slate-400",
    soft: "bg-slate-500/10",
    ring: "#94a3b8",
    border: "border-slate-300/40",
  },
  rose: {
    text: "text-rose-500",
    bar: "bg-rose-500",
    soft: "bg-rose-500/10",
    ring: "#f43f5e",
    border: "border-rose-400/40",
  },
  amber: {
    text: "text-amber-500",
    bar: "bg-amber-500",
    soft: "bg-amber-500/10",
    ring: "#f59e0b",
    border: "border-amber-400/40",
  },
  sky: {
    text: "text-sky-500",
    bar: "bg-sky-500",
    soft: "bg-sky-500/10",
    ring: "#0ea5e9",
    border: "border-sky-400/40",
  },
  emerald: {
    text: "text-emerald-500",
    bar: "bg-emerald-500",
    soft: "bg-emerald-500/10",
    ring: "#10b981",
    border: "border-emerald-400/40",
  },
};

// ---------------------------------------------------------------------------
// Compact badge — used on list cards and dense rows.
// ---------------------------------------------------------------------------
export function AdStrengthBadge({
  ad,
  result,
  showBar = true,
}: {
  ad?: Ad;
  result?: AdStrengthResult;
  showBar?: boolean;
}) {
  const r = result || computeAdStrength(ad as Ad);
  const tone = TONE[r.tone];
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full pl-1.5 pr-2 py-0.5 ${tone.soft}`}
      title={`Ad Strength: ${r.level} (${r.score}/100)`}
    >
      <Zap className={`h-3 w-3 ${tone.text}`} fill="currentColor" />
      <span className={`text-[9px] font-bold uppercase tracking-wide ${tone.text}`}>
        {r.level}
      </span>
      {showBar && (
        <span className="w-8 h-1 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
          <span
            className={`block h-full rounded-full ${tone.bar}`}
            style={{ width: `${r.score}%` }}
          />
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Full meter — used in the editor. Gauge + level + collapsible checklist.
// ---------------------------------------------------------------------------
export function AdStrengthMeter({
  ad,
  result,
  defaultOpen = true,
}: {
  ad?: Ad;
  result?: AdStrengthResult;
  defaultOpen?: boolean;
}) {
  const r = result || computeAdStrength(ad as Ad);
  const tone = TONE[r.tone];
  const [open, setOpen] = useState(defaultOpen);

  const C = 2 * Math.PI * 26;

  return (
    <div className="bg-white dark:bg-brand-darker/60 rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Gauge */}
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              strokeWidth="7"
              className="stroke-gray-100 dark:stroke-white/10"
            />
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              stroke={tone.ring}
              strokeDasharray={C}
              strokeDashoffset={C * (1 - r.score / 100)}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-extrabold text-gray-900 dark:text-white leading-none">
              {r.score}
            </span>
            <span className="text-[7px] font-bold uppercase tracking-wider text-gray-400">
              / 100
            </span>
          </div>
        </div>

        {/* Level + summary */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Zap className={`h-4 w-4 ${tone.text}`} fill="currentColor" />
            <span className={`text-base font-black ${tone.text}`}>
              {r.level}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Ad Strength
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
            {r.topSuggestion
              ? r.topSuggestion
              : "Great work — this ad meets every strength check."}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full ${tone.bar}`}
                style={{ width: `${r.score}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-gray-400 tabular-nums">
              {r.passedCount}/{r.totalCount}
            </span>
          </div>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          title={open ? "Hide checklist" : "Show checklist"}
        >
          {open ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 mt-4 pt-4 border-t border-gray-50 dark:border-white/5">
          {r.checks.map((c) => (
            <div
              key={c.id}
              className="flex items-start gap-2 py-1"
              title={c.hint}
            >
              <span
                className={`mt-0.5 shrink-0 flex items-center justify-center w-4 h-4 rounded-full ${
                  c.passed
                    ? "bg-emerald-500/15 text-emerald-500"
                    : "bg-gray-200/60 dark:bg-white/10 text-gray-400"
                }`}
              >
                {c.passed ? (
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                ) : (
                  <X className="h-2.5 w-2.5" strokeWidth={3} />
                )}
              </span>
              <span
                className={`text-[11px] font-medium leading-tight ${
                  c.passed
                    ? "text-gray-500 dark:text-gray-400"
                    : "text-gray-700 dark:text-gray-200"
                }`}
              >
                {c.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
