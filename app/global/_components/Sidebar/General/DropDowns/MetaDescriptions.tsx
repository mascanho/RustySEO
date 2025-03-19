// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, memo, useEffect, useRef, useState } from "react";
import { debounce } from "lodash";

interface DescriptionCounts {
  all: number; // Total unique descriptions
  empty: number; // Empty descriptions
  duplicate: number; // Duplicate descriptions
  long: number; // Descriptions over 155 characters
  short: number; // Descriptions under 70 characters
}

interface Section {
  label: string;
  count: number;
  percentage: string;
}

const MetaDescription = () => {
  const { crawlData } = useGlobalCrawlStore();
  const [counts, setCounts] = useState<DescriptionCounts>({
    all: 0,
    empty: 0,
    duplicate: 0,
    long: 0,
    short: 0,
  });
  const [totalPages, setTotalPages] = useState(0);
  const crawlDataRef = useRef(crawlData);

  // Update the ref with the latest data whenever crawlData changes
  useEffect(() => {
    crawlDataRef.current = crawlData;
    processDataDebounced();
  }, [crawlData]);

  // Debounce the processing logic
  const processDataDebounced = useMemo(
    () =>
      debounce(() => {
        const descriptions =
          crawlDataRef.current?.map((item) => item?.description) || [];
        const uniqueDescriptions = [...new Set(descriptions)];

        const newCounts: DescriptionCounts = {
          all: crawlData?.length,
          empty:
            uniqueDescriptions.filter((desc) => !desc || desc === "").length ||
            0,
          duplicate: descriptions.length - uniqueDescriptions.length,
          long:
            uniqueDescriptions.filter((desc) => desc?.length > 155).length || 0,
          short:
            uniqueDescriptions.filter((desc) => desc?.length < 70).length || 0,
        };

        const newTotalPages = crawlDataRef.current?.length || 0;

        setCounts(newCounts);
        setTotalPages(newTotalPages);
      }, 300), // Adjust the debounce delay as needed
    [crawlData],
  );

  // Memoize sections to avoid recalculating on every render
  const sections: Section[] = useMemo(() => {
    const calculatePercentage = (count: number, total: number): string => {
      if (!total) return "0%";
      return `${Math.min(((count / total) * 100).toFixed(0), 100)}%`;
    };

    return [
      {
        label: "Total Description",
        count: counts.all,
        percentage: calculatePercentage(counts.all, totalPages),
      },
      {
        label: "Empty Description",
        count: counts.empty,
        percentage: calculatePercentage(counts.empty, totalPages),
      },
      {
        label: "Duplicate Description",
        count: counts.duplicate,
        percentage: calculatePercentage(counts.duplicate, totalPages),
      },
      {
        label: "Over 155 Characters",
        count: counts.long,
        percentage: calculatePercentage(counts.long, totalPages),
      },
      {
        label: "Below 70 Characters",
        count: counts.short,
        percentage: calculatePercentage(counts.short, totalPages),
      },
    ];
  }, [counts, totalPages]);

  return (
    <div className="text-sx w-full">
      <details className="w-full">
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer flex items-center">
          <span>Meta Description</span>
        </summary>
        <div className="w-full">
          {sections.map(({ label, count, percentage }) => (
            <div
              key={label}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className="w-2/3 pl-2.5 py-1 text-brand-bright">{label}</div>
              <div className="w-1/6 text-right pr-2">{count}</div>
              <div className="w-1/6 text-center pl-2">{percentage}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default memo(MetaDescription);
