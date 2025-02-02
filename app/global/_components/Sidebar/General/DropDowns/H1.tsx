import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo } from "react";

const H1 = () => {
  const domainCrawlData = useGlobalCrawlStore();

  // Memoize crawlData to avoid recalculating on every render
  const crawlData = domainCrawlData?.crawlData || [];

  // Memoize H1 analysis
  const { counts, totalPages, missingH1Count } = useMemo(() => {
    // Extract all H1 headings from crawlData
    const h1Headings = crawlData
      ?.map((item) => item?.headings?.h1 || [])
      .flat();

    // Filter out empty or undefined H1 headings
    const validH1Headings = h1Headings.filter((heading) => heading?.trim());

    // Get unique H1 headings
    const uniqueH1Headings = [...new Set(validH1Headings)];

    // Calculate counts
    const counts = {
      exists: validH1Headings.length, // Number of valid H1 headings
      all: h1Headings.length, // Total H1 headings (including empty/undefined)
      empty: h1Headings.length - validH1Headings.length, // Empty/undefined H1 headings
      duplicate: h1Headings.length - uniqueH1Headings.length, // Duplicate H1 headings
      long: uniqueH1Headings.filter((heading) => heading.length > 155).length, // H1s over 155 characters
      short: uniqueH1Headings.filter((heading) => heading.length < 70).length, // H1s under 70 characters
      noH1Object: crawlData.filter((item) => !item?.headings?.h1?.length)
        .length, // Pages without H1 headings
    };

    const totalPages = crawlData.length;
    const missingH1Count = Math.abs(totalPages - counts.exists);

    return {
      counts,
      totalPages,
      missingH1Count,
    };
  }, [crawlData]);

  // Memoize sections to avoid recalculating on every render
  const sections = useMemo(
    () => [
      { label: "Total", count: counts.exists },
      { label: "Missing", count: missingH1Count },
      { label: "Duplicate H1 Headings", count: counts.duplicate },
      { label: "Over 155 Characters", count: counts.long },
      { label: "Below 70 Characters", count: counts.short },
    ],
    [counts, missingH1Count],
  );

  return (
    <div className="text-sx w-full">
      <details className="w-full">
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer flex items-center">
          <span>H1</span>
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
                {totalPages
                  ? (
                      ((label === "Missing" ? missingH1Count : count) /
                        totalPages) *
                      100
                    ).toFixed(0) + "%"
                  : "0%"}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default H1;
