import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React from "react";

const Summary = () => {
  const domainCrawlData = useGlobalCrawlStore();

  console.log(typeof domainCrawlData.crawlData);

  return (
    <div className="text-sx w-full">
      <details className="mx-2">
        <summary className="text-xs">Summary</summary>

        <section className="flex items-center text-xs ml-4 justify-between">
          <span className="font-bold text-brand-bright">URLs crawled </span>
          <div>{domainCrawlData?.crawlData?.length} </div>
        </section>
      </details>
    </div>
  );
};

export default Summary;
