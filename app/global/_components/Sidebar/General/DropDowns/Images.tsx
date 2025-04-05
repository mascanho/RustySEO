// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState, useCallback, memo } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

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

  return (
    <div className="text-xs w-full">
      <div className="w-full cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="text-xs font-semibold border-b dark:border-b-brand-dark pl-1 p-1 flex items-center">
          <span className="">
            {isOpen ? (
              <FiChevronDown size={14} />
            ) : (
              <FiChevronRight size={14} />
            )}
          </span>
          <span className="ml-1">Images</span>
        </div>
      </div>

      {isOpen && (
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
      )}
    </div>
  );
};

export default memo(Images);
