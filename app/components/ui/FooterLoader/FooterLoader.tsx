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

      // Reset completion state if new crawl starts
      if (percentage < 100 && crawlCompleted) {
        setCrawlCompleted(false);
        console.log("New crawl started - resetting completion state");
      }

      // Update global state only if the total URLs have changed
      setTotalUrlsCrawled((prev) => (prev === total_urls ? prev : total_urls));
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
      // Ensure percentage shows 100% when crawl is complete and use actual crawlData length
      setProgress((prev) => ({
        crawledPages: crawlData.length,
        percentageCrawled: 100,
        crawledPagesCount: crawlData.length,
      }));
      setCrawlCompleted(true);
      console.log(
        "Crawl completed - final counts synchronized with actual data",
      );
    });

    // Cleanup the event listeners on unmount
    return () => {
      progressUnlistenPromise.then((unlisten) => unlisten());
      completeUnlistenPromise.then((unlisten) => unlisten());
    };
  }, [handleProgressUpdate, crawlData.length]);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="relative w-32 h-2 bg-gray-200 dark:bg-transparent rounded-full dark:divide-brand-dark dark:border-brand-dark dark:border">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress.percentageCrawled, 100)}%` }}
        />
      </div>
      <span className="ml-2 flex items-center">
        {crawlCompleted ? crawlData.length : progress.crawledPages} of{" "}
        {crawlCompleted
          ? crawlData.length
          : Math.max(progress.discoveredUrls, progress.crawledPages)}{" "}
        URLs crawled ({Math.min(progress.percentageCrawled, 100).toFixed(0)}
        %){crawlCompleted ? "" : ""}
        <div className="h-5 mx-2  bg-black w-[0.5px] dark:bg-white/50 " />
        <span className="text-green-500 bg-green-900 px-2 text-[10px] rounded-sm">
          {crawlCompleted ? " Complete!" : ""}
        </span>
      </span>
    </div>
  );
};

// Memoize the component to prevent re-renders if props/state haven't changed
export default memo(FooterLoader);
