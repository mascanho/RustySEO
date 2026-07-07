// @ts-nocheck
import useGlobalCrawlStore, { useCrawlDataVersion } from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState, memo } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

const EMPTY_ARRAY: any[] = [];

const LinkScore = () => {
  const [isOpen, setIsOpen] = useState(false);
  const crawlDataVersion = useCrawlDataVersion();
  const crawlData = useMemo(() => {
    if (!isOpen) return EMPTY_ARRAY;
    return useGlobalCrawlStore.getState().crawlData || [];
  }, [isOpen, crawlDataVersion]);

  const stats = useMemo(() => {
    let strong = 0; // 70-100
    let moderate = 0; // 40-69
    let weak = 0; // 1-39
    let orphaned = 0; // 0 — no internal links pointing at the page
    let scored = 0;
    let total = 0;

    crawlData.forEach((item) => {
      const score = item?.link_score;
      if (score === undefined || score === null) return;

      scored++;
      total += score;

      if (score === 0) orphaned++;
      else if (score < 40) weak++;
      else if (score < 70) moderate++;
      else strong++;
    });

    return {
      strong,
      moderate,
      weak,
      orphaned,
      scored,
      avg: scored > 0 ? (total / scored).toFixed(0) : "N/A",
    };
  }, [crawlData]);

  const sections = useMemo(() => {
    const pct = (count: number) =>
      stats.scored > 0 ? `${((count / stats.scored) * 100).toFixed(0)}%` : "0%";

    return [
      { label: "Average Link Score", value: stats.avg, percentage: "" },
      {
        label: "Strong (70-100)",
        value: stats.strong,
        percentage: pct(stats.strong),
        color: "text-green-500",
      },
      {
        label: "Moderate (40-69)",
        value: stats.moderate,
        percentage: pct(stats.moderate),
        color: "text-yellow-500",
      },
      {
        label: "Weak (1-39)",
        value: stats.weak,
        percentage: pct(stats.weak),
        color: "text-orange-500",
      },
      {
        label: "Orphaned (0 Score)",
        value: stats.orphaned,
        percentage: pct(stats.orphaned),
        color: "text-red-500",
      },
    ];
  }, [stats]);

  return (
    <div className="text-xs w-full">
      <div className="w-full cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="text-xs font-semibold border-b dark:border-b-brand-dark pl-1 p-1 flex items-center">
          <span>
            {isOpen ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
          </span>
          <span className="ml-1">Link Score</span>
        </div>
      </div>

      {isOpen && (
        <div className="w-full">
          {sections.map((item, index) => (
            <div
              key={index}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className={`w-2/3 pl-2.5 py-1 ${item.color || "text-brand-bright"}`}>
                {item.label}
              </div>
              <div className="w-1/6 text-right pr-2">{item.value}</div>
              <div className="w-1/6 text-right pr-2">{item.percentage}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(LinkScore);
