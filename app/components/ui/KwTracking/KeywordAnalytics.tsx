// @ts-nocheck
"use client";

// Import necessary dependencies
import React, { useState, useMemo, useEffect } from "react";
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
const handleTrackingMatch = async (event: CustomEvent) => {
  const response = await invoke("match_tracked_with_gsc_command");
  console.log("Keywords matched with GSC data:", response);
};

export default function KeywordAnalytics() {
  // State declarations for managing keyword data and UI
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [initialData, setInitialData] = useState<Keyword[]>([]);
  const [eventReceived, setEventReceived] = useState(false);
  const [gscData, setGscData] = useState<GscUrl[]>([]);
  const [matchedTrackedKws, setMatchedTrackedKws] = useState<KwTrackingData[]>(
    [],
  );
  const [keywordsSummary, setKeywordsSummary] = useState([]);

  // Function to fetch and transform keyword data
  const handleFetchKeywords = async () => {
    try {
      const response = await invoke("fetch_tracked_keywords_command");
      console.log("Keywords fetched successfully:", response);

      const summaryResponse = await invoke(
        "fetch_keywords_summarized_matched_command",
      );

      // Transform API response into required format with summary data
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
      setKeywordsSummary(summaryResponse);
      sessionStorage.setItem(
        "keywordsLength",
        transformedData.length.toString(),
      );
    } catch (error) {
      console.error("Failed to fetch keywords:", error);
    }
  };

  // Function to filter and extract keywords from initial data
  function filterInitialDataKws(keywordsArray: Keyword[]) {
    const filteredKws = keywordsArray.map((kw) => {
      const filteredKw = Object.keys(kw).reduce((acc, key) => {
        if (key !== "dateAdded") {
          acc[key] = kw[key];
        }
        return acc;
      }, {} as Keyword);

      return filteredKw.keyword;
    });

    return filteredKws;
  }

  const initialKws = filterInitialDataKws(initialData);

  console.log("initialKws", initialKws);

  // Type definition for sorting configuration
  type SortConfig = {
    key: keyof Keyword;
    direction: "asc" | "desc";
  } | null;

  // Effect hook to initialize data and set up event listener
  useEffect(() => {
    handleFetchKeywords();

    const setupListener = async () => {
      try {
        const unlisten = await listen("keyword-tracked", (event) => {
          console.log("Keyword tracked event received:", event);
          handleFetchKeywords();
        });
        return unlisten;
      } catch (err) {
        console.error("Error setting up event listener:", err);
        return null;
      }
    };

    setupListener();

    return () => {
      setupListener().then((unlisten) => {
        if (unlisten) unlisten();
      });
    };
  }, []);

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

  // Function to handle sort requests
  const requestSort = (key: keyof Keyword) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Function to remove a keyword
  const removeKeyword = async (id: string) => {
    try {
      const keywordToDelete = keywords.find((k) => k.id === id);
      await invoke("delete_keyword_command", { id });
      setKeywords(keywords.filter((keyword) => keyword.id !== id));
      await emit("keyword-tracked", { action: "delete", id });
      toast.success(`Keyword deleted: (ID: ${id})`);
    } catch (error) {
      console.error("Failed to remove keyword:", error);
      toast.error("Failed to delete keyword");
    }
  };

  // Function to fetch GSC data
  const handleGSCFetchData = async () => {
    try {
      const response = await invoke("read_gsc_data_from_db_command");
      console.log("GSC Data fetched successfully:", response);
      setGscData(response);
    } catch (error) {
      console.error("Failed to fetch GSC data:", error);
    } finally {
      console.log("GSC Data fetched successfully:", gscData);
    }
  };

  // Function to fetch matched tracked keywords
  const handleMatchedTrackedKws = async () => {
    try {
      const response = await invoke("read_matched_keywords_from_db_command");
      console.log("Matched Tracked Keywords fetched successfully:", response);
      setMatchedTrackedKws(response);
    } catch (error) {
      console.error("Failed to fetch Matched Tracked Keywords:", error);
    } finally {
      console.log("Matched Tracked Keywords fetched successfully");
    }
  };

  // FUNCTION TO FETCH KEYWORDS SUMMARIZED AND MATCHED WITH GSC DATA
  const handleKeywordsSummary = async () => {
    try {
      const response = await invoke(
        "fetch_keywords_summarized_matched_command",
      );
      console.log("Keywords Summary fetched successfully:", response);
      setKeywordsSummary(response);
      handleFetchKeywords(); // Refresh the table data with new summary
    } catch (error) {
      console.error("Failed to fetch Keywords Summary:", error);
    }
  };

  console.log(keywordsSummary, "KWS SUMMARYYYYYY");

  return (
    <div className="px-2 h-[calc(100vh-10rem)] border  overflow-x-hidden overflow-y-hidden dark:text-white/50 ">
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-2xl font-bold">Tracking Dashboard</h1>
        <DropdownMenu>
          <DropdownMenuTrigger className="hover:bg-white dark:hover:bg-[#1F2937] p-1 rounded-md">
            <Settings className="h-5 w-5 text-black dark:text-white" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white dark:bg-brand-darker">
            <DropdownMenuItem
              onClick={handleGSCFetchData}
              className="focus:text-white hover:text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4 text-black dark:text-white" />{" "}
              Get GSC Data
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleFetchKeywords}
              className="focus:text-white hover:text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4 text-black dark:text-white" />{" "}
              Refresh Data
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleTrackingMatch}
              className="focus:text-white hover:text-white"
            >
              <Database className="mr-2 h-4 w-4 text-black dark:text-white" />{" "}
              Match with GSC
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleMatchedTrackedKws}
              className="focus:text-white hover:text-white"
            >
              <Database className="mr-2 h-4 w-4 text-black dark:text-white" />{" "}
              Tracked Keywords with GSC
            </DropdownMenuItem>{" "}
            <DropdownMenuItem className="focus:text-white hover:text-white">
              <Settings className="mr-2 h-4 w-4 text-black dark:text-white" />{" "}
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleKeywordsSummary}
              className="focus:text-white hover:text-white"
            >
              <Settings className="mr-2 h-4 w-4 text-black dark:text-white" />{" "}
              Summary Kws
            </DropdownMenuItem>{" "}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-6 h-fit">
        <StatsWidgets keywordsSummary={keywordsSummary} />
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
