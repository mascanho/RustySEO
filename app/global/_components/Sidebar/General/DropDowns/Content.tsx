// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useEffect, memo, useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

interface H1Counts {
  exists: number; // Number of valid H1 headings
  all: number; // Total H1 headings (including empty/undefined)
  empty: number; // Empty/undefined H1 headings
  duplicate: number; // Duplicate H1 headings
  long: number; // H1s over 155 characters
  short: number; // H1s under 70 characters
  noH1Object: number; // Pages without H1 headings
}

interface Section {
  label: string;
  count: number;
  percentage: string;
}

const Content = () => {
  const { crawlData, setHeadingsH1 } = useGlobalCrawlStore();
  const [isOpen, setIsOpen] = useState(false);

  // Ensure crawlData is always an array
  const safeCrawlData = useMemo(
    () => (Array.isArray(crawlData) ? crawlData : []),
    [crawlData],
  );

  // Memoize H1 analysis
  const { counts, totalPages, missingH1Count } = useMemo(() => {
    // Extract all H1 headings from crawlData
    const h1Headings = safeCrawlData
      .map((item) => item?.headings?.h1 || [])
      .flat();

    // Filter out empty or undefined H1 headings
    const validH1Headings = h1Headings.filter((heading) => heading?.trim());

    // Get unique H1 headings
    const uniqueH1Headings = [...new Set(validH1Headings)];

    // Calculate counts
    const counts: H1Counts = {
      exists: validH1Headings.length, // Number of valid H1 headings
      all: h1Headings.length, // Total H1 headings (including empty/undefined)
      empty: h1Headings.length - validH1Headings.length, // Empty/undefined H1 headings
      duplicate: h1Headings.length - uniqueH1Headings.length, // Duplicate H1 headings
      long: uniqueH1Headings.filter((heading) => heading.length > 155).length, // H1s over 155 characters
      short: uniqueH1Headings.filter((heading) => heading.length < 70).length, // H1s under 70 characters
      noH1Object: safeCrawlData.filter((item) => !item?.headings?.h1?.length)
        .length, // Pages without H1 headings
    };

    const totalPages = safeCrawlData.length;
    const missingH1Count = Math.abs(totalPages - counts.exists);

    return {
      counts,
      totalPages,
      missingH1Count,
    };
  }, [safeCrawlData]);

  // Memoize sections to avoid recalculating on every render
  const sections: Section[] = useMemo(() => {
    const calculatePercentage = (count: number, total: number): string => {
      if (!total) return "0%";
      return `${Math.min(((count / total) * 100).toFixed(0), 100)}%`;
    };

    return [
      {
        label: "All",
        count: counts.exists,
        percentage: calculatePercentage(counts.exists, totalPages),
      },
      {
        label: "HTTP URLs",
        count: missingH1Count,
        percentage: calculatePercentage(missingH1Count, totalPages),
      },
      {
        label: "HTTPS URLs",
        count: counts.duplicate,
        percentage: calculatePercentage(counts.duplicate, counts.all),
      },
      {
        label: "Mixed Content",
        count: counts.long,
        percentage: calculatePercentage(counts.long, counts.all),
      },
      {
        label: "Unsafe Cross-Origin Links",
        count: counts.short,
        percentage: calculatePercentage(counts.short, counts.all),
      },
    ];
  }, [counts, totalPages, missingH1Count]);

  // Update headingsH1 state when sections change
  useEffect(() => {
    if (typeof setHeadingsH1 === "function") {
      setHeadingsH1(sections);
    }
  }, [sections, setHeadingsH1]);

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
          <span className="ml-1">Content</span>
        </div>
      </div>

      {isOpen && (
        <div className="w-full">
          {sections.map(({ label, count, percentage }) => (
            <div
              key={label}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className="w-2/3 pl-2.5 py-1 text-brand-bright">{label}</div>
              <div className="w-1/6 text-right pr-2">{count}</div>
              <div className="w-1/6 text-center pl-2">{percentage}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(Content);
