import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState, useCallback, memo } from "react";

interface CrawlDataItem {
  anchor_links?: {
    internal?: { links?: string[] };
    external?: { links?: string[] };
  };
  indexability?: {
    indexability?: number;
  };
}

interface SummaryItem {
  label: string;
  value: number;
  percentage: string;
}

const SummaryItemRow: React.FC<SummaryItem> = memo(
  ({ label, value, percentage }) => (
    <div className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark">
      <div className="w-2/3 pl-2.5 py-1 text-brand-bright">{label}</div>
      <div className="w-1/6 text-right pr-2">{value}</div>
      <div className="w-1/6 text-right pr-2">{percentage}</div>
    </div>
  ),
);

SummaryItemRow.displayName = "SummaryItemRow";

const Summary: React.FC = () => {
  const domainCrawlData = useGlobalCrawlStore();
  const [isOpen, setIsOpen] = useState(false);

  // Safely get crawlData or default to an empty array
  const crawlData: CrawlDataItem[] = domainCrawlData?.crawlData || [];

  // Memoize internal and external links
  const { internalLinks, externalLinks } = useMemo(() => {
    const internalLinks = crawlData.flatMap(
      (item) => item?.anchor_links?.internal?.links || [],
    );
    const externalLinks = crawlData.flatMap(
      (item) => item?.anchor_links?.external?.links || [],
    );
    return { internalLinks, externalLinks };
  }, [crawlData]);

  // Memoize indexable pages
  const totalIndexablePages = useMemo(
    () =>
      crawlData.filter((item) => (item?.indexability?.indexability || 0) > 0.5)
        .length,
    [crawlData],
  );

  // Memoize totals
  const {
    totalPagesCrawled,
    totalInternalLinks,
    totalExternalLinks,
    totalLinksFound,
    totalNotIndexablePages,
  } = useMemo(() => {
    const totalPagesCrawled = crawlData.length;
    const totalInternalLinks = internalLinks.length;
    const totalExternalLinks = externalLinks.length;
    const totalLinksFound = totalInternalLinks + totalExternalLinks;
    const totalNotIndexablePages = totalPagesCrawled - totalIndexablePages;
    return {
      totalPagesCrawled,
      totalInternalLinks,
      totalExternalLinks,
      totalLinksFound,
      totalNotIndexablePages,
    };
  }, [crawlData, internalLinks, externalLinks, totalIndexablePages]);

  // Memoize summary data
  const summaryData: SummaryItem[] = useMemo(
    () => [
      {
        label: "Pages crawled",
        value: totalPagesCrawled,
        percentage: "100%",
      },
      {
        label: "Total Links Found",
        value: totalLinksFound,
        percentage: "100%",
      },
      {
        label: "Total Internal Links",
        value: totalInternalLinks,
        percentage: totalLinksFound
          ? `${((totalInternalLinks / totalLinksFound) * 100).toFixed(0)}%`
          : "0%",
      },
      {
        label: "Total External Links",
        value: totalExternalLinks,
        percentage: totalLinksFound
          ? `${((totalExternalLinks / totalLinksFound) * 100).toFixed(0)}%`
          : "0%",
      },
      {
        label: "Total Indexable Pages",
        value: totalIndexablePages,
        percentage: totalPagesCrawled
          ? `${((totalIndexablePages / totalPagesCrawled) * 100).toFixed(0)}%`
          : "0%",
      },
      {
        label: "Total Not Indexable Pages",
        value: totalNotIndexablePages,
        percentage: totalPagesCrawled
          ? `${((totalNotIndexablePages / totalPagesCrawled) * 100).toFixed(0)}%`
          : "0%",
      },
    ],
    [
      totalPagesCrawled,
      totalLinksFound,
      totalInternalLinks,
      totalExternalLinks,
      totalIndexablePages,
      totalNotIndexablePages,
    ],
  );

  // Memoize the toggle handler
  const handleToggle = useCallback(
    (e: React.SyntheticEvent<HTMLDetailsElement>) => {
      setIsOpen(e.currentTarget.open);
    },
    [],
  );

  // Handle errors or missing data gracefully
  if (!crawlData || crawlData.length === 0) {
    return (
      <div className="text-sx w-full">
        <details className="w-full">
          <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 pb-1.5 cursor-pointer flex items-center">
            <span>Summary</span>
          </summary>
          <div className="w-full text-xs text-brand-bright p-2">
            No data available.
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="text-sx w-full">
      <details className="w-full" onToggle={handleToggle}>
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 pb-1.5 cursor-pointer flex items-center">
          <span>Summary</span>
        </summary>
        {isOpen && (
          <div className="w-full">
            {summaryData.map((item, index) => (
              <SummaryItemRow key={index} {...item} />
            ))}
          </div>
        )}
      </details>
    </div>
  );
};

export default memo(Summary);
