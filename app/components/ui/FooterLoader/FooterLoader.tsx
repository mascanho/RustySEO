import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import useCrawlStore from "@/store/GlobalCrawlDataStore";

const FooterLoader = () => {
  const [progress, setProgress] = useState({
    crawledPages: 0,
    percentageCrawled: 0,
    crawledPagesCount: 0,
  });

  const { setTotalUrlsCrawled } = useCrawlStore();

  useEffect(() => {
    const handleProgressUpdate = (event: {
      payload: { crawled_urls: number; percentage: number; total_urls: number };
    }) => {
      const { crawled_urls, percentage, total_urls } = event.payload;

      // Update local state
      setProgress({
        crawledPages: crawled_urls,
        percentageCrawled: percentage,
        crawledPagesCount: total_urls,
      });

      // Update global state
      setTotalUrlsCrawled(total_urls);
    };

    // Set up the event listener
    const unlistenPromise = listen("progress_update", handleProgressUpdate);

    // Cleanup the event listener on unmount
    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [setTotalUrlsCrawled]);

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

export default FooterLoader;
