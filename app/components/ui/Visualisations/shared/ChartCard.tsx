import React from "react";

interface ChartCardProps {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
  /** Optional extra content rendered top-right of the header (e.g. a legend or stat). */
  headerExtra?: React.ReactNode;
}

// Consistent chrome for every visualisation panel — title, description, and
// a body slot. Keeping this in one place means every chart file only has to
// own its actual chart logic, not card styling.
export function ChartCard({
  title,
  description,
  className = "",
  children,
  headerExtra,
}: ChartCardProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm flex flex-col ${className}`}
    >
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
            {title}
          </h3>
          {description && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {description}
            </p>
          )}
        </div>
        {headerExtra}
      </div>
      <div className="flex-1 mt-3 min-h-0">{children}</div>
    </div>
  );
}

export default ChartCard;
