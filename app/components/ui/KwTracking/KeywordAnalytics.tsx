// @ts-nocheck
"use client";

import React, { useState, useMemo, useEffect } from "react";
import KeywordTable from "./KeywordTable";
import { invoke } from "@tauri-apps/api/core";
import { listen, emit } from "@tauri-apps/api/event";
import { toast } from "sonner";

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
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [initialData, setInitialData] = useState<Keyword[]>([]);
  const [eventReceived, setEventReceived] = useState(false);

  const handleFetchKeywords = async () => {
    try {
      const response = await invoke("fetch_tracked_keywords_command");
      console.log("Keywords fetched successfully:", response);

      const transformedData = response.map((item) => ({
        id: item.id,
        keyword: item.query,
        initialImpressions: item.impressions,
        currentImpressions: Math.floor(Math.random() * 5000),
        initialClicks: item.clicks,
        currentClicks: Math.floor(Math.random() * 500),
        url: item.url,
        initialPosition: item.position.toFixed(1),
        currentPosition: Number((Math.random() * 10).toFixed(1)),
        dateAdded: new Date(item.date).toLocaleDateString("en-GB", {
          year: "2-digit",
          month: "2-digit",
          day: "2-digit",
        }),
      }));

      setInitialData(transformedData);
      setKeywords(transformedData);
      sessionStorage.setItem(
        "keywordsLength",
        transformedData.length.toString(),
      );
    } catch (error) {
      console.error("Failed to fetch keywords:", error);
    }
  };

  type SortConfig = {
    key: keyof Keyword;
    direction: "asc" | "desc";
  } | null;

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

  const removeKeyword = async (id: string) => {
    try {
      const keywordToDelete = keywords.find((k) => k.id === id);
      await invoke("delete_keyword_command", { id });
      setKeywords(keywords.filter((keyword) => keyword.id !== id));
      await emit("keyword-tracked", { action: "delete", id });
      toast.success(`Keyword deleted: ${keywordToDelete?.keyword} (ID: ${id})`);
    } catch (error) {
      console.error("Failed to remove keyword:", error);
      toast.error("Failed to delete keyword");
    }
  };

  return (
    <div className="pb-4 px-2 overflow-hidden dark:text-white/50">
      <h1 className="text-2xl font-bold mb-2">Keyword Analytics</h1>
      <KeywordTable
        keywords={sortedKeywords}
        removeKeyword={removeKeyword}
        requestSort={requestSort}
        sortConfig={sortConfig}
        keywordIds={keywords.map((k) => k.id)}
      />
    </div>
  );
}
