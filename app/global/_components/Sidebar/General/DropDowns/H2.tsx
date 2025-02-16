// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo } from "react";

const H2 = () => {
  const { crawlData } = useGlobalCrawlStore();

  // Ensure crawlData is always an array
  const safeCrawlData = Array.isArray(crawlData) ? crawlData : [];

  // Memoize H2 analysis
  const { counts, totalPages, missingH2Count } = useMemo(() => {
    // Extract all H2 headings from crawlData
    const h2Headings = safeCrawlData
      .map((item) => item?.headings?.h2 || [])
      .flat();

    // Filter out empty or undefined H2 headings
    const validH2Headings = h2Headings.filter((heading) => heading?.trim());

    // Get unique H2 headings
    const uniqueH2Headings = [...new Set(validH2Headings)];

    // Calculate counts
    const counts = {
      exists: validH2Headings.length, // Number of valid H2 headings
      all: h2Headings.length, // Total H2 headings (including empty/undefined)
      empty: h2Headings.length - validH2Headings.length, // Empty/undefined H2 headings
      duplicate: h2Headings.length - uniqueH2Headings.length, // Duplicate H2 headings
      long: uniqueH2Headings.filter((heading) => heading.length > 155).length, // H2s over 155 characters
      short: uniqueH2Headings.filter((heading) => heading.length < 70).length, // H2s under 70 characters
      noH2Object: safeCrawlData.filter((item) => !item?.headings?.h2?.length)
        .length, // Pages without H2 headings
    };

    const totalPages = safeCrawlData.length;
    const missingH2Count = Math.abs(totalPages - counts.exists);

    return {
      counts,
      totalPages,
      missingH2Count,
    };
  }, [safeCrawlData]);

  // Sections to display
  const sections = [
    { label: "Total", count: counts.exists },
    { label: "Missing", count: missingH2Count },
    { label: "Duplicate H2 Headings", count: counts.duplicate },
    { label: "Over 155 Characters", count: counts.long },
    { label: "Below 70 Characters", count: counts.short },
  ];

  // Helper function to calculate percentage
  const calculatePercentage = (count: number, total: number): string => {
    if (!total) return "0%";
    return `${Math.min(((count / total) * 100).toFixed(0), 100)}%`;
  };

  return (
    <div className="text-sx w-full">
      <details className="w-full">
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer flex items-center">
          <span>H2</span>
        </summary>
        <div className="w-full">
          {sections.map(({ label, count }) => (
            <div
              key={label}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className="w-2/3 pl-2.5 py-1 text-brand-bright">{label}</div>
              <div className="w-1/6 text-right pr-2">{count}</div>
              <div className="w-1/6 text-center pl-2">
                {calculatePercentage(
                  label === "Missing"
                    ? missingH2Count
                    : label === "Below 70 Characters"
                      ? counts.short
                      : count,
                  label === "Total" ? totalPages : counts.all,
                )}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default H2;
