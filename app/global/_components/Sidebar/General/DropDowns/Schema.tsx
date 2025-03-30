// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState, useCallback, memo } from "react";

const Schema = () => {
  const domainCrawlData = useGlobalCrawlStore();
  const [isOpen, setIsOpen] = useState(false); // State to track if details are open

  // Memoize calculations to avoid recalculating on every render
  const totalPages = useMemo(
    () => domainCrawlData?.crawlData?.length || 0,
    [domainCrawlData?.crawlData],
  );

  const hasPageSchema = useMemo(
    () =>
      domainCrawlData?.crawlData?.filter((item) => item?.schema)?.length || 0,
    [domainCrawlData?.crawlData],
  );

  const missingPageSchema = useMemo(
    () => totalPages - hasPageSchema,
    [totalPages, hasPageSchema],
  );

  const totalSchemasFound = useMemo(
    () =>
      domainCrawlData?.crawlData?.reduce(
        (acc, item) => acc + (item.schema ? 1 : 0),
        0,
      ) || 0,
    [domainCrawlData?.crawlData],
  );

  // Memoize summaryData to avoid recalculating on every render
  const summaryData = useMemo(
    () => [
      { label: "Total Schemas Found", count: totalSchemasFound },
      { label: "Pages With Schema", count: hasPageSchema },
      { label: "Pages Missing Schema", count: missingPageSchema },
    ],
    [totalSchemasFound, hasPageSchema, missingPageSchema],
  );

  // Memoize the toggle handler to avoid recreating it on every render
  const handleToggle = useCallback(
    (e: React.SyntheticEvent<HTMLDetailsElement>) => {
      setIsOpen(e.currentTarget.open);
    },
    [],
  );

  return (
    <div className="text-sx w-full">
      <details className="w-full" onToggle={handleToggle}>
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer flex items-center">
          <span>Schema</span>
        </summary>
        <div className="w-full">
          {summaryData.map((item, index) => (
            <div
              key={index}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className="w-2/3 pl-2.5 py-1 text-brand-bright">
                {item.label}
              </div>
              <div className="w-1/6 text-right pr-2">{item.count}</div>
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

export default memo(Schema);
