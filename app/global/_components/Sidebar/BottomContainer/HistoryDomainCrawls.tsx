// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useState } from "react";
import { MdOutlineErrorOutline } from "react-icons/md";
import { RiPagesLine, RiCalendarLine } from "react-icons/ri"; // Import icons

const HistoryDomainCrawls = () => {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [crawlHistory, setCrawlHistory] = useState([]);
  const { crawlData, domainCrawlLoading, issues, summary } =
    useGlobalCrawlStore();

  useEffect(() => {
    try {
      // Ensure the table exists (idempotent operation)
      invoke("create_domain_results_table");
      console.log("Table created or already exists");
      await fetchData();
    } catch (error) {
      console.error("Error creating table:", error);
    }
  }, []); // runs once when the component mounts

  useEffect(() => {
    // Listen for the `crawl_complete` event from the backend
    const unlisten = listen("crawl_complete", async () => {
      console.log("Crawl complete event received");

      // Step 1: Add the new crawl data to the database
      await addDataToDatabase();

      // Step 2: Fetch the updated data from the database
      await fetchData();
    });

    // Cleanup the event listener when the component unmounts
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [crawlData]); // Re-run if `crawlData` changes

  // Fetch data from the database
  const fetchData = async () => {
    try {
      // Read data from the table
      const result = await invoke("read_domain_results_history_table");
      console.log("Data fetched successfully:", result);
      setCrawlHistory(result); // Update the crawlHistory state with the fetched data
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // SUM the issues
  const totalIssueCount = issues.reduce((sum, item) => {
    return sum + item.issueCount;
  }, 0); // Add new crawl data to the database

  const addDataToDatabase = async () => {
    if (crawlData.length === 0) return; // Don't add empty data

    const newEntry = {
      id: 1,
      domain: crawlData?.[0]?.url || "", // Use the first URL in crawlData or fallback to an empty string
      date: new Date().toISOString(), // Get the current date in YYYY-MM-DD format
      pages: crawlData?.length || 0, // Total pages, default to 0 if crawlData is empty
      errors: crawlData?.length > 0 ? totalIssueCount || 0 : 0, // Total errors, default to 0 if crawlData is empty or totalIssueCount is null/undefined
      status: "completed", // Required field
      total_links: crawlData?.length > 0 ? summary?.totalLinksFound || 0 : 0, // Total links, default to 0 if crawlData is empty or summary is null/undefined
      total_internal_links:
        crawlData?.length > 0 ? summary?.totalInternalLinks || 0 : 0, // Total internal links, default to 0 if crawlData is empty or summary is null/undefined
      total_external_links:
        crawlData?.length > 0 ? summary?.totalExternalLinks || 0 : 0, // Total external links, default to 0 if crawlData is empty or summary is null/undefined
      total_javascript:
        crawlData?.length > 0 ? summary?.totalJavascript || 0 : 0, // Total JavaScript files, default to 0 if crawlData is empty or summary is null/undefined
      indexable_pages:
        crawlData?.length > 0
          ? crawlData?.length - summary?.totalNotIndexablePages
          : 0 || 0, // Indexable pages, default to 0 if crawlData is empty or summary is null/undefined
      not_indexable_pages:
        crawlData?.length > 0 ? summary?.totalNotIndexablePages || 0 : 0, // Non-indexable pages, default to 0 if crawlData is empty or summary is null/undefined
    };

    try {
      const result = await invoke("create_domain_results_history", {
        data: [newEntry],
      });
      console.log("Data added to database:", result);
    } catch (error) {
      console.error("Error adding data to database:", error);
    }
  };

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

  return (
    <div className="text-xs h-[calc(28rem-2rem)] overflow-auto">
      <div className="text-center">
        <div>
          {crawlHistory
            ?.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            ) // Sort by date descending (latest first)
            .map((entry, index) => (
              <React.Fragment key={index}>
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
                        {Math.abs(entry.indexable_pages)}
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
