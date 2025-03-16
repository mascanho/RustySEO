// @ts-nocheck
import React, { useMemo } from "react";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";

interface CrawlDataItem {
  title?: { title: string; title_len: number }[];
}

const PageTitles: React.FC = () => {
  const domainCrawlData = useGlobalCrawlStore();

  // Memoize the crawlData to avoid recalculating on every render
  const crawlData: CrawlDataItem[] = useMemo(
    () => domainCrawlData?.crawlData || [],
    [domainCrawlData],
  );

  // Memoize the page titles and their counts
  const { counts, totalPages } = useMemo(() => {
    const pageTitles = crawlData.map((item) => item?.title?.[0]?.title) || [];
    const uniquePageTitles = [...new Set(pageTitles)];

    const counts = {
      all: uniquePageTitles.length,
      long: uniquePageTitles.filter((title) => title?.length > 60).length,
      empty: uniquePageTitles.filter((title) => !title).length,
      short: uniquePageTitles.filter((title) => title?.length < 30).length,
    };

    const totalPages = crawlData.length;

    return { counts, totalPages };
  }, [crawlData]);

  // Memoize the sections to avoid recalculating on every render
  const sections = useMemo(
    () => [
      { label: "All", count: counts.all },
      { label: "Over 60 Characters", count: counts.long },
      { label: "Missing Page Title", count: counts.empty },
      { label: "Below 30 Characters", count: counts.short },
    ],
    [counts],
  );

  return (
    <div className="text-sx w-full">
      <details className="w-full">
        <summary className="text-xs text-brand font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer">
          Page Titles
        </summary>
        <div className="w-full">
          {/* Data Rows */}
          {sections.map(({ label, count }) => (
            <div
              key={label}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className="w-2/3 pl-2.5 py-1 text-brand-bright">{label}</div>
              <div className="w-1/6 text-right pr-2">{count}</div>
              <div className="w-1/6 text-center pl-2">
                {totalPages
                  ? `${((count / totalPages) * 100).toFixed(0)}%`
                  : "0%"}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default React.memo(PageTitles);
