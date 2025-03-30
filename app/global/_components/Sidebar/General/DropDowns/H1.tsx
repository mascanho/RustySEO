// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useEffect, memo } from "react";

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

const H1 = () => {
  const { crawlData, setHeadingsH1 } = useGlobalCrawlStore();

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
        label: "Total",
        count: counts.exists,
        percentage: calculatePercentage(counts.exists, totalPages),
      },
      {
        label: "Missing",
        count: missingH1Count,
        percentage: calculatePercentage(missingH1Count, totalPages),
      },
      {
        label: "Duplicate H1 Headings",
        count: counts.duplicate,
        percentage: calculatePercentage(counts.duplicate, counts.all),
      },
      {
        label: "Over 155 Characters",
        count: counts.long,
        percentage: calculatePercentage(counts.long, counts.all),
      },
      {
        label: "Below 70 Characters",
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
    <div className="text-sx w-full">
      <details className="w-full">
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer flex items-center">
          <span>H1</span>
        </summary>
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
      </details>
    </div>
  );
};

export default memo(H1);
