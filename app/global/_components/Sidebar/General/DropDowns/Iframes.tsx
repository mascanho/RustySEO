// @ts-nocheck
import React, { useMemo } from "react";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";

interface CrawlDataItem {
  iframe?: Array<unknown>; // Replace `unknown` with the actual type of iframe data if known
}

interface IframeData {
  label: string;
  count: number;
}

const Iframes: React.FC = () => {
  const [debouncedCrawlData, setDebouncedCrawlData] = React.useState(() => useGlobalCrawlStore.getState().crawlData);

  React.useEffect(() => {
    const timer = setInterval(() => {
      const currentStored = useGlobalCrawlStore.getState().crawlData;
      setDebouncedCrawlData((prev) => {
        if (prev !== currentStored) return currentStored;
        return prev;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Memoize the calculation of total iframes
  const totalIframes = useMemo(() => {
    if (!Array.isArray(debouncedCrawlData)) {
      console.error("crawlData is not an array:", debouncedCrawlData);
      return 0;
    }

    return debouncedCrawlData.reduce((acc, item: CrawlDataItem) => {
      return acc + (item?.iframe?.length || 0);
    }, 0);
  }, [debouncedCrawlData]);

  // Memoize the data to display
  const iframeData = useMemo<IframeData[]>(
    () => [{ label: "Iframes Found", count: totalIframes }],
    [totalIframes],
  );

  return (
    <div className="text-sx w-full">
      <details className="w-full">
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer">
          Iframes
        </summary>
        {iframeData.map((data, index) => (
          <section
            key={index}
            className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
          >
            <span className="text-brand-bright w-full pl-2.5 py-1">
              {data.label}
            </span>
            <div>{data.count}</div>
          </section>
        ))}
      </details>
    </div>
  );
};

export default React.memo(Iframes);
