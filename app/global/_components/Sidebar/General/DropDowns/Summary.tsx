// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useState } from "react";

const Summary = () => {
  const domainCrawlData = useGlobalCrawlStore();
  const [isOpen, setIsOpen] = useState(false); // State to track if details are open

  const internalLinks =
    domainCrawlData?.crawlData?.reduce(
      (acc, item) => acc.concat(item?.anchor_links?.internal?.links || []),
      [],
    ) || [];
  const externalLinks =
    domainCrawlData?.crawlData?.reduce(
      (acc, item) => acc.concat(item?.anchor_links?.external?.links || []),
      [],
    ) || [];

  const isInternalIndexable = domainCrawlData?.crawlData?.filter(
    (item) => item.indexability.indexability === 1,
  ).length;

  const totalPagesCrawled = domainCrawlData?.crawlData?.length || 0;
  const totalInternalLinks = internalLinks.length || 0;
  const totalExternalLinks = externalLinks.length || 0;
  const totalLinksFound = totalInternalLinks + totalExternalLinks;
  const totalIndexablePages = isInternalIndexable || 0;
  const totalNotIndexablePages = totalPagesCrawled - totalIndexablePages;

  const summaryData = [
    {
      label: "Pages crawled",
      value: totalPagesCrawled,
      percentage: totalPagesCrawled
        ? `${((totalPagesCrawled / totalPagesCrawled) * 100).toFixed(0)}%`
        : "0%",
    },
    {
      label: "Total Links Found",
      value: totalLinksFound,
      percentage: totalLinksFound
        ? `${((totalLinksFound / totalLinksFound) * 100).toFixed(0)}%`
        : "0%",
    },
    {
      label: "Total Internal Links",
      value: totalInternalLinks,
      percentage: totalLinksFound
        ? `${((totalInternalLinks / totalLinksFound) * 100).toFixed(0)}%`
        : "0%",
    },
    {
      label: "Total External Links",
      value: totalExternalLinks,
      percentage: totalLinksFound
        ? `${((totalExternalLinks / totalLinksFound) * 100).toFixed(0)}%`
        : "0%",
    },

    {
      label: "Total Indexable Pages",
      value: totalIndexablePages,
      percentage: totalPagesCrawled
        ? `${((totalIndexablePages / totalPagesCrawled) * 100).toFixed(0)}%`
        : "0%",
    },
    {
      label: "Total Not Indexable Pages",
      value: totalNotIndexablePages,
      percentage: totalPagesCrawled
        ? `${((totalNotIndexablePages / totalPagesCrawled) * 100).toFixed(0)}%`
        : "0%",
    },
  ];

  return (
    <div className="text-sx w-full">
      <details
        className="w-full"
        onToggle={(e) => setIsOpen(e.currentTarget.open)} // Update state when details are toggled
      >
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 pb-1.5 cursor-pointer flex items-center ">
          <span>Summary</span>
        </summary>
        {/* Data Rows (inside details, only visible when open) */}
        <div className="w-full">
          {/* Data Rows */}
          {summaryData.map((item, index) => (
            <div
              key={index}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className="w-2/3 pl-2.5 py-1 text-brand-bright">
                {item.label}
              </div>
              <div className="w-1/6 text-right pr-2">{item.value}</div>
              <div className="w-1/6 text-right pr-2">{item.percentage}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default Summary;
