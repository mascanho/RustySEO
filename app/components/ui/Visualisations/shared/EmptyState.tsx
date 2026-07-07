import React from "react";
import { Database } from "lucide-react";

// Shown by any chart when the field(s) it needs aren't present on this
// dataset (e.g. link scoring disabled, no redirects found).
export function EmptyState({
  message = "No data available for this visualisation yet.",
}: {
  message?: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-10 text-center gap-2">
      <Database className="w-8 h-8 text-slate-300 dark:text-slate-700" />
      <p className="text-xs text-slate-400 max-w-xs">{message}</p>
    </div>
  );
}

export default EmptyState;
