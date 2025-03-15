// @ts-nocheck
"use client";

// Import necessary dependencies
import React, { useState, useMemo, useEffect, useCallback } from "react";
import KeywordTable from "./GSCtable";
import { invoke } from "@tauri-apps/api/core";
import { listen, emit } from "@tauri-apps/api/event";
import { toast } from "sonner";
import { StatsWidgets } from "./Widgets/WidgetsKeywordsContainer";
import {
  ChevronDown,
  RefreshCw,
  Settings,
  Database,
  FolderSearchIcon,
} from "lucide-react";
import GSCkeywordTable from "./GSCtable";

// Interface defining the structure of a Keyword object
interface Keyword {
  id: string;
  keyword: string;
  impressions: number;
  clicks: number;
  url: string;
  position: number;
  dateAdded: string;
  currentImpressions?: number;
  currentClicks?: number; // Add optional currentClicks field
}

const GSCanalytics = () => {
  // State declarations for managing keyword data and UI
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [initialData, setInitialData] = useState<Keyword[]>([]);
  const [gscData, setGscData] = useState<GscUrl[]>([]);
  const [matchedTrackedKws, setMatchedTrackedKws] = useState<KwTrackingData[]>(
    [],
  );
  const [keywordsSummary, setKeywordsSummary] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  // Memoized handlers
  const handleKeywordsSummary = useCallback(async () => {
    try {
      const response = await invoke(
        "fetch_keywords_summarized_matched_command",
      );
      setKeywordsSummary(response);
    } catch (error) {
      console.error("Failed to fetch Keywords Summary:", error);
    }
  }, []);

  const handleMatchedTrackedKws = useCallback(async () => {
    try {
      const response = await invoke("read_matched_keywords_from_db_command");
      setMatchedTrackedKws(response);
    } catch (error) {
      console.error("Failed to fetch Matched Tracked Keywords:", error);
    }
  }, []);

  // FETCH GOOSLE SEARCH CONSOLE DATA FROM THE DB

  const handleFetchGSCdataFromDB = async () => {
    try {
      const response = await invoke("read_gsc_data_from_db_command");
      setGscData(response);
    } catch (error) {
      console.error("Failed to fetch GSC URLs from DB:", error);
    }
  };

  const requestSort = useCallback((key: keyof Keyword) => {
    setSortConfig((prevConfig) => {
      const direction =
        prevConfig && prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc";
      return { key, direction };
    });
  }, []);

  const sortedKeywords = useMemo(() => {
    let sortableItems = [...keywords];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [keywords, sortConfig]);

  return (
    <div className="px-2 h-[calc(100vh-90px)]   overflow-x-hidden overflow-y-hidden dark:text-white/50 ">
      <div className="flex items-center gap-2 mb-2 ">
        <h1 className="text-2xl font-bold">Google Search Console</h1>
        <button
          onClick={handleFetchGSCdataFromDB}
          className="hover:bg-white hover:text-black dark:hover:bg-[#1F2937] p-1 rounded-md"
          title="refresh search console data"
        >
          <RefreshCw className="h-5 w-5 text-black hover:rotate-180 dark:text-white hover:text-black" />
        </button>
      </div>
      <div className="space-y-6 h-full flex flex-col ">
        {gscData.length === 0 ? (
          <div className="text-center h-[calc(100vh-15rem)] text-gray-500 flex flex-col justify-center items-center">
            <p>No data found</p>
            <p>Please make sure you have your Google Search API enabled.</p>
            <p>Refresh the table to sync with the latest data.</p>
          </div>
        ) : (
          <GSCkeywordTable gscData={gscData} />
        )}
      </div>
    </div>
  );
};

export default GSCanalytics;
