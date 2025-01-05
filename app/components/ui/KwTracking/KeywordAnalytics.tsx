// @ts-nocheck
"use client";

import React, { useState, useMemo, useEffect } from "react";
import KeywordTable from "./KeywordTable";
import { invoke } from "@tauri-apps/api/core";

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

  const handleFetchKeywords = async () => {
    // Call the Rust function to fetch keywords from the database
    try {
      const response = await invoke("fetch_tracked_keywords_command");
      console.log("Keywords fetched successfully:", response);

      // Transform the response data to match Keyword interface
      const transformedData = response.map((item) => ({
        id: item.id.toString(),
        keyword: item.query,
        initialImpressions: item.impressions,
        currentImpressions: Math.floor(Math.random() * 5000), // Random placeholder
        initialClicks: item.clicks,
        currentClicks: Math.floor(Math.random() * 500), // Random placeholder
        url: item.url,
        initialPosition: item.position,
        currentPosition: Math.random() * 10, // Random placeholder
        dateAdded: item.date,
      }));

      setInitialData(transformedData);
      setKeywords(transformedData);
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

  const removeKeyword = (id: string) => {
    setKeywords(keywords.filter((keyword) => keyword.id !== id));
  };

  return (
    <div className="container mx-auto p-4">
      <h1
        onClick={() => handleFetchKeywords()}
        className="text-2xl font-bold mb-4"
      >
        Keyword{" "}
      </h1>
      <div>
        <KeywordTable
          keywords={sortedKeywords}
          removeKeyword={removeKeyword}
          requestSort={requestSort}
          sortConfig={sortConfig}
        />
      </div>
    </div>
  );
}
