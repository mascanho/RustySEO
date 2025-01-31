import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React from "react";

const H1 = () => {
  const domainCrawlData = useGlobalCrawlStore();

  const h1Headings =
    domainCrawlData?.crawlData?.map((item) => item?.headings?.h1) || [];
  const uniqueH1Headings = [...new Set(h1Headings.flat())];

  const h1Exists = h1Headings
    .flat()
    .filter((heading) => heading && heading !== "");

  const counts = {
    exists: h1Exists.length,
    all: h1Headings.length,
    empty: h1Headings.flat().filter((heading) => !heading).length || 0,
    duplicate: h1Headings.flat().length - uniqueH1Headings.length,
    long:
      uniqueH1Headings.filter((heading) => heading?.length > 155).length || 0,
    short:
      uniqueH1Headings.filter((heading) => heading?.length < 70).length || 0,
    noH1Object:
      domainCrawlData?.crawlData?.filter(
        (item) => !item?.headings?.h1 || item?.headings?.h1.length === 0,
      ).length || 0,
  };

  const totalPages = domainCrawlData?.crawlData?.length;
  const missingH1Count = Math.abs(
    totalPages - (counts.noH1Object + counts.empty),
  );

  const sections = [
    { label: "Total", count: counts.exists },
    { label: "Missing", count: missingH1Count },
    { label: "Duplicate H1 Headings", count: counts.duplicate },
    { label: "Over 155 Characters", count: counts.long },
    { label: "Below 70 Characters", count: counts.short },
  ];

  return (
    <div className="text-sx w-full">
      <details className="w-full">
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 py-1 pb-1.5 cursor-pointer flex items-center">
          <span>H1</span>
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
                {totalPages
                  ? (
                      ((label === "Missing" ? missingH1Count : count) /
                        totalPages) *
                      100
                    ).toFixed(0) + "%"
                  : 0}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default H1;
