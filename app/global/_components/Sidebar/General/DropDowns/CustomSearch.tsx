// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState, useCallback, memo, useEffect } from "react";

interface CrawlDataItem {
  extractor?: {
    css: boolean;
    html: boolean;
    regex: boolean;
  };
}

interface ExtractorData {
  html: number;
  css: number;
  regex: number;
}

const CustomSearch: React.FC = () => {
  const { crawlData: domainCrawlData, setCustomSearch } = useGlobalCrawlStore();
  const [isOpen, setIsOpen] = useState(false);

  const crawlData: CrawlDataItem[] = useMemo(
    () => domainCrawlData || [],
    [domainCrawlData],
  );

  const extractors: ExtractorData = useMemo(() => {
    return crawlData.reduce(
      (acc, item) => {
        if (item?.extractor?.html) acc.html++;
        if (item?.extractor?.css) acc.css++;
        if (item?.extractor?.regex) acc.regex++;
        return acc;
      },
      { html: 0, css: 0, regex: 0 },
    );
  }, [crawlData]);

  const totalExtractors = useMemo(
    () => extractors.html + extractors.css + extractors.regex,
    [extractors],
  );

  const extractorData = useMemo(
    () => [
      { label: "Total", count: totalExtractors },
      { label: "HTML Search", count: extractors.html },
      { label: "CSS Search", count: extractors.css },
      { label: "Regex Search", count: extractors.regex },
    ],
    [extractors, totalExtractors],
  );

  const handleToggle = useCallback(
    (e: React.SyntheticEvent<HTMLDetailsElement>) => {
      setIsOpen(e.currentTarget.open);
    },
    [],
  );

  useEffect(() => {
    if (typeof setCustomSearch === "function") {
      setCustomSearch(extractorData);
    }
  }, [extractorData, setCustomSearch]);

  return (
    <div className="text-sx w-full">
      <details className="w-full" onToggle={handleToggle}>
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer flex items-center">
          <span>Custom Search</span>
        </summary>
        <div className="w-full">
          {extractorData.map((data, index) => (
            <div
              key={index}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className="w-2/3 pl-2.5 py-1 text-brand-bright">
                {data.label}
              </div>
              <div className="w-1/6 text-right pr-2">{data.count}</div>
              <div className="w-1/6 text-right pr-2">
                {totalExtractors > 0 && data.label !== "Total"
                  ? `${((data.count / crawlData.length) * 100).toFixed(0)}%`
                  : data.label === "Total"
                    ? "100%"
                    : "0%"}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default memo(CustomSearch);
