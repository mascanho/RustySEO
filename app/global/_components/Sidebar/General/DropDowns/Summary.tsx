// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState, useCallback, memo, useEffect } from "react";

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
  const { setSummary } = useGlobalCrawlStore();

  // Safely get crawlData or default to an empty array
  const crawlData: CrawlDataItem[] = useMemo(
    () => domainCrawlData?.crawlData || [],
    [domainCrawlData],
  );

  // Memoize internal and external links using sets to prevent duplication
  const { internalLinks, externalLinks } = useMemo(() => {
    const internalLinksSet = new Set<string>();
    const externalLinksSet = new Set<string>();

    crawlData.forEach((item) => {
      item?.anchor_links?.internal?.links?.forEach((link) =>
        internalLinksSet.add(link),
      );
      item?.anchor_links?.external?.links?.forEach((link) =>
        externalLinksSet.add(link),
      );
    });

    return {
      internalLinks: Array.from(internalLinksSet),
      externalLinks: Array.from(externalLinksSet),
    };
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

  // Update the summary state using useEffect
  useEffect(() => {
    setSummary({
      totalPagesCrawled,
      totalInternalLinks,
      totalExternalLinks,
      totalLinksFound,
      totalNotIndexablePages,
    });
  }, [
    totalPagesCrawled,
    totalInternalLinks,
    totalExternalLinks,
    totalLinksFound,
    totalNotIndexablePages,
    setSummary,
  ]);

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

  return (
    <div className="text-sx w-full">
      <details
        className="w-full"
        onClick={(e) => console.log(e.target.innerText)}
        onToggle={handleToggle}
      >
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
