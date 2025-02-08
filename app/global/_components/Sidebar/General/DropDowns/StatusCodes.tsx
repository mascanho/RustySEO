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

const StatusCodes: React.FC = () => {
  const domainCrawlData = useGlobalCrawlStore();
  const { setStatusCodes, statusCodes: codes } = useGlobalCrawlStore();
  const [isOpen, setIsOpen] = useState(false);

  // Safely get crawlData or default to an empty array
  const crawlData: CrawlDataItem[] = domainCrawlData?.crawlData || [];

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

  // Memoize status data
  const statusData = useMemo(
    () => [
      { label: "Total", count: totalStatusCodes },
      { label: "2xx Success", count: statusCodes["2xx"] },
      { label: "3xx Redirection", count: statusCodes["3xx"] },
      { label: "4xx Client Error", count: statusCodes["4xx"] },
      { label: "5xx Server Error", count: statusCodes["5xx"] },
    ],
    [statusCodes, totalStatusCodes],
  );

  // Memoize the toggle handler
  const handleToggle = useCallback(
    (e: React.SyntheticEvent<HTMLDetailsElement>) => {
      setIsOpen(e.currentTarget.open);
    },
    [],
  );

  useEffect(() => {
    setStatusCodes(statusData);
  }, [crawlData, statusData]);

  console.log(codes, "CODES");

  // Handle errors or missing data gracefully
  // if (!crawlData || crawlData.length === 0) {
  //   return (
  //     <div className="text-sx w-full">
  //       <details className="w-full">
  //         <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer flex items-center">
  //           <span>Status Codes</span>
  //         </summary>
  //         <div className="w-full text-xs text-brand-bright p-2">
  //           No data available.
  //         </div>
  //       </details>
  //     </div>
  //   );
  // }
  //
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
              <div className="w-1/6 text-right pr-2">
                {totalStatusCodes > 0 && data.label !== "Total"
                  ? `${((data.count / totalStatusCodes) * 100).toFixed(0)}%`
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

export default StatusCodes;
