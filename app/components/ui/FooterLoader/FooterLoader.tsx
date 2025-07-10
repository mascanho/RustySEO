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

  const { setTotalUrlsCrawled } = useCrawlStore();

  // Memoize the event handler to avoid recreating it on every render
  const handleProgressUpdate = useCallback(
    (event: {
      payload: { crawled_urls: number; percentage: number; total_urls: number };
    }) => {
      const { crawled_urls, percentage, total_urls } = event.payload;

      // Only update state if the values have changed
      setProgress((prev) => {
        if (
          prev.crawledPages === crawled_urls &&
          prev.percentageCrawled === percentage &&
          prev.crawledPagesCount === total_urls
        ) {
          return prev; // No change, return previous state
        }
        return {
          crawledPages: crawled_urls,
          percentageCrawled: percentage,
          crawledPagesCount: total_urls,
        };
      });

      // Update global state only if the total URLs have changed
      setTotalUrlsCrawled((prev) => (prev === total_urls ? prev : total_urls));
    },
    [setTotalUrlsCrawled],
  );

  useEffect(() => {
    // Set up the event listener with the direct handler (no debounce)
    const unlistenPromise = listen("progress_update", handleProgressUpdate);

    // Cleanup the event listener on unmount
    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [handleProgressUpdate]);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="relative w-32 h-2 bg-gray-200 dark:bg-transparent rounded-full dark:divide-brand-dark dark:border-brand-dark dark:border">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
          style={{ width: `${progress.percentageCrawled}%` }}
        />
      </div>
      <span className="ml-2">
        {progress.crawledPages} of {progress.crawledPagesCount} pages crawled (
        {progress.percentageCrawled.toFixed(0)}
        %)
      </span>
    </div>
  );
};

// Memoize the component to prevent re-renders if props/state haven't changed
export default memo(FooterLoader);
