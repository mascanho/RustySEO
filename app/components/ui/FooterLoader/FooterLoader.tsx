// @ts-nocheck
import { useEffect, useState, useCallback, memo } from "react";
import { listen } from "@tauri-apps/api/event";
import useCrawlStore from "@/store/GlobalCrawlDataStore";

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
    <div className="flex items-center justify-center w-full h-full">
      <div className="relative w-32 h-2 bg-gray-200 dark:bg-transparent rounded-full dark:divide-brand-dark dark:border-brand-dark dark:border">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(Math.max(0, progress.percentageCrawled || 0), 100)}%`,
          }}
        />
      </div>
      <span className="ml-2 flex items-center">
        {crawlCompleted ? crawlData.length : progress.crawledPages || 0} of{" "}
        {crawlCompleted
          ? crawlData.length
          : Math.max(
              progress.crawledPagesCount || 0,
              progress.crawledPages || 0,
            )}{" "}
        URLs crawled (
        {Math.min(progress.percentageCrawled || 0, 100).toFixed(0)}
        %){crawlCompleted ? "" : ""}
        <div className="h-5 mx-2  bg-black/50 w-[1px] dark:bg-white/20 " />
        <span className="text-white bg-brand-bright dark:bg-brand-bright px-2 text-[10px] rounded-sm">
          {crawlCompleted ? " Complete!" : ""}
        </span>
        {/* Debug info */}
        {/*<span className="ml-2 text-xs text-gray-500">
          [Debug: crawlCompleted={crawlCompleted.toString()}, progress=
          {progress.percentageCrawled}%]
        </span>*/}
      </span>
    </div>
  );
};

// Memoize the component to prevent re-renders if props/state haven't changed
export default memo(FooterLoader);
