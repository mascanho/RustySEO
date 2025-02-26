// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useState } from "react";
import { MdOutlineErrorOutline } from "react-icons/md";
import { RiPagesLine, RiCalendarLine } from "react-icons/ri";

const HistoryDomainCrawls = () => {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [crawlHistory, setCrawlHistory] = useState<DeepCrawlHistory[]>([]);
  const [error, setError] = useState<string | null>(null); // Add error state for UI feedback
  const { crawlData, domainCrawlLoading, issues, summary } =
    useGlobalCrawlStore();

  // Define the DeepCrawlHistory type
  type DeepCrawlHistory = {
    id?: number; // Make `id` optional
    domain: string;
    date: string;
    pages: number;
    errors: number;
    status: string;
    total_links: number;
    total_internal_links: number;
    total_external_links: number;
    indexable_pages: number;
    not_indexable_pages: number;
  };

  // Fetch data from the database
  const fetchData = async () => {
    try {
      const result = await invoke("read_domain_results_history_table");
      console.log("Data fetched successfully:", result);
      setCrawlHistory(Array.isArray(result) ? result : []); // Ensure result is an array
      setError(null); // Clear any previous error
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch crawl history. Check the console for details.");
    }
  };

  // Add new crawl data to the database
  const addDataToDatabase = async () => {
    if (crawlData.length === 0) {
      console.warn("No crawl data available to add to database");
      return;
    }

    const totalIssueCount = issues.reduce(
      (sum, item) => sum + item.issueCount,
      0,
    );

    const newEntry: DeepCrawlHistory = {
      // Omit `id` since it's auto-generated by the database
      id: 1,
      domain: crawlData[0]?.url || "",
      date: new Date().toISOString(),
      pages: crawlData.length || 0,
      errors: totalIssueCount || 0,
      status: "completed",
      total_links: summary?.totalLinksFound || 0,
      total_internal_links: summary?.totalInternalLinks || 0,
      total_external_links: summary?.totalExternalLinks || 0,
      indexable_pages: Math.max(
        0,
        (crawlData.length || 0) - (summary?.totalNotIndexablePages || 0),
      ),
      not_indexable_pages: summary?.totalNotIndexablePages || 0,
    };

    try {
      const result = await invoke("create_domain_results_history", {
        data: [newEntry],
      });
      console.log("Data added to database:", result);
      setError(null);
    } catch (error) {
      console.error("Error adding data to database:", error);
      setError(
        "Failed to add crawl data to database. Check the console for details.",
      );
    }
  };

  // Set up the event listener for `crawl_complete` only once
  useEffect(() => {
    let unlistenFn;
    const setupListener = async () => {
      unlistenFn = await listen("crawl_complete", async () => {
        console.log("Crawl complete event received");
        console.log("Current crawlData:", crawlData); // Debug crawlData state
        // await addDataToDatabase();
        await fetchData();
      });
    };

    setupListener().catch((err) =>
      console.error("Failed to set up listener:", err),
    );

    // Cleanup the event listener when the component unmounts
    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, [crawlData]); // Empty dependency array to run only once

  // Listen for changes in localStorage CrawledLinks
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "CrawledLinks") {
        handleAddToDB();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Fetch initial data and create table when the component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        await invoke("create_domain_results_table");
        console.log("Table created or already exists");
        await fetchData(); // Fetch initial data
      } catch (error) {
        console.error("Error initializing:", error);
        setError(
          "Failed to initialize crawl history. Check the console for details.",
        );
      }
    };

    initialize();
  }, []);

  const handleRowClick = (index: number) => {
    const currentExpandedRows = [...expandedRows];
    const rowIndex = currentExpandedRows.indexOf(index);
    if (rowIndex >= 0) {
      currentExpandedRows.splice(rowIndex, 1);
    } else {
      currentExpandedRows.push(index);
    }
    setExpandedRows(currentExpandedRows);
  };

  const handleAddToDB = () => {
    addDataToDatabase();
  };

  return (
    <div className="text-xs h-[calc(28rem-2rem)] overflow-auto">
      {error && (
        <div className="text-red-500 p-2 bg-red-100 dark:bg-red-900 mb-2">
          {error}
        </div>
      )}
      <div className="text-center">
        <button onClick={() => addDataToDatabase()}>Add to DB</button>

        <div>
          {crawlHistory.length === 0 && !error && (
            <p className="text-gray-500">No crawl history available.</p>
          )}
          {crawlHistory
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            )
            .map((entry, index) => (
              <React.Fragment key={entry.id || index}>
                <div
                  onClick={() => handleRowClick(index)}
                  className={`cursor-pointer px-2 flex mr-2 py-1 justify-between ${
                    index % 2 === 0
                      ? "bg-gray-100 dark:bg-brand-darker"
                      : "bg-gray-200 dark:bg-brand-darker"
                  }`}
                >
                  <div className="flex items-center space-x-1 flex-1">
                    <RiCalendarLine className="text-gray-500" />
                    <span>{entry.date.split("T")[0]}</span>
                  </div>
                  <div className="flex items-center space-x-1 justify-end flex-1">
                    <span className="text-right">{entry.pages}</span>
                    <RiPagesLine className="text-gray-500" />
                  </div>
                  <div className="flex items-center space-x-2 flex-1 justify-end">
                    <span>
                      <MdOutlineErrorOutline className="mr-1 text-red-500" />
                    </span>
                    {entry.errors}
                  </div>
                </div>
                {expandedRows.includes(index) && (
                  <div className="bg-brand-bright/20 text-black dark:text-white/50 px-2 py-2">
                    <div className="text-left">
                      <p>
                        <strong>Domain:</strong> {entry.domain}
                      </p>
                      <p>
                        <strong>Pages Crawled:</strong> {entry.pages}
                      </p>
                      <p>
                        <strong>Total Links:</strong> {entry.total_links}
                      </p>
                      <p>
                        <strong>Total Internal Links:</strong>{" "}
                        {entry.total_internal_links}
                      </p>
                      <p>
                        <strong>Total External Links:</strong>{" "}
                        {entry.total_external_links}
                      </p>
                      <p>
                        <strong>Indexable Pages:</strong>{" "}
                        {entry.indexable_pages}
                      </p>
                      <p>
                        <strong>Not Indexable:</strong>{" "}
                        {entry.not_indexable_pages}
                      </p>
                      <p>
                        <strong>Issues:</strong> {entry.errors}
                      </p>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
        </div>
      </div>
    </div>
  );
};

export default HistoryDomainCrawls;
