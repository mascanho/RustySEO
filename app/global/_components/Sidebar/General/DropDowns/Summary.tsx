// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React from "react";

const Summary = () => {
  const domainCrawlData = useGlobalCrawlStore();

  const internalLinks =
    domainCrawlData?.crawlData?.reduce(
      (acc, item) => acc.concat(item?.anchor_links?.internal_links || []),
      [],
    ) || [];
  const externalLinks =
    domainCrawlData?.crawlData?.reduce(
      (acc, item) => acc.concat(item?.anchor_links?.external_links || []),
      [],
    ) || [];

  const isInternalIndexable = domainCrawlData?.crawlData?.filter(
    (item) => item.indexability.indexability === 1,
  ).length;

  const summaryData = [
    { label: "URLs crawled", value: domainCrawlData?.crawlData?.length || "0" },
    { label: "Total Internal URLs", value: internalLinks?.length || "0" },
    { label: "Total External URLs", value: externalLinks?.length || "0" },
    {
      label: "Total Links Found",
      value: internalLinks.length + externalLinks.length || "0",
    },
    {
      label: "Total Indexeable Pages",
      value: isInternalIndexable || "0",
    },
    {
      label: "Total Not Indexable Pages",
      value: domainCrawlData?.crawlData?.length - isInternalIndexable || "0",
    },
  ];

  return (
    <div className="text-sx w-full">
      <details className="w-full">
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer">
          Summary
        </summary>
        {summaryData.map((item, index) => (
          <section
            key={index}
            className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
          >
            <span className="text-brand-bright w-full pl-2.5 py-1">
              {item.label}{" "}
            </span>
            <div>{item.value}</div>
          </section>
        ))}
      </details>
    </div>
  );
};

export default Summary;
