// @ts-nocheck
"use client";

// Import necessary dependencies
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, emit } from "@tauri-apps/api/event";
import { toast } from "sonner";
import { StatsWidgets } from "./Widgets/WidgetsKeywordsContainer";
import {
  RefreshCw,
  Settings,
  Database,
  ArrowUp,
  ArrowDown,
  Target,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UniversalKeywordTable } from "../Shared/UniversalKeywordTable";
import { ColumnDef } from "@tanstack/react-table";
import KeywordRowMenu from "./KeywordRowMenu";

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

export default function KeywordAnalytics() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [keywordsSummary, setKeywordsSummary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  const handleKeywordsSummary = useCallback(async () => {
    try {
      const response = await invoke("fetch_keywords_summarized_matched_command");
      setKeywordsSummary(response);
    } catch (error) {
      console.error("Failed to fetch Keywords Summary:", error);
    }
  }, []);

  const handleFetchKeywords = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await invoke("fetch_tracked_keywords_command");
      const summaryResponse = await invoke("fetch_keywords_summarized_matched_command");

      const transformedData = response.map((item) => {
        const summaryMatch = summaryResponse.find((s) => s.query === item.query);
        return {
          id: String(item.id),
          keyword: item.query,
          initialImpressions: summaryMatch ? summaryMatch.initial_impressions : item.impressions,
          currentImpressions: summaryMatch ? summaryMatch.current_impressions : item.impressions,
          initialClicks: summaryMatch ? summaryMatch.initial_clicks : item.clicks,
          currentClicks: summaryMatch ? summaryMatch.current_clicks : item.clicks,
          url: item.url,
          initialPosition: summaryMatch ? Number(summaryMatch.initial_position.toFixed(1)) : Number(item.position.toFixed(1)),
          currentPosition: summaryMatch ? Number(summaryMatch.current_position.toFixed(1)) : Number(item.position.toFixed(1)),
          dateAdded: new Date(item.date).toLocaleDateString("en-GB", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
          }),
        };
      });

      setKeywords(transformedData);
      sessionStorage.setItem("keywordsLength", transformedData.length.toString());
    } catch (error) {
      console.error("Failed to fetch keywords:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFullRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      await invoke("match_tracked_with_gsc_command");
      await handleFetchKeywords();
      await handleKeywordsSummary();
      toast.success("Data refreshed and matched with GSC");
    } catch (error) {
      console.error("Failed to refresh data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setIsLoading(false);
    }
  }, [handleFetchKeywords, handleKeywordsSummary]);

  useEffect(() => {
    const initData = async () => {
      await handleFetchKeywords();
      await handleKeywordsSummary();
    };
    initData();

    const setupListener = async () => {
      try {
        return await listen("keyword-tracked", (event) => {
          if (event.payload.action === "add" || event.payload.action === "delete") {
            setNeedsUpdate(true);
          }
        });
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
  }, [handleFetchKeywords, handleKeywordsSummary]);

  useEffect(() => {
    if (needsUpdate) {
      handleFetchKeywords();
      handleKeywordsSummary();
      setNeedsUpdate(false);
    }
  }, [needsUpdate, handleFetchKeywords, handleKeywordsSummary]);

  const removeKeyword = useCallback(
    async (id: string) => {
      try {
        await invoke("delete_keyword_command", { id });
        setKeywords((prev) => prev.filter((k) => k.id !== id));
        await emit("keyword-tracked", { action: "delete", id });
        toast.success(`Keyword deleted`);
        handleKeywordsSummary();
      } catch (error) {
        console.error("Failed to remove keyword:", error);
        toast.error("Failed to delete keyword");
      }
    },
    [handleKeywordsSummary]
  );

  const renderChange = (current: number, initial: number, inverse = false) => {
    const change = current - initial;
    if (change === 0) return null;
    const isPositive = inverse ? change < 0 : change > 0;
    const color = isPositive ? "text-green-500" : "text-red-500";
    return (
      <span className={`inline-flex items-center ml-1 text-[10px] ${color}`}>
        {isPositive ? <ArrowUp className="h-2 w-2" /> : <ArrowDown className="h-2 w-2" />}
        {Math.abs(change).toFixed(1)}
      </span>
    );
  };

  const columns = useMemo<ColumnDef<Keyword>[]>(
    () => [
      {
        accessorKey: "keyword",
        header: "Keyword",
        cell: ({ row }) => (
          <span className="text-blue-600 font-semibold truncate block max-w-[150px]">
            {row.original.keyword}
          </span>
        ),
      },
      {
        accessorKey: "currentImpressions",
        header: "Impressions",
        cell: ({ row }) => (
          <div className="flex items-center">
            {row.original.currentImpressions.toLocaleString()}
            {renderChange(row.original.currentImpressions, row.original.initialImpressions)}
          </div>
        ),
      },
      {
        accessorKey: "currentClicks",
        header: "Clicks",
        cell: ({ row }) => (
          <div className="flex items-center">
            {row.original.currentClicks.toLocaleString()}
            {renderChange(row.original.currentClicks, row.original.initialClicks)}
          </div>
        ),
      },
      {
        accessorKey: "currentPosition",
        header: "Position",
        cell: ({ row }) => (
          <div className="flex items-center">
            <span className={row.original.currentPosition <= 10 ? "text-green-500" : "text-red-500"}>
              {row.original.currentPosition.toFixed(1)}
            </span>
            {renderChange(row.original.currentPosition, row.original.initialPosition, true)}
          </div>
        ),
      },
      {
        accessorKey: "url",
        header: "URL",
        cell: ({ row }) => (
          <div className="max-w-[300px] truncate text-gray-500" title={row.original.url}>
            {row.original.url}
          </div>
        ),
      },
      {
        accessorKey: "dateAdded",
        header: "Added",
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <KeywordRowMenu
            keywordId={row.original.id}
            removeKeyword={removeKeyword}
            keywordIds={keywords.map((k) => k.id)}
          />
        ),
        size: 40,
      },
    ],
    [keywords, removeKeyword]
  );

  return (
    <div className="px-2 pb-2 pt-0 h-full flex flex-col dark:text-white/50">
      <div className="flex items-center justify-between mb-2 flex-shrink-0 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-bold dark:text-white leading-none">
              Keyword Tracking
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-none">
              Monitored rankings
            </p>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 mb-2">
        <StatsWidgets
          keywordsSummary={keywordsSummary}
          fetchKeywordsSummary={handleKeywordsSummary}
        />
      </div>

      <div className="flex-1 min-h-0 relative">
        <UniversalKeywordTable
          data={keywords}
          columns={columns}
          searchPlaceholder="Search keywords..."
          isLoading={isLoading}
          headerActions={
            <div className="flex items-center gap-2">
              <button
                onClick={handleFullRefresh}
                className="h-9 w-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-brand-dark rounded-xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-brand-dark text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Refresh & Match GSC"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </button>

              <div className="w-px h-6 bg-gray-200 dark:bg-brand-dark mx-1"></div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 w-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-brand-dark rounded-xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-brand-dark text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <Settings className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-brand-darker border-brand-dark">
                  <DropdownMenuItem onClick={() => invoke("match_tracked_with_gsc_command")}>
                    <Database className="mr-2 h-4 w-4" /> Force Match GSC
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        />
      </div>
    </div>
  );
}
