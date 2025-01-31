import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React from "react";

const H2 = () => {
  const domainCrawlData = useGlobalCrawlStore();

  const h2Headings =
    domainCrawlData?.crawlData?.map((item) => item?.headings?.h2) || [];
  const uniqueH2Headings = [...new Set(h2Headings.flat())];
  const counts = {
    all: uniqueH2Headings.length,
    empty: uniqueH2Headings.filter((heading) => !heading).length || 0,
    duplicate: h2Headings.flat().length - uniqueH2Headings.length,
    long:
      uniqueH2Headings.filter((heading) => heading?.length > 155).length || 0,
    short:
      uniqueH2Headings.filter((heading) => heading?.length < 70).length || 0,
  };

  const sections = [
    { label: "Total H2 Headings", count: counts.all },
    { label: "Empty H2 Headings", count: counts.empty },
    { label: "Duplicate H2 Headings", count: counts.duplicate },
    { label: "Over 155 Characters", count: counts.long },
    { label: "Below 70 Characters", count: counts.short },
  ];

  const totalPages = domainCrawlData?.crawlData?.length;

  return (
    <div className="text-sx w-full">
      <details className="w-full">
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer flex items-center">
          <span>H2</span>
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

export default H2;
