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
  total_css?: number;
  total_javascript?: number;
  total_images?: number;
  total_redirects?: number;
  missing_title?: number;
  missing_description?: number;
  avg_response_time?: number;
  max_crawl_depth?: number;
  total_secure_pages?: number;
  total_schema_pages?: number;
  total_mobile_pages?: number;
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
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-left bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded border dark:border-gray-800">
                        <div className="space-y-0.5">
                          <h4 className="font-semibold text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-800 pb-0.5 mb-1 text-[11px] uppercase tracking-wider">Crawl Summary</h4>
                          <p><strong>Domain:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.domain}</span></p>
                          <p><strong>Pages Crawled:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.pages}</span></p>
                          <p><strong>Max Crawl Depth:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.max_crawl_depth ?? 0}</span></p>
                          <p><strong>Avg Response Time:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.avg_response_time ?? 0} ms</span></p>
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-semibold text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-800 pb-0.5 mb-1 text-[11px] uppercase tracking-wider">Links & Indexability</h4>
                          <p><strong>Total Links:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.total_links}</span></p>
                          <p><strong>Internal / External:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.total_internal_links} / {entry.total_external_links}</span></p>
                          <p><strong>Indexable Pages:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.indexable_pages}</span></p>
                          <p><strong>Not Indexable:</strong> <span className="text-gray-800 dark:text-gray-200 text-red-500 font-medium">{entry.not_indexable_pages}</span></p>
                        </div>
                        <div className="space-y-0.5 mt-1">
                          <h4 className="font-semibold text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-800 pb-0.5 mb-1 text-[11px] uppercase tracking-wider">Technical Assets</h4>
                          <p><strong>CSS Files:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.total_css ?? 0}</span></p>
                          <p><strong>JavaScript Files:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.total_javascript ?? 0}</span></p>
                          <p><strong>Images:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.total_images ?? 0}</span></p>
                          <p><strong>Redirects:</strong> <span className="text-gray-800 dark:text-gray-200 font-medium text-orange-500">{entry.total_redirects ?? 0}</span></p>
                        </div>
                        <div className="space-y-0.5 mt-1">
                          <h4 className="font-semibold text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-800 pb-0.5 mb-1 text-[11px] uppercase tracking-wider">SEO & Quality</h4>
                          <p><strong>Missing Titles:</strong> <span className={entry.missing_title ? "text-red-500 font-medium" : "text-gray-800 dark:text-gray-200"}>{entry.missing_title ?? 0}</span></p>
                          <p><strong>Missing Descriptions:</strong> <span className={entry.missing_description ? "text-red-500 font-medium" : "text-gray-800 dark:text-gray-200"}>{entry.missing_description ?? 0}</span></p>
                          <p><strong>Schema / Structured Data:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.total_schema_pages ?? 0}</span></p>
                          <p><strong>HTTPS (Secure):</strong> <span className="text-gray-800 dark:text-gray-200">{entry.total_secure_pages ?? 0} / {entry.pages}</span></p>
                          <p><strong>Mobile Friendly:</strong> <span className="text-gray-800 dark:text-gray-200">{entry.total_mobile_pages ?? 0} / {entry.pages}</span></p>
                        </div>
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
