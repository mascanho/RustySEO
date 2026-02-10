// @ts-nocheck
import { useEffect, useState, useCallback, memo, useMemo } from "react";
import { listen } from "@tauri-apps/api/event";
import useCrawlStore from "@/store/GlobalCrawlDataStore";
import { Badge } from "@mantine/core";
import { debounce } from "lodash";

const FooterLoader = () => {
  const {
    streamedCrawledPages,
    streamedTotalPages,
    setStreamedCrawledPages,
    setStreamedTotalPages,
    crawlData,
    setTotalUrlsCrawled,
    domainCrawlLoading,
    isFinishedDeepCrawl,
    setFinishedDeepCrawl,
  } = useCrawlStore();

  const [failedPages, setFailedPages] = useState(0);
  // Internal state to track if we've shown the "Complete" message for the current session
  const [showComplete, setShowComplete] = useState(false);

  // Debounced update function to ensure smooth UI and sync with store
  const debouncedUpdate = useCallback(
    debounce((crawled_urls, total_urls, failed_urls) => {
      setStreamedCrawledPages(crawled_urls);
      setStreamedTotalPages(total_urls);
      setTotalUrlsCrawled(total_urls);
      setFailedPages(failed_urls);
    }, 300),
    [setStreamedCrawledPages, setStreamedTotalPages, setTotalUrlsCrawled]
  );

  useEffect(() => {
    // Progress listener
    const progressUnlistenPromise = listen("progress_update", (event: any) => {
      const { crawled_urls, percentage, total_urls, failed_urls_count } = event.payload;

      const safeCrawledUrls = Math.max(0, crawled_urls || 0);
      const safeTotalUrls = Math.max(1, total_urls || 1);
      const safeFailedUrls = Math.max(0, failed_urls_count || 0);

      debouncedUpdate(safeCrawledUrls, safeTotalUrls, safeFailedUrls);

      // Reset internal completion state if a real progress update comes through with < 100%
      if (percentage < 100 && showComplete) {
        setShowComplete(false);
      }
    });

    // Completion listener
    const completeUnlistenPromise = listen("crawl_complete", (event: any) => {
      console.log("🏁 Crawl complete event received in FooterLoader", event.payload);

      // Ensure we show the final data from the event or fallback to crawlData
      const finalCount = event.payload?.crawled_urls || crawlData?.length || 0;
      setStreamedCrawledPages(finalCount);
      setStreamedTotalPages(event.payload?.total_urls || finalCount);
      setShowComplete(true);
      setFinishedDeepCrawl(true);
    });

    return () => {
      progressUnlistenPromise.then((unlisten) => unlisten());
      completeUnlistenPromise.then((unlisten) => unlisten());
    };
  }, [debouncedUpdate, crawlData, setStreamedCrawledPages, setStreamedTotalPages, setFinishedDeepCrawl, showComplete]);

  // Sync showComplete with store state
  useEffect(() => {
    if (domainCrawlLoading) {
      setShowComplete(false);
    } else if (isFinishedDeepCrawl && crawlData.length > 0) {
      setShowComplete(true);
    }
  }, [domainCrawlLoading, isFinishedDeepCrawl, crawlData.length]);

  // Derived state for rendering
  const displayCrawled = useMemo(() => {
    return showComplete ? (crawlData?.length || streamedCrawledPages || 0) : (streamedCrawledPages || 0);
  }, [showComplete, crawlData.length, streamedCrawledPages]);

  const displayTotal = useMemo(() => {
    return showComplete ? (crawlData?.length || streamedTotalPages || 0) : (streamedTotalPages || 0);
  }, [showComplete, crawlData.length, streamedTotalPages]);

  // Percentage calculation
  const percentage = useMemo(() => {
    if (displayTotal === 0) return 0;
    const pct = (displayCrawled / displayTotal) * 100;
    return Math.min(100, Math.max(0, pct));
  }, [displayCrawled, displayTotal]);

  return (
    <div className="flex items-center space-x-4 h-full ml-4">
      {/* Progress Section */}
      <div className="flex items-center space-x-3 bg-gray-200/50 dark:bg-black/20 px-3 py-1 rounded-full border border-gray-300/50 dark:border-white/10 backdrop-blur-sm">
        {/* Progress Bar Container */}
        <div className="relative w-36 h-2 bg-gray-300/50 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
          <div
            className={`absolute top-0 left-0 h-full bg-gradient-to-r from-brand-bright via-sky-400 to-brand-bright rounded-full transition-all duration-500 ease-out ${!showComplete ? "animate-pulse" : ""}`}
            style={{
              width: `${percentage}%`,
              boxShadow: "0 0 8px rgba(56, 189, 248, 0.4)",
            }}
          />
        </div>

        {/* Percentage */}
        <span className="text-[11px] font-bold text-brand-bright min-w-[32px] font-mono">
          {percentage.toFixed(0)}%
        </span>
      </div>

      <div className="h-4 w-[1px] bg-gray-400 dark:bg-white/10" />

      {/* Stats Section */}
      <div className="flex items-center space-x-4 text-[11px] tracking-tight">
        <div className="flex items-center space-x-1.5">
          <span className="text-gray-500 dark:text-white/40 uppercase font-bold text-[9px]">
            Crawled:
          </span>
          <span className="text-gray-700 dark:text-white font-mono font-medium">
            {displayCrawled}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-gray-500 dark:text-white/40 uppercase font-bold text-[9px]">
            Queued:
          </span>
          <span className="text-gray-700 dark:text-white font-mono font-medium">
            {showComplete
              ? 0
              : Math.max(0, displayTotal - displayCrawled)}
          </span>
        </div>

        {failedPages > 0 && (
          <div className="flex items-center space-x-1.5">
            <span className="text-red-500/60 dark:text-red-400/60 uppercase font-bold text-[9px]">
              Failed:
            </span>
            <span className="text-red-600 dark:text-red-400 font-mono font-medium">
              {failedPages}
            </span>
          </div>
        )}

        {(showComplete || (percentage >= 99.9 && !domainCrawlLoading && crawlData.length > 0)) && (
          <Badge
            variant="filled"
            size="xs"
            className="animate-in fade-in zoom-in duration-300 h-4.5 py-0 px-1.5 text-[9px] bg-brand-bright"
          >
            Crawl Complete
          </Badge>
        )}
      </div>
    </div>
  );
};

// Memoize the component to prevent re-renders if props/state haven't changed
export default memo(FooterLoader);
