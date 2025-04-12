// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useEffect, memo, useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

interface UrlCounts {
  total: number; // Total URLs analyzed
  nonAscii: number; // URLs with non-ASCII characters
  underscores: number; // URLs containing underscores
  uppercase: number; // URLs with uppercase letters
  multipleSlashes: number; // URLs with multiple consecutive slashes
  repetitivePath: number; // URLs with repetitive path segments
  containsSpaces: number; // URLs containing spaces (encoded or not)
  internalSearch: number; // URLs with internal search parameters
  hasParameters: number; // URLs with query parameters
  tooLong: number; // URLs over 115 characters
}

interface Section {
  label: string;
  count: number;
  percentage: string;
}

const URLinfo = () => {
  const { crawlData, setUrlData } = useGlobalCrawlStore();
  const [isOpen, setIsOpen] = useState(false);

  // Ensure crawlData is always an array
  const safeCrawlData = useMemo(
    () => (Array.isArray(crawlData) ? crawlData : []),
    [crawlData],
  );

  // Memoize URL analysis
  const { counts, totalUrls } = useMemo(() => {
    const urls = safeCrawlData
      .map((item) => item?.url || "")
      .filter((url) => url);

    const counts: UrlCounts = {
      total: urls.length,
      nonAscii: urls.filter((url) => /[^\x00-\x7F]/.test(url)).length,
      underscores: urls.filter((url) => url.includes("_")).length,
      uppercase: urls.filter((url) => /[A-Z]/.test(url)).length,
      multipleSlashes: urls.filter((url) => {
        // Remove the protocol part
        const withoutProtocol = url.replace(/^https?:\/\//, "");
        // Check for multiple slashes in the remaining part
        return /\/{2,}/.test(withoutProtocol);
      }).length,
      repetitivePath: urls.filter((url) => {
        const paths = url.split("/").filter(Boolean);
        return new Set(paths).size !== paths.length;
      }).length,
      containsSpaces: urls.filter((url) => /\s|%20/.test(url)).length,
      internalSearch: urls.filter((url) => /search\?|q=|\?.*=/.test(url))
        .length,
      hasParameters: urls.filter((url) => url.includes("?")).length,
      tooLong: urls.filter((url) => url.length > 115).length,
    };

    return {
      counts,
      totalUrls: urls.length,
    };
  }, [safeCrawlData]);

  // Memoize sections to avoid recalculating on every render
  const sections: Section[] = useMemo(() => {
    const calculatePercentage = (count: number, total: number): string => {
      if (!total) return "0%";
      return `${Math.min(((count / total) * 100).toFixed(0), 100)}%`;
    };

    return [
      {
        label: "Total",
        count: counts.total,
        percentage: "100%",
      },
      {
        label: "Non ASCII Characters",
        count: counts.nonAscii,
        percentage: calculatePercentage(counts.nonAscii, counts.total),
      },
      {
        label: "Underscores",
        count: counts.underscores,
        percentage: calculatePercentage(counts.underscores, counts.total),
      },
      {
        label: "Uppercase",
        count: counts.uppercase,
        percentage: calculatePercentage(counts.uppercase, counts.total),
      },
      {
        label: "Multiple Slashes",
        count: counts.multipleSlashes,
        percentage: calculatePercentage(counts.multipleSlashes, counts.total),
      },
      {
        label: "Repetitive Path",
        count: counts.repetitivePath,
        percentage: calculatePercentage(counts.repetitivePath, counts.total),
      },
      {
        label: "Contains Space",
        count: counts.containsSpaces,
        percentage: calculatePercentage(counts.containsSpaces, counts.total),
      },
      {
        label: "Internal Search",
        count: counts.internalSearch,
        percentage: calculatePercentage(counts.internalSearch, counts.total),
      },
      {
        label: "Parameters",
        count: counts.hasParameters,
        percentage: calculatePercentage(counts.hasParameters, counts.total),
      },
      {
        label: "Over 115 Characters",
        count: counts.tooLong,
        percentage: calculatePercentage(counts.tooLong, counts.total),
      },
    ];
  }, [counts]);

  // Update urlData state when sections change
  useEffect(() => {
    if (typeof setUrlData === "function") {
      setUrlData(sections);
    }
  }, [sections, setUrlData]);

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
          <span className="ml-1">URL</span>
        </div>
      </div>

      {isOpen && (
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
      )}
    </div>
  );
};

export default memo(URLinfo);
