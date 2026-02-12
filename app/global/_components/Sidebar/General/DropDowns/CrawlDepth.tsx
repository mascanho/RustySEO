// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState, memo } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

const CrawlDepth = () => {
    const { crawlData } = useGlobalCrawlStore((state) => ({
        crawlData: state.crawlData || [],
    }));

    const [isOpen, setIsOpen] = useState(false);

    const depthStats = useMemo(() => {
        const depthMap = new Map();
        let maxDepth = 0;

        crawlData.forEach((item) => {
            const depth = item.url_depth || 0;
            depthMap.set(depth, (depthMap.get(depth) || 0) + 1);
            if (depth > maxDepth) maxDepth = depth;
        });

        const data = [];
        for (let i = 0; i <= maxDepth; i++) {
            if (depthMap.has(i)) {
                data.push({
                    depth: i,
                    count: depthMap.get(i),
                });
            }
        }
        return data;
    }, [crawlData]);

    const total = crawlData.length;

    return (
        <div className="text-xs w-full">
            <div className="w-full cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className="text-xs font-semibold border-b dark:border-b-brand-dark pl-1 p-1 flex items-center">
                    <span>
                        {isOpen ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                    </span>
                    <span className="ml-1">Crawl Depth</span>
                </div>
            </div>

            {isOpen && (
                <div className="w-full">
                    {depthStats.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
                        >
                            <div className="w-2/3 pl-2.5 py-1 text-brand-bright">
                                {item.depth === 0 ? "Homepage (Level 0)" : `Level ${item.depth}`}
                            </div>
                            <div className="w-1/6 text-right pr-2">{item.count}</div>
                            <div className="w-1/6 text-right pr-2">
                                {total > 0 ? `${((item.count / total) * 100).toFixed(0)}%` : "0%"}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default memo(CrawlDepth);
