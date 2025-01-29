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

  return (
    <div className="text-sx w-full">
      <details className="w-full">
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer">
          Page Titles
        </summary>
        {sections.map(({ label, count }) => (
          <section
            key={label}
            className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
          >
            <span className="text-brand-bright w-full pl-2.5 py-1">
              {label}
            </span>
            <div>{count}</div>
          </section>
        ))}
      </details>
    </div>
  );
};

export default PageTitles;
