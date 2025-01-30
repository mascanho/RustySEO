// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React from "react";

const Iframes = () => {
  const domainCrawlData = useGlobalCrawlStore();

  const externalCss =
    domainCrawlData?.crawlData?.reduce((acc, item) => {
      const externalCount = item?.iframe?.length || 0;
      return acc + externalCount;
    }, 0) || 0;

  const iframeData = [{ label: "Iframes Found", count: externalCss }];

  return (
    <div className="text-sx w-full">
      <details className="w-full">
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer">
          Iframes
        </summary>
        {iframeData.map((data, index) => (
          <section
            key={index}
            className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
          >
            <span className="text-brand-bright w-full pl-2.5 py-1">
              {data?.label}
            </span>
            <div>{data?.count}</div>
          </section>
        ))}
      </details>
    </div>
  );
};

export default Iframes;
