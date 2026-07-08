// @ts-nocheck
"use client";

import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { Copy, Settings2, CheckCircle } from "lucide-react";

type DuplicatePage = {
  url: string;
  title: string | null;
  word_count: number;
};

type DuplicateGroup = {
  kind: "headings" | "content";
  similarity: number;
  pages: DuplicatePage[];
};

type DuplicateContentReport = {
  enabled: boolean;
  groups: DuplicateGroup[];
};

export default function Duplicates() {
  const [duplicateReport, setDuplicateReport] =
    useState<DuplicateContentReport | null>(null);
  const [duplicateLoading, setDuplicateLoading] = useState(false);

  const fetchDuplicateContent = async () => {
    setDuplicateLoading(true);
    try {
      const result = await invoke<DuplicateContentReport>(
        "find_duplicate_content_command",
      );
      setDuplicateReport(result);
    } catch (e) {
      console.error("Failed to fetch duplicate content report:", e);
      toast.error("Failed to run duplicate content analysis");
    } finally {
      setDuplicateLoading(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 dark:bg-brand-darker px-6 py-4 select-none">
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Duplicate Content Detection
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg">
              Clusters pages that share identical headings or near-identical
              body content, using fingerprints captured during the crawl. Runs
              on demand — nothing is computed automatically.
            </p>
          </div>
          <button
            onClick={fetchDuplicateContent}
            disabled={duplicateLoading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-bright  hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shrink-0"
          >
            <Copy className="w-4 h-4" />
            {duplicateLoading ? "Analyzing..." : "Run Duplicate Analysis"}
          </button>
        </div>

        {!duplicateReport ? (
          <div className="py-14 text-center flex flex-col items-center gap-2">
            <Copy className="w-8 h-8 text-slate-300 dark:text-slate-700" />
            <span className="text-xs text-slate-400 max-w-sm">
              {duplicateLoading
                ? "Comparing fingerprints across the crawl..."
                : 'Click "Run Duplicate Analysis" to scan the most recent crawl for similar or identical pages.'}
            </span>
          </div>
        ) : !duplicateReport.enabled ? (
          <div className="py-14 flex flex-col items-center gap-3 text-center">
            <Settings2 className="w-8 h-8 text-amber-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Duplicated Content Check is disabled
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
              This is an opt-in check since fingerprinting adds per-page
              processing time. Enable{" "}
              <span className="font-semibold">
                Settings → Crawler → Duplicated Content Check
              </span>{" "}
              and re-run a crawl, then come back to this tab.
            </p>
          </div>
        ) : duplicateReport.groups.length === 0 ? (
          <div className="py-14 flex flex-col items-center gap-2 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No duplicate or near-duplicate pages found
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
              If this crawl predates enabling the check, pages won't have a
              fingerprint yet — re-run the crawl and analyze again.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {duplicateReport.groups.map((group, idx) => (
              <div
                key={idx}
                className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                        group.kind === "headings"
                          ? "bg-indigo-500/10 text-indigo-500"
                          : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {group.kind === "headings"
                        ? "Identical Headings"
                        : "Similar Content"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {group.pages.length} pages
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                    {group.similarity}% match
                  </span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {group.pages.map((page, pIdx) => (
                    <div
                      key={pIdx}
                      className="flex items-center justify-between gap-3 px-4 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                          {page.title || "(untitled)"}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {page.url}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {page.word_count.toLocaleString()} words
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
