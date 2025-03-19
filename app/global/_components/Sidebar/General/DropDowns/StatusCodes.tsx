// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState, useCallback, useEffect } from "react";

interface CrawlDataItem {
  status_code?: number;
}

interface StatusCodesData {
  "2xx": number;
  "3xx": number;
  "4xx": number;
  "5xx": number;
}

interface StatusDataItem {
  label: string;
  count: number;
  percentage: string;
}

const StatusCodes: React.FC = () => {
  // Use a single selector to access Zustand store
  const { crawlData, setStatusCodes } = useGlobalCrawlStore((state) => ({
    crawlData: state.crawlData || [],
    setStatusCodes: state.setStatusCodes,
  }));

  const [isOpen, setIsOpen] = useState(false);

  // Memoize status codes calculation
  const statusCodes: StatusCodesData = useMemo(() => {
    return crawlData.reduce(
      (acc, item) => {
        const statusCode = item?.status_code || 0;
        if (statusCode >= 200 && statusCode < 300) acc["2xx"]++;
        else if (statusCode >= 300 && statusCode < 400) acc["3xx"]++;
        else if (statusCode >= 400 && statusCode < 500) acc["4xx"]++;
        else if (statusCode >= 500) acc["5xx"]++;
        return acc;
      },
      { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 },
    );
  }, [crawlData]);

  // Memoize total status codes
  const totalStatusCodes = useMemo(
    () =>
      statusCodes["2xx"] +
      statusCodes["3xx"] +
      statusCodes["4xx"] +
      statusCodes["5xx"],
    [statusCodes],
  );

  // Memoize status data with percentages
  const statusData: StatusDataItem[] = useMemo(() => {
    return [
      { label: "Total", count: totalStatusCodes, percentage: "100%" },
      {
        label: "2xx Success",
        count: statusCodes["2xx"],
        percentage:
          totalStatusCodes > 0
            ? `${((statusCodes["2xx"] / totalStatusCodes) * 100).toFixed(0)}%`
            : "0%",
      },
      {
        label: "3xx Redirection",
        count: statusCodes["3xx"],
        percentage:
          totalStatusCodes > 0
            ? `${((statusCodes["3xx"] / totalStatusCodes) * 100).toFixed(0)}%`
            : "0%",
      },
      {
        label: "4xx Client Error",
        count: statusCodes["4xx"],
        percentage:
          totalStatusCodes > 0
            ? `${((statusCodes["4xx"] / totalStatusCodes) * 100).toFixed(0)}%`
            : "0%",
      },
      {
        label: "5xx Server Error",
        count: statusCodes["5xx"],
        percentage:
          totalStatusCodes > 0
            ? `${((statusCodes["5xx"] / totalStatusCodes) * 100).toFixed(0)}%`
            : "0%",
      },
    ];
  }, [statusCodes, totalStatusCodes]);

  // Update status codes only when `statusData` changes
  useEffect(() => {
    setStatusCodes(statusData);
  }, [statusData, setStatusCodes]);

  // Memoize the toggle handler
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
          <span>Status Codes</span>
        </summary>
        <div className="w-full">
          {statusData.map((data, index) => (
            <div
              key={index}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className="w-2/3 pl-2.5 py-1 text-brand-bright">
                {data.label}
              </div>
              <div className="w-1/6 text-right pr-2">{data.count}</div>
              <div className="w-1/6 text-right pr-2">{data.percentage}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default React.memo(StatusCodes);
