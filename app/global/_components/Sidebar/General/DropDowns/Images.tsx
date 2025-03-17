// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState, useCallback, memo } from "react";

const Images = () => {
  const { crawlData } = useGlobalCrawlStore();
  const [isOpen, setIsOpen] = useState(false); // State to track if details are open

  // Memoize calculations to avoid recalculating on every render
  const imageCounts = useMemo(
    () =>
      crawlData?.reduce((acc, item) => {
        const imageCount = item?.images?.Ok?.length || 0;
        return acc + imageCount;
      }, 0) || 0,
    [crawlData],
  );

  const hasAltTags = useMemo(
    () =>
      crawlData?.reduce((acc, item) => {
        const imagesWithAltTags =
          item?.images?.Ok?.filter(
            (image) => image[1] && image[1].trim() !== "",
          ).length || 0;
        return acc + imagesWithAltTags;
      }, 0) || 0,
    [crawlData],
  );

  const hasNoAltTags = useMemo(
    () =>
      crawlData?.reduce((acc, item) => {
        const imagesWithoutAltTags =
          item?.images?.Ok?.filter(
            (image) => !image[1] || image[1].trim() === "",
          ).length || 0;
        return acc + imagesWithoutAltTags;
      }, 0) || 0,
    [crawlData],
  );

  // Memoize imageData to avoid recalculating on every render
  const imageData = useMemo(
    () => [
      { label: "Total Images", count: imageCounts },
      { label: "Images with Alt Tags", count: hasAltTags },
      { label: "Images without Alt Tags", count: hasNoAltTags },
    ],
    [imageCounts, hasAltTags, hasNoAltTags],
  );

  // Memoize the toggle handler to avoid recreating it on every render
  const handleToggle = useCallback(
    (e: React.SyntheticEvent<HTMLDetailsElement>) => {
      setIsOpen(e.currentTarget.open);
    },
    [],
  );

  return (
    <div className="text-sx w-full">
      <details className="w-full" onToggle={handleToggle}>
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer flex items-center">
          <span>Images</span>
        </summary>
        <div className="w-full">
          {imageData.map((data, index) => (
            <div
              key={index}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className="w-2/3 pl-2.5 py-1 text-brand-bright">
                {data.label}
              </div>
              <div className="w-1/6 text-right pr-2">{data.count}</div>
              <div className="w-1/6 text-right pr-2">
                {imageCounts > 0
                  ? `${((data.count / imageCounts) * 100).toFixed(0)}%`
                  : "0%"}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default memo(Images);
