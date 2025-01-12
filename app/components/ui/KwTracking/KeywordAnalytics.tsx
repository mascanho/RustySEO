// @ts-nocheck
"use client";

// Import necessary dependencies
import React, { useState, useMemo, useEffect, useCallback } from "react";
import KeywordTable from "./KeywordTable";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Interface defining the structure of a Keyword object
interface Keyword {
  id: string;
  keyword: string;
  initialImpressions: number;
  currentImpressions: number;
  initialClicks: number;
  currentClicks: number;
  url: string;
  initialPosition: number;
  currentPosition: number;
  dateAdded: string;
}

// Function to handle matching tracked keywords with GSC data
const handleTrackingMatch = async () => {
  const response = await invoke("match_tracked_with_gsc_command");
  console.log("Keywords matched with GSC data:", response);
  return response;
};

export default function KeywordAnalytics() {
  // State declarations for managing keyword data and UI
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [initialData, setInitialData] = useState<Keyword[]>([]);
  const [gscData, setGscData] = useState<GscUrl[]>([]);
  const [matchedTrackedKws, setMatchedTrackedKws] = useState<KwTrackingData[]>(
    [],
  );
  const [keywordsSummary, setKeywordsSummary] = useState([]);

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

  const updateAllData = useCallback(async () => {
    try {
      await handleTrackingMatch();
      await handleKeywordsSummary();
      await handleFetchKeywords();
      toast.success("Data refreshed successfully");
      console.log("Updating all data");
    } catch (error) {
      toast.error("Failed to refresh data");
      console.error("Error updating data:", error);
    }
  }, []);

  const handleFetchKeywords = useCallback(async () => {
    try {
      const response = await invoke("fetch_tracked_keywords_command");
      const summaryResponse = await invoke(
        "fetch_keywords_summarized_matched_command",
      );

      const transformedData = response.map((item) => {
        const summaryMatch = summaryResponse.find(
          (s) => s.query === item.query,
        );

        return {
          id: item.id,
          keyword: item.query,
          initialImpressions: summaryMatch
            ? summaryMatch.initial_impressions
            : item.impressions,
          currentImpressions: summaryMatch
            ? summaryMatch.current_impressions
            : item.impressions,
          initialClicks: summaryMatch
            ? summaryMatch.initial_clicks
            : item.clicks,
          currentClicks: summaryMatch
            ? summaryMatch.current_clicks
            : item.clicks,
          url: item.url,
          initialPosition: summaryMatch
            ? summaryMatch.initial_position.toFixed(1)
            : item.position.toFixed(1),
          currentPosition: summaryMatch
            ? Number(summaryMatch.current_position.toFixed(1))
            : Number(item.position.toFixed(1)),
          dateAdded: new Date(item.date).toLocaleDateString("en-GB", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
          }),
        };
      });

      setInitialData(transformedData);
      setKeywords(transformedData);
      sessionStorage.setItem(
        "keywordsLength",
        transformedData.length.toString(),
      );
    } catch (error) {
      console.error("Failed to fetch keywords:", error);
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

  const handleGSCFetchData = useCallback(async () => {
    try {
      const response = await invoke("read_gsc_data_from_db_command");
      setGscData(response);
    } catch (error) {
      console.error("Failed to fetch GSC data:", error);
    }
  }, []);

  const removeKeyword = useCallback(async (id: string) => {
    try {
      await invoke("delete_keyword_command", { id });
      setKeywords((prevKeywords) =>
        prevKeywords.filter((keyword) => keyword.id !== id),
      );
      await emit("keyword-tracked", { action: "delete", id });
      toast.success(`Keyword deleted: (ID: ${id})`);
    } catch (error) {
      console.error("Failed to remove keyword:", error);
      toast.error("Failed to delete keyword");
    }
  }, []);

  const requestSort = useCallback((key: keyof Keyword) => {
    setSortConfig((prevConfig) => {
      const direction =
        prevConfig && prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc";
      return { key, direction };
    });
  }, []);

  // Effect hook to initialize data and set up event listener
  useEffect(() => {
    const initData = async () => {
      await handleFetchKeywords();
      await handleKeywordsSummary();
    };

    initData();

    const setupListener = async () => {
      try {
        const unlisten = await listen("keyword-tracked", updateAllData);
        return unlisten;
      } catch (err) {
        console.error("Error setting up event listener:", err);
        return null;
      }
    };

    const unsubscribe = setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe.then((unlisten) => {
          if (unlisten) unlisten();
        });
      }
    };
  }, [updateAllData]);

  // Memoized sorting function for keywords
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
    <div className="px-2 h-[calc(100vh-10rem)]   overflow-x-hidden overflow-y-hidden dark:text-white/50 ">
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-2xl font-bold">Tracking Dashboard</h1>
        <DropdownMenu>
          <DropdownMenuTrigger className="hover:bg-white hover:text-black  dark:hover:bg-[#1F2937] p-1 rounded-md">
            <Settings className="h-5 w-5 text-black dark:text-white  hover:text-black" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white dark:bg-brand-darker border-brand-dark">
            <DropdownMenuItem
              onClick={handleGSCFetchData}
              className="text-black dark:text-white hover:text-white focus:text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4  dark:text-white hover:text-white focus:text-white" />{" "}
              Get GSC Data
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={updateAllData}
              className="dark:text-white hover:text-white focus:text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4  dark:text-white hover:text-white focus:text-white" />{" "}
              Refresh Data
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleTrackingMatch}
              className=" dark:text-white hover:text-white focus:text-white"
            >
              <Database className="mr-2 h-4 w-4 dark:text-white hover:text-white focus:text-white" />{" "}
              Match with GSC
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleMatchedTrackedKws}
              className="dark:text-white hover:text-white focus:text-white"
            >
              <Database className="mr-2 h-4 w-4 dark:text-white hover:text-white focus:text-white" />{" "}
              Tracked Keywords with GSC
            </DropdownMenuItem>{" "}
            <DropdownMenuItem
              onClick={handleKeywordsSummary}
              className="text-black dark:text-white hover:text-white focus:text-white"
            >
              <Settings className="mr-2 h-4 w-4 text-black dark:text-white hover:text-white focus:text-white" />{" "}
              Summary Kws
            </DropdownMenuItem>{" "}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-6 h-fit">
        <StatsWidgets
          keywordsSummary={keywordsSummary}
          fetchKeywordsSummary={handleKeywordsSummary}
        />
        <KeywordTable
          keywords={sortedKeywords}
          removeKeyword={removeKeyword}
          requestSort={requestSort}
          sortConfig={sortConfig}
          keywordIds={keywords.map((k) => k.id)}
        />
      </div>
    </div>
  );
}
