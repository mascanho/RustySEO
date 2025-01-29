// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React from "react";

const Images = () => {
  const domainCrawlData = useGlobalCrawlStore();

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
      <details className="w-full">
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer">
          Images
        </summary>
        {imageData.map((data, index) => (
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

export default Images;
