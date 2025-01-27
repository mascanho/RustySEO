// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React from "react";

const PageTitles = () => {
  const domainCrawlData = useGlobalCrawlStore();

  const pageTitles =
    domainCrawlData?.crawlData?.map((item) => item?.title) || [];
  const longPageTitlesCount =
    pageTitles?.filter((title) => title.length > 60).length || 0;
  const emptyPageTitlesCount =
    pageTitles?.filter((title) => title.length === 0).length || 0;
  const shortPageTitlesCount =
    pageTitles?.filter((title) => title.length < 30).length || 0;
  console.log(pageTitles.length, "page titles");

  return (
    <div className="text-sx w-full">
      <details className="w-full">
        <summary className="text-xs border-b pl-2 py-1">Page Titles</summary>

        <section className="flex items-center text-xs w-full px-2 justify-between border-b">
          <span className="font-bold text-brand-bright w-full pl-4 py-1">
            All
          </span>
          <div>{domainCrawlData?.crawlData?.length ?? pageTitles?.length} </div>
        </section>
        <section className="flex items-center text-xs w-full px-2 justify-between border-b">
          <span className="font-bold text-brand-bright w-full pl-4 py-1">
            Over 60 Characters
          </span>
          <div>{longPageTitlesCount}</div>
        </section>
        <section className="flex items-center text-xs w-full px-2 justify-between border-b">
          <span className="font-bold text-brand-bright w-full pl-4 py-1">
            Empty Titles
          </span>
          <div>{emptyPageTitlesCount}</div>
        </section>
        <section className="flex items-center text-xs w-full px-2 justify-between border-b">
          <span className="font-bold text-brand-bright w-full pl-4 py-1">
            Below 30 Characters
          </span>
          <div>{shortPageTitlesCount}</div>
        </section>
      </details>
    </div>
  );
};

export default PageTitles;
