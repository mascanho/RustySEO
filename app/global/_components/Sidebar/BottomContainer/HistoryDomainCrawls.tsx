// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useState } from "react";
import { MdOutlineErrorOutline } from "react-icons/md";
import { RiPagesLine, RiCalendarLine } from "react-icons/ri";

const HistoryDomainCrawls = () => {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [crawlHistory, setCrawlHistory] = useState([]);
  const { crawlData, domainCrawlLoading, issues, summary } =
    useGlobalCrawlStore();

  // Fetch data from the database
  const fetchData = async () => {
    try {
      const result = await invoke("read_domain_results_history_table");
      console.log("Data fetched successfully:", result);
      setCrawlHistory(result); // Update the crawlHistory state with the fetched data
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Add new crawl data to the database
  const addDataToDatabase = async () => {
    if (crawlData.length === 0) return; // Don't add empty data

    // Calculate total issues
    const totalIssueCount = issues.reduce(
      (sum, item) => sum + item.issueCount,
      0,
    );

    // Create a new entry without specifying `id` (let the database handle it)
    const newEntry = {
      domain: crawlData?.[0]?.url || "",
      date: new Date().toISOString(),
      pages: crawlData?.length || 0,
      errors: totalIssueCount || 0,
      status: "completed",
      total_links: summary?.totalLinksFound || 0,
      total_internal_links: summary?.totalInternalLinks || 0,
      total_external_links: summary?.totalExternalLinks || 0,
      total_javascript: summary?.totalJavascript || 0,
      indexable_pages: Math.max(
        0,
        (crawlData?.length || 0) - (summary?.totalNotIndexablePages || 0),
      ),
      not_indexable_pages: summary?.totalNotIndexablePages || 0,
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

  // Set up the event listener for `crawl_complete` only once
  useEffect(() => {
    const unlisten = listen("crawl_complete", async () => {
      console.log("Crawl complete event received");
      await addDataToDatabase();
      await fetchData();
    });

    // Cleanup the event listener when the component unmounts
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []); // Empty dependency array to run only once

  // Fetch initial data when the component mounts
  useEffect(() => {
    try {
      invoke("create_domain_results_table");
      console.log("Table created or already exists");
      fetchData(); // Fetch initial data
    } catch (error) {
      console.error("Error creating table:", error);
    }
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

  return (
    <div className="text-xs h-[calc(28rem-2rem)] overflow-auto">
      <div className="text-center">
        <div>
          {crawlHistory
            ?.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            ) // Sort by date descending (latest first)
            .map((entry, index) => (
              <React.Fragment key={entry.id || index}>
                {" "}
                {/* Use unique id if available */}
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
