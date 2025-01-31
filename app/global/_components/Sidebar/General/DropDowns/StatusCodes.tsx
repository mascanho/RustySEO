// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useState } from "react";

const StatusCodes = () => {
  const domainCrawlData = useGlobalCrawlStore();
  const [isOpen, setIsOpen] = useState(false); // State to track if details are open

  const statusCodes = domainCrawlData?.crawlData?.reduce(
    (acc, item) => {
      const statusCode = item?.status_code;
      if (statusCode >= 200 && statusCode < 300) acc["2xx"]++;
      else if (statusCode >= 300 && statusCode < 400) acc["3xx"]++;
      else if (statusCode >= 400 && statusCode < 500) acc["4xx"]++;
      else if (statusCode >= 500) acc["5xx"]++;
      return acc;
    },
    { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 },
  );

  const totalStatusCodes =
    statusCodes["2xx"] +
    statusCodes["3xx"] +
    statusCodes["4xx"] +
    statusCodes["5xx"];

  const statusData = [
    { label: "Total", count: totalStatusCodes },
    { label: "2xx Success", count: statusCodes["2xx"] },
    { label: "3xx Redirection", count: statusCodes["3xx"] },
    { label: "4xx Client Error", count: statusCodes["4xx"] },
    { label: "5xx Server Error", count: statusCodes["5xx"] },
  ];

  return (
    <div className="text-sx w-full">
      <details
        className="w-full"
        onToggle={(e) => setIsOpen(e.currentTarget.open)} // Update state when details are toggled
      >
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer flex items-center">
          <span>Status Codes</span>
        </summary>
        {/* Data Rows (inside details, only visible when open) */}
        <div className="w-full">
          {/* Header Row */}
          {/* Data Rows */}
          {statusData.map((data, index) => (
            <div
              key={index}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className="w-2/3 pl-2.5 py-1 text-brand-bright">
                {data?.label}
              </div>
              <div className="w-1/6 text-right pr-2">{data?.count}</div>
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
