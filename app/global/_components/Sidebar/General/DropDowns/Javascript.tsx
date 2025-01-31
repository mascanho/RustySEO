// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useState } from "react";

const Javascript = () => {
  const domainCrawlData = useGlobalCrawlStore();
  const [isOpen, setIsOpen] = useState(false); // State to track if details are open

  const externalScripts =
    domainCrawlData?.crawlData?.reduce((acc, item) => {
      const externalCount = item?.javascript?.external?.length || 0;
      return acc + externalCount;
    }, 0) || 0;

  const inlineScripts =
    domainCrawlData?.crawlData?.reduce((acc, item) => {
      const inlineCount = item?.javascript?.inline?.length || 0;
      return acc + inlineCount;
    }, 0) || 0;

  const totalScripts = externalScripts + inlineScripts;

  const scriptData = [
    { label: "External Scripts", count: externalScripts },
    { label: "Inline Scripts", count: inlineScripts },
  ];

  return (
    <div className="text-sx w-full">
      <details
        className="w-full"
        onToggle={(e) => setIsOpen(e.currentTarget.open)} // Update state when details are toggled
      >
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer flex items-center">
          <span>Javascript</span>
        </summary>
        {/* Data Rows (inside details, only visible when open) */}
        <div className="w-full">
          {/* Header Row */}
          {/* Data Rows */}
          <div className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark">
            <div className="w-2/3 pl-2.5 py-1 text-brand-bright">
              Total Javascript
            </div>
            <div className="w-1/6 text-right pr-2">{totalScripts}</div>
            <div className="w-1/6 text-right pr-2">100%</div>
          </div>
          {scriptData.map((data, index) => (
            <div
              key={index}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className="w-2/3 pl-2.5 py-1 text-brand-bright">
                {data?.label}
              </div>
              <div className="w-1/6 text-right pr-2">{data?.count}</div>
              <div className="w-1/6 text-right pr-2">
                {totalScripts > 0
                  ? `${((data.count / totalScripts) * 100).toFixed(0)}%`
                  : "0%"}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default Javascript;
