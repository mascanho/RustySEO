// @ts-nocheck
import { useEffect, useState, useCallback, memo } from "react";
import { listen } from "@tauri-apps/api/event";
import useCrawlStore from "@/store/GlobalCrawlDataStore";
import { Badge } from "@mantine/core";

const FooterLoader = () => {
  const [progress, setProgress] = useState({
    crawledPages: 0,
    percentageCrawled: 0,
    crawledPagesCount: 0,
  });
  const [crawlCompleted, setCrawlCompleted] = useState(false);

  const { setTotalUrlsCrawled, crawlData } = useCrawlStore();

  // Memoize the event handler to avoid recreating it on every render
  const handleProgressUpdate = useCallback(
    (event: {
      payload: {
        crawled_urls: number;
        percentage: number;
        total_urls: number;
      };
    }) => {
      const { crawled_urls, percentage, total_urls } = event.payload;

      // Validate and sanitize the received data to prevent NaN
      const safeCrawledUrls = Math.max(0, crawled_urls || 0);
      const safePercentage = Math.min(100, Math.max(0, percentage || 0));
      const safeTotalUrls = Math.max(1, total_urls || 1); // Always at least 1 to prevent division by zero

      // Only update state if the values have changed
      setProgress((prev) => {
        if (
          prev.crawledPages === safeCrawledUrls &&
          prev.percentageCrawled === safePercentage &&
          prev.crawledPagesCount === safeTotalUrls
        ) {
          return prev; // No change, return previous state
        }
        return {
          crawledPages: safeCrawledUrls,
          percentageCrawled: safePercentage,
          crawledPagesCount: safeTotalUrls,
        };
      });

      // Reset completion state if new crawl starts (only if significantly less than 100%)
      if (percentage < 95 && crawlCompleted) {
        setCrawlCompleted(false);
      }

      // Auto-complete when we reach 100% progress (fallback for JavaScript mode)
      if (percentage >= 100 && !crawlCompleted) {
        setCrawlCompleted(true);
      }

      // Update global state only if the total URLs have changed
      setTotalUrlsCrawled((prev) =>
        prev === safeTotalUrls ? prev : safeTotalUrls,
      );
    },
    [setTotalUrlsCrawled, crawlCompleted],
  );

  useEffect(() => {
    // Set up the event listener with the direct handler (no debounce)
    const progressUnlistenPromise = listen(
      "progress_update",
      handleProgressUpdate,
    );

    // Set up crawl completion listener
    const completeUnlistenPromise = listen("crawl_complete", () => {
      // Use current progress data instead of potentially empty crawlData
      setProgress((prev) => ({
        crawledPages: Math.max(prev.crawledPages, prev.crawledPagesCount),
        percentageCrawled: 100,
        crawledPagesCount: Math.max(prev.crawledPages, prev.crawledPagesCount),
      }));
      setCrawlCompleted(true);
    });

    // Also listen for any other completion-related events
    const crawlErrorUnlistenPromise = listen("crawl_error", (event) => {
      // Handle crawl errors
    });

    const crawlStoppedUnlistenPromise = listen("crawl_stopped", () => {
      // Handle crawl stops
    });

    // Cleanup the event listeners on unmount
    return () => {
      progressUnlistenPromise.then((unlisten) => unlisten());
      completeUnlistenPromise.then((unlisten) => unlisten());
      crawlErrorUnlistenPromise.then((unlisten) => unlisten());
      crawlStoppedUnlistenPromise.then((unlisten) => unlisten());
    };
  }, [handleProgressUpdate]); // Remove crawlData.length from dependencies

  return (
    <div className="flex items-center space-x-4 h-full ml-4">
      {/* Progress Section */}
      <div className="flex items-center space-x-3 bg-gray-200/50 dark:bg-black/20 px-3 py-1 rounded-full border border-gray-300/50 dark:border-white/10 backdrop-blur-sm">
        {/* Progress Bar Container */}
        <div className="relative w-36 h-2 bg-gray-300/50 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
          <div
            className={`absolute top-0 left-0 h-full bg-gradient-to-r from-brand-bright via-sky-400 to-brand-bright rounded-full transition-all duration-500 ease-out ${!crawlCompleted ? 'animate-pulse' : ''}`}
            style={{
              width: `${Math.min(Math.max(0, progress.percentageCrawled || 0), 100)}%`,
              boxShadow: '0 0 8px rgba(56, 189, 248, 0.4)'
            }}
          />
        </div>

        {/* Percentage */}
        <span className="text-[11px] font-bold text-brand-bright min-w-[32px] font-mono">
          {Math.min(progress.percentageCrawled || 0, 100).toFixed(0)}%
        </span>
      </div>

      <div className="h-4 w-[1px] bg-gray-400 dark:bg-white/10" />

      {/* Stats Section */}
      <div className="flex items-center space-x-4 text-[11px] tracking-tight">
        <div className="flex items-center space-x-1.5">
          <span className="text-gray-500 dark:text-white/40 uppercase font-bold text-[9px]">Crawled:</span>
          <span className="text-gray-700 dark:text-white font-mono font-medium">
            {crawlCompleted ? crawlData.length : progress.crawledPages || 0}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-gray-500 dark:text-white/40 uppercase font-bold text-[9px]">Queued:</span>
          <span className="text-gray-700 dark:text-white font-mono font-medium">
            {crawlCompleted
              ? 0
              : Math.max(0, (progress.crawledPagesCount || 0) - (progress.crawledPages || 0))}
          </span>
        </div>

        {crawlCompleted && (
          <Badge
            variant="filled"
            color="blue"
            size="xs"
            className="animate-in fade-in zoom-in duration-300 h-4.5 py-0 px-1.5 text-[9px]"
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
