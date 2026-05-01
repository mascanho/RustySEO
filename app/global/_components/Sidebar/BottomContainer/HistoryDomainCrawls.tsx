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
  const [error, setError] = useState<string | null>(null);
  const crawlSessionTotalArray = useGlobalCrawlStore((state) => state.crawlSessionTotalArray);
  const [crawlCompleted, setCrawlCompleted] = useState<boolean>(false);

  // Read streamed progress from the Zustand store (updated centrally by FooterLoader)
    const streamedCrawledPages = useGlobalCrawlStore((state) => state.streamedCrawledPages);
  const streamedTotalPages = useGlobalCrawlStore((state) => state.streamedTotalPages);

  // Derived values from the store — no duplicate listener needed
  const crawledPages = streamedCrawledPages || 0;
  const crawledPagesCount = streamedTotalPages || 1;
  const percentageCrawled = crawledPagesCount > 0
    ? Math.min(100, Math.max(0, (crawledPages / crawledPagesCount) * 100))
    : 0;

  useEffect(() => {
    const completeUnlisten = listen("crawl_complete", () => {
      setCrawlCompleted(true);
      // Small delay to ensure the backend has finished writing the history record
      setTimeout(fetchData, 1000);
    });

    return () => {
      completeUnlisten.then((f) => f());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sessionArr = crawlSessionTotalArray;

  // Fetch data from the database
  const fetchData = async () => {
    try {
      const result = await invoke("read_domain_results_history_table");
      setCrawlHistory(Array.isArray(result) ? result : []);
      setError(null);
    } catch (error) {
      setError("Failed to fetch crawl history. Check the console for details.");
    }
  };

  // Fetch initial data and create table when the component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        await invoke("create_domain_results_table");
        await fetchData();
      } catch (error) {
        setError(
          "Failed to initialize crawl history. Check the console for details.",
        );
      }
    };

    initialize();
  }, []);

  const handleRowClick = (index: number) => {
    setExpandedRows((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index],
    );
  };

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
                  className={`cursor-pointer px-2 flex pr-2 py-1 justify-between border-b dark:border-brand-dark/50 ${index % 2 === 0
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
