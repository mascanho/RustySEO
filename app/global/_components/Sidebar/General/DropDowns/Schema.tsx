// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState, useCallback, memo } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

const Schema = () => {
  const crawlData = useGlobalCrawlStore((state) => state.crawlData);
  const [isOpen, setIsOpen] = useState(false); // State to track if details are open

  // Memoize calculations to avoid recalculating on every render
  const totalPages = useMemo(
    () => crawlData?.length || 0,
    [crawlData],
  );

  const hasPageSchema = useMemo(
    () =>
      crawlData?.filter((item) => item?.schema)?.length || 0,
    [crawlData],
  );

  const missingPageSchema = useMemo(
    () => totalPages - hasPageSchema,
    [totalPages, hasPageSchema],
  );

  const totalSchemasFound = useMemo(
    () =>
      crawlData?.reduce(
        (acc, item) => acc + (item.schema ? 1 : 0),
        0,
      ) || 0,
    [crawlData],
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

  return (
    <div className="text-xs w-full">
      <div className="w-full cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="text-xs font-semibold border-b dark:border-b-brand-dark pl-1 p-1 flex items-center">
          <span className="">
            {isOpen ? (
              <FiChevronDown size={14} />
            ) : (
              <FiChevronRight size={14} />
            )}
          </span>
          <span className="ml-1">Schema</span>
        </div>
      </div>

      {isOpen && (
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
      )}
    </div>
  );
};

export default memo(Schema);
