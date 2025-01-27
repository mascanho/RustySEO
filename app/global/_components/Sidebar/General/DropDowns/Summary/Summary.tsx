// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React from "react";

const Summary = () => {
  const domainCrawlData = useGlobalCrawlStore();

  console.log(typeof domainCrawlData.crawlData);

  return (
    <div className="text-sx w-full">
      <details className="w-full">
        <summary className="text-xs border-b pl-2 py-1">Summary</summary>

        <section className="flex items-center text-xs w-full px-2 justify-between border-b">
          <span className="font-bold text-brand-bright w-full pl-4 py-1">
            URLs crawled{" "}
          </span>
          <div>{domainCrawlData?.crawlData?.length} </div>
        </section>
      </details>
    </div>
  );
};

export default Summary;
