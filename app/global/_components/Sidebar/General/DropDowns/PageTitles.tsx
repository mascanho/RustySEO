// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React from "react";

const PageTitles = () => {
  const domainCrawlData = useGlobalCrawlStore();

  const pageTitles =
    domainCrawlData?.crawlData?.map((item) => item?.title?.[0]?.title) || [];
  const counts = {
    all: domainCrawlData?.crawlData?.length ?? pageTitles?.length,
    long: pageTitles?.filter((title) => title?.length > 60).length || 0,
    empty: pageTitles?.filter((title) => !title).length || 0,
    short: pageTitles?.filter((title) => title?.length < 30).length || 0,
  };

  const sections = [
    { label: "All", count: counts.all },
    { label: "Over 60 Characters", count: counts.long },
    { label: "Missing Page Title", count: counts.empty },
    { label: "Below 30 Characters", count: counts.short },
  ];

  const totalPages = domainCrawlData?.crawlData?.length;

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
                {totalPages ? ((count / totalPages) * 100).toFixed(0) + "%" : 0}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default PageTitles;
