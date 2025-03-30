// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState, useCallback, useEffect, memo } from "react";

const Css = () => {
  const { crawlData, setCss } = useGlobalCrawlStore();
  const [isOpen, setIsOpen] = useState(false); // State to track if details are open

  // Memoize calculations to avoid recalculating on every render
  const externalCss = useMemo(
    () =>
      crawlData?.reduce((acc, item) => {
        const externalCount = item?.css?.external?.length || 0;
        return acc + externalCount;
      }, 0) || 0,
    [crawlData],
  );

  const inlineCss = useMemo(
    () =>
      crawlData?.reduce((acc, item) => {
        const inlineCount = item?.css?.inline?.length || 0;
        return acc + inlineCount;
      }, 0) || 0,
    [crawlData],
  );

  const totalCss = useMemo(
    () => externalCss + inlineCss,
    [externalCss, inlineCss],
  );

  // Memoize scriptData to avoid recalculating on every render
  const scriptData = useMemo(
    () => [
      { label: "External CSS", count: externalCss },
      { label: "Internal CSS", count: inlineCss },
    ],
    [externalCss, inlineCss],
  );

  // Memoize the toggle handler to avoid recreating it on every render
  const handleToggle = useCallback(
    (e: React.SyntheticEvent<HTMLDetailsElement>) => {
      setIsOpen(e.currentTarget.open);
    },
    [],
  );

  // Update CSS data only when relevant values change
  useEffect(() => {
    if (typeof setCss === "function") {
      setCss({
        inline: inlineCss,
        external: externalCss,
        total: totalCss,
      });
    }
  }, [inlineCss, externalCss, totalCss, setCss]);

  return (
    <div className="text-sx w-full">
      <details className="w-full" onToggle={handleToggle}>
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer flex items-center">
          <span>CSS</span>
        </summary>
        <div className="w-full">
          {scriptData.map((data, index) => (
            <div
              key={index}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className="w-2/3 pl-2.5 py-1 text-brand-bright">
                {data.label}
              </div>
              <div className="w-1/6 text-right pr-2">{data.count}</div>
              <div className="w-1/6 text-right pr-2">
                {totalCss > 0
                  ? `${((data.count / totalCss) * 100).toFixed(0)}%`
                  : "0%"}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default memo(Css);
