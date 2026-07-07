// @ts-nocheck
import useGlobalCrawlStore, { useCrawlDataVersion } from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState, memo } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

const EMPTY_ARRAY: any[] = [];

const MetaRobots = () => {
  const [isOpen, setIsOpen] = useState(false);
  const crawlDataVersion = useCrawlDataVersion();
  const crawlData = useMemo(() => {
    if (!isOpen) return EMPTY_ARRAY;
    return useGlobalCrawlStore.getState().crawlData || [];
  }, [isOpen, crawlDataVersion]);

  const stats = useMemo(() => {
    let notSet = 0;
    let indexFollow = 0;
    let noindex = 0;
    let nofollow = 0;
    let noindexNofollow = 0;

    crawlData.forEach((item) => {
      const directives = (item?.meta_robots?.meta_robots || [])
        .join(", ")
        .toLowerCase();

      if (!directives) {
        notSet++;
        return;
      }

      const hasNoindex = directives.includes("noindex");
      const hasNofollow = directives.includes("nofollow");

      if (hasNoindex && hasNofollow) noindexNofollow++;
      else if (hasNoindex) noindex++;
      else if (hasNofollow) nofollow++;
      else indexFollow++;
    });

    return { notSet, indexFollow, noindex, nofollow, noindexNofollow };
  }, [crawlData]);

  const total = crawlData.length;

  const sections = useMemo(() => {
    const pct = (count: number) =>
      total > 0 ? `${((count / total) * 100).toFixed(0)}%` : "0%";

    return [
      {
        label: "No Meta Robots Tag",
        count: stats.notSet,
        percentage: pct(stats.notSet),
      },
      {
        label: "Index, Follow",
        count: stats.indexFollow,
        percentage: pct(stats.indexFollow),
        color: "text-green-500",
      },
      {
        label: "Noindex",
        count: stats.noindex,
        percentage: pct(stats.noindex),
        color: "text-red-500",
      },
      {
        label: "Nofollow",
        count: stats.nofollow,
        percentage: pct(stats.nofollow),
        color: "text-yellow-500",
      },
      {
        label: "Noindex, Nofollow",
        count: stats.noindexNofollow,
        percentage: pct(stats.noindexNofollow),
        color: "text-red-500",
      },
    ];
  }, [stats, total]);

  return (
    <div className="text-xs w-full">
      <div className="w-full cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="text-xs font-semibold border-b dark:border-b-brand-dark pl-1 p-1 flex items-center">
          <span>
            {isOpen ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
          </span>
          <span className="ml-1">Meta Robots</span>
        </div>
      </div>

      {isOpen && (
        <div className="w-full">
          {sections.map(({ label, count, percentage, color }) => (
            <div
              key={label}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className={`w-2/3 pl-2.5 py-1 ${color || "text-brand-bright"}`}>
                {label}
              </div>
              <div className="w-1/6 text-right pr-2">{count}</div>
              <div className="w-1/6 text-right pr-2">{percentage}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(MetaRobots);
