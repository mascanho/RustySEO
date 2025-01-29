// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React from "react";

const Javascript = () => {
  const domainCrawlData = useGlobalCrawlStore();

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

  const scriptData = [
    { label: "External Scripts", count: externalScripts },
    { label: "Inline Scripts", count: inlineScripts },
  ];

  return (
    <div className="text-sx w-full">
      <details className="w-full">
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer">
          Javascript
        </summary>
        {scriptData.map((data, index) => (
          <section
            key={index}
            className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
          >
            <span className="text-brand-bright w-full pl-2.5 py-1">
              {data.label}
            </span>
            <div>{data.count}</div>
          </section>
        ))}
      </details>
    </div>
  );
};

export default Javascript;
