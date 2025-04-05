// @ts-nocheck
import React, { useMemo, useEffect, useRef, useState } from "react";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { debounce } from "lodash";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

interface CrawlDataItem {
  title?: { title: string; title_len: number }[];
}

const PageTitles: React.FC = () => {
  const domainCrawlData = useGlobalCrawlStore();
  const [counts, setCounts] = useState({ all: 0, long: 0, empty: 0, short: 0 });
  const [totalPages, setTotalPages] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const crawlDataRef = useRef<CrawlDataItem[]>([]);

  // Update the ref with the latest data whenever domainCrawlData changes
  useEffect(() => {
    crawlDataRef.current = domainCrawlData?.crawlData || [];
    processDataDebounced();
  }, [domainCrawlData]);

  // Debounce the processing logic
  const processDataDebounced = useMemo(
    () =>
      debounce(() => {
        const crawlData = crawlDataRef.current;
        const pageTitles =
          crawlData.map((item) => item?.title?.[0]?.title) || [];
        const uniquePageTitles = [...new Set(pageTitles)];

        const newCounts = {
          all: pageTitles?.length,
          long: uniquePageTitles.filter((title) => title?.length > 60).length,
          empty: uniquePageTitles.filter((title) => !title).length,
          short: uniquePageTitles.filter((title) => title?.length < 30).length,
        };

        const newTotalPages = crawlData.length;

        setCounts(newCounts);
        setTotalPages(newTotalPages);
      }, 300), // Adjust the debounce delay as needed
    [],
  );

  // Memoize the sections to avoid recalculating on every render
  const sections = useMemo(
    () => [
      { label: "All", count: counts.all },
      { label: "Over 60 Characters", count: counts.long },
      { label: "Missing Page Title", count: counts.empty },
      { label: "Below 30 Characters", count: counts.short },
    ],
    [counts],
  );

  return (
    <div className="text-xs w-full">
      <div className="w-full cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="text-xs font-semibold border-b dark:border-b-brand-dark pl-1 p-1  flex items-center">
          <span className="">
            {isOpen ? (
              <FiChevronDown size={14} />
            ) : (
              <FiChevronRight size={14} />
            )}
          </span>
          <span className="ml-1">Page Titles</span>
        </div>
      </div>

      {isOpen && (
        <div className="w-full">
          {sections.map(({ label, count }) => (
            <div
              key={label}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className="w-2/3 pl-2.5 py-1 text-brand-bright">{label}</div>
              <div className="w-1/6 text-right pr-2">{count}</div>
              <div className="w-1/6 text-center pl-2">
                {totalPages
                  ? `${((count / totalPages) * 100).toFixed(0)}%`
                  : "0%"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(PageTitles);
