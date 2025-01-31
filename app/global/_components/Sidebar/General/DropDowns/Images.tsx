// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useState } from "react";

const Images = () => {
  const domainCrawlData = useGlobalCrawlStore();
  const [isOpen, setIsOpen] = useState(false); // State to track if details are open

  const imageCounts =
    domainCrawlData?.crawlData?.reduce((acc, item) => {
      const imageCount = item?.images?.length || 0;
      return acc + imageCount;
    }, 0) || 0;

  const hasAltTags =
    domainCrawlData?.crawlData?.reduce((acc, item) => {
      const hasaltTags = item?.alt_tags?.with_alt_tags?.length || 0;
      return acc + hasaltTags;
    }, 0) || 0;

  const hasNoAltTags =
    domainCrawlData?.crawlData?.reduce((acc, item) => {
      const hasaltTags = item?.alt_tags?.without_alt_tags?.length || 0;
      return acc + hasaltTags;
    }, 0) || 0;

  const imageData = [
    { label: "Total Images", count: imageCounts },
    { label: "Images with Alt Tags", count: hasAltTags },
    { label: "Images without Alt Tags", count: hasNoAltTags },
  ];

  return (
    <div className="text-sx w-full">
      <details
        className="w-full"
        onToggle={(e) => setIsOpen(e.currentTarget.open)} // Update state when details are toggled
      >
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer flex items-center ">
          <span>Images</span>
        </summary>
        {/* Data Rows (inside details, only visible when open) */}
        <div className="w-full">
          {/* Data Rows */}
          {imageData.map((data, index) => (
            <div
              key={index}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className="w-2/3 pl-2.5 py-1 text-brand-bright">
                {data?.label}
              </div>
              <div className="w-1/6 text-right pr-2">{data?.count}</div>
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

export default Images;
