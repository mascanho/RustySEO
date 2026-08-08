// @ts-nocheck
"use client";

import React, { useMemo } from "react";
import { Check, X } from "lucide-react";

interface CustomSearchMatch {
  rule_id: number;
  rule_name: string;
  matched: boolean;
  value: string | null;
}

interface CustomSearchResultRow {
  url: string;
  matches: CustomSearchMatch[];
}

interface CustomSearchRule {
  id: number;
  name: string;
  enabled: boolean;
}

interface TableCustomSearchProps {
  rows: CustomSearchResultRow[];
  rules: CustomSearchRule[];
}

const MAX_CELL_LEN = 60;

const truncate = (value: string | null | undefined) => {
  if (!value) return "";
  return value.length > MAX_CELL_LEN ? `${value.slice(0, MAX_CELL_LEN)}…` : value;
};

export default function TableCustomSearch({ rows, rules }: TableCustomSearchProps) {
  const activeRules = useMemo(() => rules.filter((r) => r.enabled), [rules]);

  if (activeRules.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-gray-400 dark:text-gray-500 p-8 text-center">
        No active Custom Search rules. Open Extractors &gt; Custom Search to add one.
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-gray-400 dark:text-gray-500 p-8 text-center">
        No pages have matched any active rule yet.
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto custom-scrollbar">
      <table className="min-w-full text-xs border-collapse">
        <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-brand-dark">
          <tr>
            <th className="text-left font-semibold px-3 py-2 border-b border-gray-200 dark:border-brand-dark/80 text-gray-600 dark:text-gray-300 min-w-[280px]">
              URL
            </th>
            {activeRules.map((rule) => (
              <th
                key={rule.id}
                className="text-left font-semibold px-3 py-2 border-b border-gray-200 dark:border-brand-dark/80 text-gray-600 dark:text-gray-300 min-w-[220px]"
              >
                {rule.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.url + i}
              className="border-b border-gray-100 dark:border-brand-dark/40 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
            >
              <td
                className="px-3 py-1.5 text-gray-700 dark:text-gray-300 truncate max-w-[380px]"
                title={row.url}
              >
                {row.url}
              </td>
              {activeRules.map((rule) => {
                const match = row.matches?.find((m) => m.rule_id === rule.id);
                return (
                  <td key={rule.id} className="px-3 py-1.5">
                    {match?.matched ? (
                      <span className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <Check className="w-3 h-3 text-green-500 shrink-0" strokeWidth={3} />
                        <span title={match.value || ""}>{truncate(match.value) || "—"}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-gray-300 dark:text-gray-600">
                        <X className="w-3 h-3 shrink-0" strokeWidth={3} />
                        no match
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
