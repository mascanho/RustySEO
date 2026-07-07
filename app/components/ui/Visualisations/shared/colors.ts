// Shared chart palette — reuses the hues already established in
// DashboardSEO.tsx / OverviewChart.tsx so the Visualisations suite reads as
// part of the same product rather than a bolted-on chart library demo.
//
// Rules followed throughout every chart in this module:
//  - Categorical series are assigned hues from CATEGORICAL in fixed order —
//    never cycled, never reassigned when a filter changes the series count.
//  - Status colors (good/warning/serious/critical) are reserved for
//    status/health meaning (status codes, indexability, coverage) and never
//    reused as a plain "series 4" color.
//  - A single-series chart (e.g. one bar series across ordered buckets) uses
//    ONE hue throughout — color is not spent decorating a chart that has no
//    identity to distinguish.

export const STATUS = {
  good: "#10b981", // emerald — 2xx, indexable, covered, fast
  info: "#38bdf8", // sky — neutral/primary single-series default
  warning: "#f59e0b", // amber — 3xx, partial coverage, average
  serious: "#f97316", // orange — 4xx, weak signal
  critical: "#ef4444", // red — 5xx, non-indexable, slow, orphaned
} as const;

// Fixed-order categorical ramp. Index 0 is always used first; a 9th+ series
// folds into a neutral "Other" rather than generating a new hue.
export const CATEGORICAL = [
  "#38bdf8", // sky
  "#a855f7", // purple
  "#eab308", // yellow
  "#10b981", // emerald
  "#f97316", // orange
  "#ec4899", // pink
  "#6366f1", // indigo
  "#14b8a6", // teal
] as const;

export const CATEGORICAL_OTHER = "#94a3b8"; // slate — the fixed "Other" bucket color

export const NEUTRAL = {
  grid: { light: "rgba(0,0,0,0.06)", dark: "rgba(255,255,255,0.06)" },
  axis: { light: "#64748b", dark: "#94a3b8" },
  tooltipBg: { light: "#ffffff", dark: "#0f172a" },
  tooltipBorder: { light: "#e2e8f0", dark: "#1e293b" },
  tooltipText: { light: "#0f172a", dark: "#ffffff" },
};

export function tooltipStyle(isDark: boolean) {
  return {
    contentStyle: {
      backgroundColor: isDark ? NEUTRAL.tooltipBg.dark : NEUTRAL.tooltipBg.light,
      border: `1px solid ${isDark ? NEUTRAL.tooltipBorder.dark : NEUTRAL.tooltipBorder.light}`,
      borderRadius: "8px",
      fontSize: "11px",
      color: isDark ? NEUTRAL.tooltipText.dark : NEUTRAL.tooltipText.light,
    },
    itemStyle: { color: isDark ? NEUTRAL.tooltipText.dark : NEUTRAL.tooltipText.light },
    labelStyle: { color: isDark ? NEUTRAL.tooltipText.dark : NEUTRAL.tooltipText.light },
  };
}

export function axisStyle(isDark: boolean) {
  return {
    style: { fontSize: "10px", fill: isDark ? NEUTRAL.axis.dark : NEUTRAL.axis.light },
    tickLine: false,
    axisLine: false,
  };
}

export function gridStroke(isDark: boolean) {
  return isDark ? NEUTRAL.grid.dark : NEUTRAL.grid.light;
}
