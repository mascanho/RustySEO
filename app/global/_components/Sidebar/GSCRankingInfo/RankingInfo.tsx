// @ts-nocheck
import { invoke } from "@tauri-apps/api/core";
import React, { useState, useEffect } from "react";
import RankingMenus from "../../Sidebar/../Sidebar/GSCRankingInfo/RankingInfo";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import useRankinInfoStore from "@/store/RankingInfoStore";

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

  // Debug logging to see what's happening
  useEffect(() => {
    console.log("Store items updated:", items);
    console.log("Items length:", items.length);
    if (items.length > 0) {
      console.log("First item queries:", items[0]?.queries);
      console.log("Queries length:", items[0]?.queries?.length);
    }
  }, [items[1]]);

  return (
    <div className="w-full ranking-table max-w-full h-[calc(38rem-260px)] overflow-auto bg-brand-bright/5 dark:bg-transparent">
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
          {items.length > 0 && items[0]?.queries ? (
            items[0].queries.map((item: MatchedDataItem, index: number) => (
              <tr
                key={index}
                className={`
                  ${index % 1 === 0 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-900"}
                  transition-colors duration-150
                `}
              >
                <td className="py-2 pl-2 truncate text-[9px] max-w-[130px] overflow-hidden text-ellipsis">
                  <span className="pointer hover:underline hover:text-brand-bright text-[10px] overflow-hidden text-ellipsis">
                    {item.query}
                  </span>
                </td>
                <td
                  align="left"
                  className="py-2 text-center text-brand-bright text-[9px]"
                >
                  {item.clicks}
                </td>
                <td align="right" className="py-2 text-purple-500 text-[9px]">
                  {item.impressions}
                </td>
                <td className="py-2 text-center text-blue-500 text-[9px]">
                  {item.position.toFixed(2)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="py-4 text-center text-gray-500">
                No ranking data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RankingInfo;
