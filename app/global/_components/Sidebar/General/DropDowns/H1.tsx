import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo } from "react";

const H1 = () => {
  const domainCrawlData = useGlobalCrawlStore();

  // Memoize crawlData to avoid recalculating on every render
  const crawlData = domainCrawlData?.crawlData || [];

  // Memoize H1 headings and their counts
  const { h1Headings, uniqueH1Headings, counts, totalPages, missingH1Count } =
    useMemo(() => {
      const h1Headings = crawlData
        .map((item) => item?.headings?.h1 || [])
        .flat();
      const uniqueH1Headings = [...new Set(h1Headings)];
      const h1Exists = h1Headings.filter(
        (heading) => heading && heading !== "",
      );

      const counts = {
        exists: h1Exists.length,
        all: h1Headings.length,
        empty: h1Headings.filter((heading) => !heading).length,
        duplicate: h1Headings.length - uniqueH1Headings.length,
        long: uniqueH1Headings.filter((heading) => heading?.length > 155)
          .length,
        short: uniqueH1Headings.filter((heading) => heading?.length < 70)
          .length,
        noH1Object: crawlData.filter(
          (item) => !item?.headings?.h1 || item?.headings?.h1.length === 0,
        ).length,
      };

      const totalPages = crawlData.length;
      const missingH1Count = Math.abs(
        totalPages - (counts.noH1Object + counts.empty),
      );

      return {
        h1Headings,
        uniqueH1Headings,
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
