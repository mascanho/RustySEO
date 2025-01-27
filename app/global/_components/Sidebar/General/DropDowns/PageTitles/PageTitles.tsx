// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React from "react";

const PageTitles = () => {
  const domainCrawlData = useGlobalCrawlStore();

  const pageTitles = domainCrawlData?.crawlData?.map((item) => item?.pageTitle);

  return (
    <div className="text-sx w-full">
      <details className="mx-2">
        <summary className="text-xs">Summary</summary>

        <section className="flex items-center text-xs ml-4 justify-between">
          <span className="font-bold text-brand-bright">URLs crawled </span>
          <div>
            {domainCrawlData ??
              domainCrawlData?.crawlData?.length ??
              pageTitles?.length}{" "}
          </div>
        </section>
      </details>
    </div>
  );
};

export default PageTitles;
