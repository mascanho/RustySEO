// @ts-nocheck
import { invoke } from "@tauri-apps/api/core";
import React, { useState, useEffect } from "react";
import {
  IconKey,
  IconClick,
  IconEye,
  IconTrendingUp,
  IconAlertCircle,
  IconChartBar
} from "@tabler/icons-react";

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

const MetricBadge = ({ icon: Icon, label, value, color }) => (
  <div className={`flex items - center gap - 1.5 px - 2 py - 1 rounded - md bg - ${color} -50 dark: bg - ${color} -500 / 10 border border - ${color} -100 dark: border - ${color} -500 / 20`}>
    <Icon size={12} className={`text - ${color} -500 dark: text - ${color} -400`} />
    <div className="flex flex-col">
      <span className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
      <span className={`text - xs font - bold text - ${color} -600 dark: text - ${color} -400`}>{value}</span>
    </div>
  </div>
);

const QueryRow = ({ item, index, selectedTableURL, credentials }) => {
  const getPositionColor = (pos) => {
    if (pos <= 3) return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10";
    if (pos <= 10) return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10";
    if (pos <= 20) return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10";
    return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-500/10";
  };

  return (
    <div className={`group px-2 py-1.5 rounded border transition-all duration-150 ${index % 2 === 0
        ? "bg-white dark:bg-brand-dark/40 border-gray-100 dark:border-brand-dark"
        : "bg-gray-50/50 dark:bg-brand-dark/20 border-gray-100 dark:border-brand-dark/50"
      } hover:bg-blue-50/50 dark:hover:bg-blue-500/5 hover:border-blue-200 dark:hover:border-blue-500/30`}>
      <div className="flex items-center gap-3">
        {/* Keyword - flex-1 to take available space */}
        <div className="flex-1 min-w-0">
          <DeepCrawlQueryContextMenu
            url={selectedTableURL?.[0] || ""}
            query={item?.query || ""}
            credentials={credentials}
            position={item?.position || 0}
            impressions={item?.impressions || 0}
            clicks={item?.clicks || 0}
          >
            <div className="flex items-center gap-1.5 cursor-pointer group/query">
              <IconKey size={11} className="text-gray-400 dark:text-gray-500 flex-none" />
              <span className="text-[10px] font-medium text-gray-700 dark:text-gray-200 group-hover/query:text-blue-600 dark:group-hover/query:text-blue-400 group-hover/query:underline truncate">
                {item?.query || "N/A"}
              </span>
            </div>
          </DeepCrawlQueryContextMenu>
        </div>

        {/* Clicks - fixed width */}
        <div className="flex items-center gap-1 w-12 justify-end">
          <IconClick size={9} className="text-blue-500 flex-none" />
          <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 tabular-nums">{item?.clicks || 0}</span>
        </div>

        {/* Impressions - fixed width */}
        <div className="flex items-center gap-1 w-14 justify-end">
          <IconEye size={9} className="text-purple-500 flex-none" />
          <span className="text-[9px] font-semibold text-purple-600 dark:text-purple-400 tabular-nums">{item?.impressions || 0}</span>
        </div>

        {/* Position - fixed width */}
        <div className={`flex-none w-14 px-1.5 py-0.5 rounded text-center ${getPositionColor(item?.position || 0)}`}>
          <span className="text-[10px] font-bold tabular-nums">
            {item?.position ? item.position.toFixed(1) : "0.0"}
          </span>
        </div>
      </div>
    </div>
  );
};

const RankingInfo = () => {
  const { items } = useRankinInfoStore();
  const { selectedTableURL } = useGlobalCrawlStore();
  const [error, setError] = useState(null);
  const [credentials, setCredentials] = useState<InstalledInfo | null>(null);

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

  const totalClicks = validateData(items)
    ? items[0].queries.reduce((sum, q) => sum + (q?.clicks || 0), 0)
    : 0;
  const totalImpressions = validateData(items)
    ? items[0].queries.reduce((sum, q) => sum + (q?.impressions || 0), 0)
    : 0;
  const avgPosition = validateData(items) && items[0].queries.length > 0
    ? (items[0].queries.reduce((sum, q) => sum + (q?.position || 0), 0) / items[0].queries.length).toFixed(1)
    : "0.0";

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <IconAlertCircle size={48} className="mb-2 text-red-400 dark:text-red-500" />
        <span className="text-sm font-medium text-red-600 dark:text-red-400">Error loading ranking data</span>
        <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{error}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-brand-darker overflow-hidden">
      <div className="p-2 border-b dark:border-brand-dark bg-gray-50/50 dark:bg-brand-dark/20">
        <div className="flex items-center gap-1.5 mb-1.5">
          <IconChartBar size={16} className="text-blue-500" />
          <h2 className="text-xs font-bold dark:text-white">Search Performance</h2>
        </div>

        {validateData(items) && items[0].queries.length > 0 && (
          <div className="grid grid-cols-3 gap-1">
            <div className="flex flex-col items-center p-1 rounded bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
              <IconClick size={10} className="text-blue-500 mb-0.5" />
              <span className="text-[7px] text-gray-500 dark:text-gray-400 uppercase leading-none">Clicks</span>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">{totalClicks}</span>
            </div>
            <div className="flex flex-col items-center p-1 rounded bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20">
              <IconEye size={10} className="text-purple-500 mb-0.5" />
              <span className="text-[7px] text-gray-500 dark:text-gray-400 uppercase leading-none">Impr.</span>
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mt-0.5">{totalImpressions}</span>
            </div>
            <div className="flex flex-col items-center p-1 rounded bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
              <IconTrendingUp size={10} className="text-emerald-500 mb-0.5" />
              <span className="text-[7px] text-gray-500 dark:text-gray-400 uppercase leading-none">Avg Pos</span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{avgPosition}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-2 custom-scrollbar">
        <div className="space-y-1.5 pb-3">
          {validateData(items) ? (
            items[0].queries.length > 0 ? (
              items[0].queries.map((item: MatchedDataItem, index: number) => (
                <QueryRow
                  key={`query - ${index} -${item?.query || index} `}
                  item={item}
                  index={index}
                  selectedTableURL={selectedTableURL}
                  credentials={credentials}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <IconKey size={48} className="mb-2 text-gray-300 dark:text-gray-600 opacity-50" />
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">No queries found</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">Select a URL to view ranking data</span>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <IconChartBar size={48} className="mb-2 text-gray-300 dark:text-gray-600 opacity-50 animate-pulse" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading ranking data...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RankingInfo;
