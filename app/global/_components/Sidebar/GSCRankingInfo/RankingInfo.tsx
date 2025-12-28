// @ts-nocheck
import { invoke } from "@/lib/invoke";
import React, { useState, useEffect } from "react";

import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import useRankinInfoStore from "@/store/RankingInfoStore";
import DeepCrawlQueryContextMenu from "./DeepCrawlQueryContextMenu";

interface MatchedDataItem {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface InstalledInfo {
  clientId: string;
  clientSecret: string;
}

const RankingInfo = () => {
  // Use the store directly - no need for local state
  const { items } = useRankinInfoStore();
  const { selectedTableURL } = useGlobalCrawlStore();
  const [error, setError] = useState(null);
  const [credentials, setCredentials] = useState<InstalledInfo | null>(null);

  // Debug selectedTableURL structure
  console.log("=== DEEP CRAWL DEBUG ===");
  console.log("selectedTableURL:", selectedTableURL);
  console.log("selectedTableURL type:", typeof selectedTableURL);
  console.log("selectedTableURL length:", selectedTableURL?.length);
  console.log("selectedTableURL[0]:", selectedTableURL?.[0]);
  console.log("========================");

  // Safe data validation
  const validateData = (data) => {
    try {
      return (
        Array.isArray(data) &&
        data.length > 0 &&
        data[0] &&
        Array.isArray(data[0].queries)
      );
    } catch (err) {
      console.error("Data validation error:", err);
      setError("Invalid data structure");
      return false;
    }
  };

  // Debug logging with error handling
  useEffect(() => {
    try {
      console.log("Store items updated:", items);
      console.log("Items length:", items?.length || 0);
      if (validateData(items)) {
        console.log("First item queries:", items[0]?.queries);
        console.log("Queries length:", items[0]?.queries?.length || 0);
      }
      setError(null);
    } catch (err) {
      console.error("Error in useEffect:", err);
      setError("Error processing ranking data");
    }
  }, [items]);

  useEffect(() => {
    const getCredentials = async () => {
      try {
        const credentials = await invoke("get_search_console_credentials");
        // @ts-ignore
        setCredentials(credentials);
      } catch (error) {
        console.error("Error fetching credentials:", error);
      }
    };

    getCredentials();
  }, []);

  if (error) {
    return (
      <div className="w-full ranking-table max-w-full h-[calc(38rem-260px)] overflow-auto bg-brand-bright/5 dark:bg-transparent">
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500 text-center">
            <p className="text-sm font-medium">Error loading ranking data</p>
            <p className="text-xs text-gray-500 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full ranking-table max-w-full h-[calc(38rem-260px)] overflow-auto bg-brand-bright/5 dark:bg-transparent relative z-10">
      <table className="w-full text-xs">
        <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
          <tr>
            <th align="left" className="py-2 -ml-4 text-left text-[10px]">
              <span className="-ml-2">Queries</span>
            </th>
            <th className="py-2 text-center text-[10px]">Clicks</th>
            <th className="py-2 text-right text-[10px]">Imp.</th>
            <th className="py-2 text-center text-[10px] bg-brand-dark !important">
              Pos.
            </th>
          </tr>
        </thead>
        <tbody className="text-[9px]">
          {validateData(items) ? (
            items[0].queries.map((item: MatchedDataItem, index: number) => {
              try {
                return (
                  <tr
                    key={`query-${index}-${item?.query || index}`}
                    className={`
                      ${index % 1 === 0 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-900"}
                      transition-colors duration-150
                    `}
                  >
                    <td className="py-2 pl-2 truncate text-[9px] max-w-[130px] overflow-visible text-ellipsis relative">
                      <DeepCrawlQueryContextMenu
                        url={selectedTableURL?.[0] || ""}
                        query={item?.query || ""}
                        credentials={credentials}
                        position={item?.position || 0}
                        impressions={item?.impressions || 0}
                        clicks={item?.clicks || 0}
                      >
                        <span className="pointer hover:underline hover:text-brand-bright text-[10px] cursor-pointer block">
                          {item?.query || "N/A"}
                        </span>
                      </DeepCrawlQueryContextMenu>
                    </td>
                    <td
                      align="left"
                      className="py-2 text-center text-brand-bright text-[9px]"
                    >
                      {item?.clicks || 0}
                    </td>
                    <td
                      align="right"
                      className="py-2 text-purple-500 text-[9px]"
                    >
                      {item?.impressions || 0}
                    </td>
                    <td className="py-2 text-center text-blue-500 text-[9px]">
                      {item?.position ? item.position.toFixed(2) : "0.00"}
                    </td>
                  </tr>
                );
              } catch (itemError) {
                console.error(
                  `Error rendering item at index ${index}:`,
                  itemError,
                );
                return (
                  <tr key={`error-${index}`}>
                    <td
                      colSpan={4}
                      className="py-2 text-center text-red-500 text-[9px]"
                    >
                      Error rendering item {index + 1}
                    </td>
                  </tr>
                );
              }
            })
          ) : (
            <tr>
              <td colSpan={4} className="py-4 text-center text-gray-500">
                {items?.length === 0
                  ? "No ranking data available"
                  : "Loading ranking data..."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RankingInfo;
