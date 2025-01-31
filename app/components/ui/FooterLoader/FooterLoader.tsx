import { listen } from "@tauri-apps/api/event";
import { useState, useEffect } from "react";
const FooterLoader = () => {
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
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="relative w-32 h-2 bg-gray-200 dark:bg-transparent rounded-full dark:divide-brand-dark">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
          style={{ width: `${percentageCrawled}%` }}
        />
      </div>
      <span className="ml-2 ">
        {crawledPages} of {crawledPagesCount} pages crawled (
        {percentageCrawled.toFixed(0)}
        %)
      </span>
    </div>
  );
};
export default FooterLoader;
