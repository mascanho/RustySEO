import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React from "react";

const MetaDescription = () => {
  const domainCrawlData = useGlobalCrawlStore();

  const descriptions =
    domainCrawlData?.crawlData?.map((item) => item?.description) || [];
  const uniqueDescriptions = [...new Set(descriptions)];
  const counts = {
    all: uniqueDescriptions.length,
    empty: uniqueDescriptions.filter((desc) => !desc).length || 0,
    duplicate: descriptions.length - uniqueDescriptions.length,
    long: uniqueDescriptions.filter((desc) => desc?.length > 155).length || 0,
    short: uniqueDescriptions.filter((desc) => desc?.length < 70).length || 0,
  };

  const sections = [
    { label: "Total Description", count: counts.all },
    { label: "Empty Description", count: counts.empty },
    { label: "Duplicate Description", count: counts.duplicate },
    { label: "Over 155 Characters", count: counts.long },
    { label: "Below 70 Characters", count: counts.short },
  ];

  const totalPages = domainCrawlData?.crawlData?.length;

  return (
    <div className="text-sx w-full">
      <details className="w-full">
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer flex items-center">
          <span>Meta Description</span>
        </summary>
        <div className="w-full">
          {sections.map(({ label, count }) => (
            <div
              key={label}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className="w-2/3 pl-2.5 py-1 text-brand-bright">{label}</div>
              <div className="w-1/6 text-right pr-2">{count}</div>
              <div className="w-1/6 text-center pl-2">
                {totalPages ? ((count / totalPages) * 100).toFixed(0) + "%" : 0}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default MetaDescription;
