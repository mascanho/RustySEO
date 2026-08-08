// @ts-nocheck
import useGlobalCrawlStore, { useCrawlDataVersion } from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState, memo } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

const EMPTY_ARRAY: any[] = [];

interface CustomSearchMatch {
  rule_id: number;
  rule_name: string;
  matched: boolean;
  value: string | null;
}

interface CrawlDataItem {
  custom_search?: CustomSearchMatch[];
}

const CustomSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const crawlDataVersion = useCrawlDataVersion();
  const domainCrawlData = useMemo(() => {
    if (!isOpen) return EMPTY_ARRAY;
    return useGlobalCrawlStore.getState().crawlData || [];
  }, [isOpen, crawlDataVersion]);

  const crawlData: CrawlDataItem[] = useMemo(
    () => domainCrawlData || [],
    [domainCrawlData],
  );

  // One row per rule name that appeared on at least one page, counting pages
  // where it actually matched — replaces the old fixed HTML/CSS/Regex triad
  // (which only ever reflected a single rule and always showed CSS/Regex as 0).
  const perRuleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of crawlData) {
      for (const match of item?.custom_search || []) {
        if (match.matched) {
          counts.set(match.rule_name, (counts.get(match.rule_name) || 0) + 1);
        }
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [crawlData]);

  const totalPagesMatched = useMemo(() => {
    let total = 0;
    for (const item of crawlData) {
      if ((item?.custom_search || []).some((m) => m.matched)) total++;
    }
    return total;
  }, [crawlData]);

  return (
    <div className="text-xs w-full">
      <div className="w-full cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="text-xs font-semibold border-b dark:border-b-brand-dark pl-1 p-1 flex items-center">
          <span className="">
            {isOpen ? (
              <FiChevronDown size={14} />
            ) : (
              <FiChevronRight size={14} />
            )}
          </span>
          <span className="ml-1">Custom Search</span>
        </div>
      </div>

      {isOpen && (
        <div className="w-full">
          <div className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark">
            <div className="w-2/3 pl-2.5 py-1 text-brand-bright">
              Total Pages Matched
            </div>
            <div className="w-1/6 text-right pr-2">{totalPagesMatched}</div>
            <div className="w-1/6 text-right pr-2">
              {crawlData.length > 0
                ? `${((totalPagesMatched / crawlData.length) * 100).toFixed(0)}%`
                : "0%"}
            </div>
          </div>
          {perRuleCounts.length === 0 ? (
            <div className="px-2 py-2 text-gray-400 dark:text-gray-500 text-xs">
              No active rules have matched yet.
            </div>
          ) : (
            perRuleCounts.map(([ruleName, count]) => (
              <div
                key={ruleName}
                className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
              >
                <div className="w-2/3 pl-2.5 py-1 text-brand-bright truncate">
                  {ruleName}
                </div>
                <div className="w-1/6 text-right pr-2">{count}</div>
                <div className="w-1/6 text-right pr-2">
                  {crawlData.length > 0
                    ? `${((count / crawlData.length) * 100).toFixed(0)}%`
                    : "0%"}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default memo(CustomSearch);
