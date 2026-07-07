// @ts-nocheck
import useGlobalCrawlStore, { useCrawlDataVersion } from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState, memo } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

const EMPTY_ARRAY: any[] = [];

const PageWeight = () => {
  const [isOpen, setIsOpen] = useState(false);
  const crawlDataVersion = useCrawlDataVersion();
  const crawlData = useMemo(() => {
    if (!isOpen) return EMPTY_ARRAY;
    return useGlobalCrawlStore.getState().crawlData || [];
  }, [isOpen, crawlDataVersion]);

  const stats = useMemo(() => {
    let light = 0; // < 100 KB
    let medium = 0; // 100-500 KB
    let heavy = 0; // 500 KB-1 MB
    let veryHeavy = 0; // > 1 MB
    let totalKb = 0;
    let count = 0;

    crawlData.forEach((item) => {
      const kb = item?.page_size?.[0]?.kb;
      if (kb === undefined || kb === null) return;

      count++;
      totalKb += kb;

      if (kb < 100) light++;
      else if (kb < 500) medium++;
      else if (kb < 1024) heavy++;
      else veryHeavy++;
    });

    return {
      light,
      medium,
      heavy,
      veryHeavy,
      count,
      avgKb: count > 0 ? (totalKb / count).toFixed(0) : "N/A",
    };
  }, [crawlData]);

  const sections = useMemo(() => {
    const pct = (count: number) =>
      stats.count > 0 ? `${((count / stats.count) * 100).toFixed(0)}%` : "0%";

    return [
      {
        label: "Average Page Size",
        value: stats.avgKb !== "N/A" ? `${stats.avgKb} KB` : "N/A",
        percentage: "",
      },
      {
        label: "Light (< 100 KB)",
        value: stats.light,
        percentage: pct(stats.light),
        color: "text-green-500",
      },
      {
        label: "Medium (100-500 KB)",
        value: stats.medium,
        percentage: pct(stats.medium),
        color: "text-yellow-500",
      },
      {
        label: "Heavy (500 KB-1 MB)",
        value: stats.heavy,
        percentage: pct(stats.heavy),
        color: "text-orange-500",
      },
      {
        label: "Very Heavy (> 1 MB)",
        value: stats.veryHeavy,
        percentage: pct(stats.veryHeavy),
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
          <span className="ml-1">Page Weight</span>
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

export default memo(PageWeight);
