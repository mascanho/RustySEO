// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useState } from "react";

const Css = () => {
  const domainCrawlData = useGlobalCrawlStore();
  const [isOpen, setIsOpen] = useState(false); // State to track if details are open

  const externalCss =
    domainCrawlData?.crawlData?.reduce((acc, item) => {
      const externalCount = item?.css?.external?.length || 0;
      return acc + externalCount;
    }, 0) || 0;

  const inlineCss =
    domainCrawlData?.crawlData?.reduce((acc, item) => {
      const inlineCount = item?.css?.inline?.length || 0;
      return acc + inlineCount;
    }, 0) || 0;

  const totalCss = externalCss + inlineCss;

  const scriptData = [
    { label: "External CSS", count: externalCss },
    { label: "Internal CSS", count: inlineCss },
  ];

  return (
    <div className="text-sx w-full">
      <details
        className="w-full"
        onToggle={(e) => setIsOpen(e.currentTarget.open)} // Update state when details are toggled
      >
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer flex items-center gap-2">
          <span>CSS</span>
        </summary>
        {/* Data Rows (inside details, only visible when open) */}
        <div className="w-full">
          {/* Header Row */}
          {/* Data Rows */}
          {scriptData.map((data, index) => (
            <div
              key={index}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className="w-2/3 pl-2.5 py-1">{data?.label}</div>
              <div className="w-1/6 text-right pr-2">{data?.count}</div>
              <div className="w-1/6 text-right pr-2">
                {totalCss > 0
                  ? `${((data.count / totalCss) * 100).toFixed(0)}%`
                  : "0%"}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default Css;
