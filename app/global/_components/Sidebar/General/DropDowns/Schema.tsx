// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React from "react";

const Schema = () => {
  const domainCrawlData = useGlobalCrawlStore();

  const totalPages = domainCrawlData?.crawlData?.length;

  const hasPageSchema = domainCrawlData?.crawlData?.filter(
    (item) => item.schema,
  );

  const summaryData = [
    { label: "Pages With Schema", value: hasPageSchema?.length || "0" },
    { label: "Pages Missing Schema", value: totalPages - hasPageSchema || "0" },
  ];

  console.log(hasPageSchema, "hasPageSchema");

  return (
    <div className="text-sx w-full">
      <details className="w-full">
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer">
          Schema
        </summary>
        {summaryData?.map((item, index) => (
          <section
            key={index}
            className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
          >
            <span className="text-brand-bright w-full pl-2.5 py-1">
              {item?.label}{" "}
            </span>
            <div>{item?.value}</div>
          </section>
        ))}
      </details>
    </div>
  );
};

export default Schema;
