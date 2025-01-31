// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useState } from "react";

const Schema = () => {
  const domainCrawlData = useGlobalCrawlStore();
  const [isOpen, setIsOpen] = useState(false); // State to track if details are open

  const totalPages = domainCrawlData?.crawlData?.length || 0;

  const hasPageSchema =
    domainCrawlData?.crawlData?.filter((item) => item.schema)?.length || 0;

  const missingPageSchema = totalPages - hasPageSchema;

  const totalSchemasFound =
    domainCrawlData?.crawlData?.reduce(
      (acc, item) => acc + (item.schema ? 1 : 0),
      0,
    ) || 0;

  const summaryData = [
    { label: "Total Schemas Found", count: totalSchemasFound },
    { label: "Pages With Schema", count: hasPageSchema },
    { label: "Pages Missing Schema", count: missingPageSchema },
  ];

  return (
    <div className="text-sx w-full">
      <details
        className="w-full"
        onToggle={(e) => setIsOpen(e.currentTarget.open)} // Update state when details are toggled
      >
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer flex items-center">
          <span>Schema</span>
        </summary>
        {/* Data Rows (inside details, only visible when open) */}
        <div className="w-full">
          {/* Header Row */}
          {/* Data Rows */}
          {summaryData.map((item, index) => (
            <div
              key={index}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className="w-2/3 pl-2.5 py-1 text-brand-bright">
                {item?.label}
              </div>
              <div className="w-1/6 text-right pr-2">{item?.count}</div>
              <div className="w-1/6 text-right pr-2">
                {totalPages > 0
                  ? `${((item.count / totalPages) * 100).toFixed(0)}%`
                  : "0%"}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default Schema;
