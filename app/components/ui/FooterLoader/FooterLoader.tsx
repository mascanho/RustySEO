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
  } = useCrawlStore();

  const [failedPages, setFailedPages] = useState(0);
  const [crawlCompleted, setCrawlCompleted] = useState(false);

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

      // Reset completion state if new crawl starts (heuristic)
      if (percentage < 95 && crawlCompleted) {
        setCrawlCompleted(false);
      }

      // Auto-complete (fallback)
      if (percentage >= 100 && !crawlCompleted) {
        setCrawlCompleted(true);
      }
    });

    // Completion listener
    const completeUnlistenPromise = listen("crawl_complete", () => {
      // Upon completion, ensure we show the final data from crawlData
      // But we might want to keep the "streamed" values until they are reset?
      // OverviewChart sets streamed values to crawlData.length on complete.
      const finalCount = crawlData?.length || 0;
      setStreamedCrawledPages(finalCount);
      setStreamedTotalPages(finalCount);
      setCrawlCompleted(true);

      // We can also calculate failed pages here if needed, but the event doesn't pass them
      // We'll rely on the last progress update for failed count or existing logic
    });

    return () => {
      progressUnlistenPromise.then((unlisten) => unlisten());
      completeUnlistenPromise.then((unlisten) => unlisten());
    };
  }, [debouncedUpdate, crawlData, setStreamedCrawledPages, setStreamedTotalPages, crawlCompleted]);

  // Derived state for rendering
  const displayCrawled = useMemo(() => {
    return crawlCompleted ? (crawlData?.length || 0) : (streamedCrawledPages || 0);
  }, [crawlCompleted, crawlData, streamedCrawledPages]);

  const displayTotal = useMemo(() => {
    return crawlCompleted ? (crawlData?.length || 0) : (streamedTotalPages || 0);
  }, [crawlCompleted, crawlData, streamedTotalPages]);

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
            className={`absolute top-0 left-0 h-full bg-gradient-to-r from-brand-bright via-sky-400 to-brand-bright rounded-full transition-all duration-500 ease-out ${!crawlCompleted ? "animate-pulse" : ""}`}
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
            {crawlCompleted
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

        {crawlCompleted && (
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
