// @ts-nocheck
import { AlertTriangle, Check } from "lucide-react";
import type { Ad } from "@/types/ad";

interface KeywordValidatorProps {
  validationResults: {
    valid: boolean;
    missingKeywords: string[];
  };
  adContent: Ad;
}

export function KeywordValidator({
  validationResults,
  adContent,
}: KeywordValidatorProps) {
  // If no keywords, show nothing
  if (!adContent.keywords.length) {
    return null;
  }

  if (validationResults.valid) {
    return (
      <div className="flex flex-col gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl animate-in fade-in duration-300">
        <div className="flex items-center gap-2">
          <div className="p-1 dark:bg-emerald-500/20 bg-emerald-100 rounded-full">
            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h5 className="text-[11px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400">
            Ad Copy Optimized
          </h5>
        </div>
        <p className="text-xs text-emerald-700 dark:text-emerald-400/80 leading-relaxed font-medium">
          Brilliant! All of your targeted keywords are correctly included in your ad headlines and descriptions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-orange-50/50 dark:bg-orange-500/5 border border-orange-200 dark:border-orange-500/20 rounded-xl animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <div className="p-1 dark:bg-orange-500/20 bg-orange-100 rounded-full">
          <AlertTriangle className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
        </div>
        <h5 className="text-[11px] font-black uppercase tracking-widest text-orange-800 dark:text-orange-400">
          Optimization Required
        </h5>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-orange-700 dark:text-orange-400/80 leading-relaxed font-medium">
          The following keywords are currently missing from your ad creative:
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {validationResults.missingKeywords.map((keyword, index) => (
            <span key={index} className="px-2 py-0.5 bg-orange-100/50 dark:bg-orange-500/10 text-[10px] font-bold text-orange-600 dark:text-orange-400 rounded-md border border-orange-200/50 dark:border-orange-500/10">
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
