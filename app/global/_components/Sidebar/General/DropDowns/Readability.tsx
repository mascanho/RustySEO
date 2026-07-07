// @ts-nocheck
import useGlobalCrawlStore, { useCrawlDataVersion } from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState, memo } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

const EMPTY_ARRAY: any[] = [];

const Readability = () => {
  const [isOpen, setIsOpen] = useState(false);
  const crawlDataVersion = useCrawlDataVersion();
  const crawlData = useMemo(() => {
    if (!isOpen) return EMPTY_ARRAY;
    return useGlobalCrawlStore.getState().crawlData || [];
  }, [isOpen, crawlDataVersion]);

  const stats = useMemo(() => {
    let easy = 0; // Flesch 70-100 — Fairly Easy or better
    let standard = 0; // 50-69
    let difficult = 0; // 0-49
    let fleschTotal = 0;
    let fleschCount = 0;
    let thinRatio = 0; // text-to-HTML ratio under 10%
    let ratioCount = 0;

    crawlData.forEach((item) => {
      const flesch = item?.flesch;
      if (flesch !== undefined && flesch !== null) {
        fleschTotal += flesch;
        fleschCount++;

        if (flesch >= 70) easy++;
        else if (flesch >= 50) standard++;
        else difficult++;
      }

      const ratio = item?.text_ratio;
      if (ratio !== undefined && ratio !== null) {
        ratioCount++;
        if (ratio < 10) thinRatio++;
      }
    });

    return {
      easy,
      standard,
      difficult,
      fleschCount,
      thinRatio,
      ratioCount,
      avgFlesch: fleschCount > 0 ? (fleschTotal / fleschCount).toFixed(0) : "N/A",
    };
  }, [crawlData]);

  const sections = useMemo(() => {
    const pct = (count: number, total: number) =>
      total > 0 ? `${((count / total) * 100).toFixed(0)}%` : "0%";

    return [
      { label: "Average Reading Ease", value: stats.avgFlesch, percentage: "" },
      {
        label: "Easy to Read (70-100)",
        value: stats.easy,
        percentage: pct(stats.easy, stats.fleschCount),
        color: "text-green-500",
      },
      {
        label: "Standard (50-69)",
        value: stats.standard,
        percentage: pct(stats.standard, stats.fleschCount),
        color: "text-yellow-500",
      },
      {
        label: "Difficult (0-49)",
        value: stats.difficult,
        percentage: pct(stats.difficult, stats.fleschCount),
        color: "text-red-500",
      },
      {
        label: "Low Text-to-HTML Ratio (<10%)",
        value: stats.thinRatio,
        percentage: pct(stats.thinRatio, stats.ratioCount),
        color: "text-orange-500",
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
          <span className="ml-1">Readability</span>
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

export default memo(Readability);
