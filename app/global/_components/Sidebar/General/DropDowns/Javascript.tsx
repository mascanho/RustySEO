// @ts-nocheck
import React, { useEffect, useMemo, useCallback } from "react";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { debounce } from "lodash";

const Javascript: React.FC = React.memo(() => {
  const { crawlData, setJavascript } = useGlobalCrawlStore();
  const [isOpen, setIsOpen] = React.useState(false); // State to track if details are open

  // Calculate external and inline scripts using Sets to avoid duplicates
  const { externalScripts, inlineScripts, totalScripts } = useMemo(() => {
    const externalSet = new Set<string>();
    const inlineSet = new Set<string>();

    crawlData?.forEach((item) => {
      item?.javascript?.external?.forEach((script: string) =>
        externalSet.add(script),
      );
      item?.javascript?.inline?.forEach((script: string) =>
        inlineSet.add(script),
      );
    });

    const externalScripts = externalSet.size;
    const inlineScripts = inlineSet.size;
    const totalScripts = externalScripts + inlineScripts;

    return { externalScripts, inlineScripts, totalScripts };
  }, [crawlData]);

  // Debounced function to update `setJavascript`
  const debouncedSetJavascript = useCallback(
    debounce((external: number, inline: number) => {
      setJavascript({ external, inline });
    }, 300), // Adjust the debounce delay as needed
    [setJavascript],
  );

  // Update `setJavascript` only when `externalScripts` or `inlineScripts` change
  useEffect(() => {
    debouncedSetJavascript(externalScripts, inlineScripts);
  }, [externalScripts, inlineScripts, debouncedSetJavascript]);

  // Cleanup the debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSetJavascript.cancel();
    };
  }, [debouncedSetJavascript]);

  // Data to display
  const scriptData = useMemo(
    () => [
      { label: "External Scripts", count: externalScripts },
      { label: "Inline Scripts", count: inlineScripts },
    ],
    [externalScripts, inlineScripts],
  );

  return (
    <div className="text-sx w-full">
      <details
        className="w-full"
        onToggle={(e) => setIsOpen(e.currentTarget.open)} // Update state when details are toggled
      >
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer flex items-center">
          <span>Javascript</span>
        </summary>
        {/* Data Rows (inside details, only visible when open) */}
        {isOpen && (
          <div className="w-full">
            {/* Header Row */}
            <div className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark">
              <div className="w-2/3 pl-2.5 py-1 text-brand-bright">
                Total Javascript
              </div>
              <div className="w-1/6 text-right pr-2">{totalScripts}</div>
              <div className="w-1/6 text-right pr-2">100%</div>
            </div>
            {/* Data Rows */}
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
                  {totalScripts > 0
                    ? `${((data.count / totalScripts) * 100).toFixed(0)}%`
                    : "0%"}
                </div>
              </div>
            ))}
          </div>
        )}
      </details>
    </div>
  );
});

Javascript.displayName = "Javascript";

export default Javascript;
