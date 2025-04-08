// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useState } from "react";
import { MdOutlineErrorOutline } from "react-icons/md";
import { RiPagesLine, RiCalendarLine } from "react-icons/ri";

// Define the DeepCrawlHistory type outside the component
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

const HistoryDomainCrawls = () => {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [crawlHistory, setCrawlHistory] = useState<DeepCrawlHistory[]>([]);
  const [error, setError] = useState<string | null>(null); // Add error state for UI feedback
  const {
    crawlData,
    domainCrawlLoading,
    issues,
    summary,
    crawlSessionTotalArray,
  } = useGlobalCrawlStore();
  const [crawledPages, setCrawledPages] = useState<number>(0);
  const [percentageCrawled, setPercentageCrawled] = useState<number>(0);
  const [crawledPagesCount, setCrawledPagesCount] = useState<number>(0);

  useEffect(() => {
    const unlisten = listen("progress_update", (event) => {
      const progressData = event.payload as {
        crawled_urls: number;
        percentage: number;
        total_urls: number;
      };
      setCrawledPages(progressData.crawled_urls);
      setPercentageCrawled(progressData.percentage);
      setCrawledPagesCount(progressData.total_urls);
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const sessionArr = crawlSessionTotalArray;

  // Fetch data from the database
  const fetchData = async () => {
    try {
      const result = await invoke("read_domain_results_history_table");
      // console.log("Data fetched successfully:", result);
      setCrawlHistory(Array.isArray(result) ? result : []); // Ensure result is an array
      setError(null); // Clear any previous error
    } catch (error) {
      // console.error("Error fetching data:", error);
      setError("Failed to fetch crawl history. Check the console for details.");
    }
  };

  // Add new crawl data to the database
  const addDataToDatabase = async () => {
    if (crawlData.length === 0) {
      // console.warn("No crawl data available to add to database");
      return;
    }

    const totalIssueCount = Array.isArray(issues)
      ? issues.reduce((sum, item) => {
          if (item && typeof item.issueCount === "number") {
            return sum + item.issueCount;
          } else {
            console.warn("Invalid issue item:", item);
            return sum;
          }
        }, 0)
      : 0;

    const newEntry: DeepCrawlHistory = {
      // Omit `id` since it's auto-generated by the database
      id: Math.floor(Math.random() * 1000),
      domain: crawlData[0]?.url || "",
      date: new Date().toISOString(),
      pages: crawledPagesCount || 0,
      errors: issues || 0,
      status: "completed",
      total_links: summary?.totalLinksFound || 0,
      total_internal_links: summary?.totalInternalLinks || 0,
      total_external_links: summary?.totalExternalLinks || 0,
      indexable_pages: Math.max(
        0,
        (crawlData.length || 0) - (summary?.notIndexablePages || 0),
      ),
      not_indexable_pages: summary?.notIndexablePages || 0,
      issues: issues,
    };

    try {
      const result = await invoke("create_domain_results_history", {
        data: [newEntry],
      });
      // console.log("Data added to database:", result);
      setError(null);
      await fetchData(); // Refresh the data after adding a new entry
    } catch (error) {
      // console.error("Error adding data to database:", error);
      setError(
        "Failed to add crawl data to database. Check the console for details.",
      );
    }
  };

  // Fetch initial data and create table when the component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        await invoke("create_domain_results_table");
        // console.log("Table created or already exists");
        await fetchData(); // Fetch initial data
      } catch (error) {
        // console.error("Error initializing:", error);
        setError(
          "Failed to initialize crawl history. Check the console for details.",
        );
      }
    };

    initialize();
  }, []);

  const handleRowClick = (index: number) => {
    console.log(issues);
    setExpandedRows(
      (prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index) // Collapse the row if already expanded
          : [...prev, index], // Expand the row if not already expanded
    );
  };

  useEffect(() => {
    // console.log(crawlSessionTotalArray, "This is the arr from useEffect");
    addDataToDatabase();
  }, [crawlSessionTotalArray?.length]);

  return (
    <div className="text-xs h-[calc(28rem-0.4rem)] overflow-auto">
      {error && (
        <div className="text-red-500 p-2 bg-red-100 dark:bg-red-900 mb-2">
          {error}
        </div>
      )}
      <div className="text-center dark:bg-gray-900">
        <div>
          {crawlHistory.length === 0 && !error && (
            <div className="h-[calc(28rem-1.2rem)] flex items-center">
              <p className="text-gray-500 m-auto">
                No crawl history available. <br />
                Crawl some websites to see your crawl history here.
              </p>
            </div>
          )}
          {crawlHistory
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            )
            .map((entry, index) => (
              <React.Fragment key={entry.id || index}>
                <div
                  onClick={() => handleRowClick(index)}
                  className={`cursor-pointer px-2 flex pr-2 py-1 justify-between border-b dark:border-brand-dark/50 ${
                    index % 2 === 0
                      ? "bg-gray-100 dark:bg-gray-800"
                      : "bg-gray-200 dark:bg-gray-900"
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
                  <div className="flex items-center  flex-1 justify-end divide-y-2">
                    {entry.not_indexable_pages}
                    <span>
                      <MdOutlineErrorOutline className="ml-1 text-red-500" />
                    </span>
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
                      <p>{/* <strong>Issues:</strong> {entry.errors} */}</p>
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
