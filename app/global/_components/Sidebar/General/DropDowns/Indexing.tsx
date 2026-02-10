// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState, memo } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

const Indexing = () => {
    const { crawlData } = useGlobalCrawlStore((state) => ({
        crawlData: state.crawlData || [],
    }));

    const [isOpen, setIsOpen] = useState(false);

    const indexingStats = useMemo(() => {
        let indexable = 0;
        let nonIndexable = 0;
        let partial = 0;
        const reasons = new Map();

        crawlData.forEach((item) => {
            const ind = item.indexability?.indexability || 0;
            const reason = item.indexability?.indexability_reason || "Unknown";

            if (ind >= 0.9) indexable++;
            else if (ind <= 0.1) nonIndexable++;
            else partial++;

            const count = reasons.get(reason) || 0;
            reasons.set(reason, count + 1);
        });

        // Top 8 reasons for non-indexability or general status
        const topReasons = Array.from(reasons.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);

        return {
            indexable,
            nonIndexable,
            partial,
            reasons: topReasons
        };
    }, [crawlData]);

    const total = crawlData.length;

    return (
        <div className="text-xs w-full">
            <div className="w-full cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className="text-xs font-semibold border-b dark:border-b-brand-dark pl-1 p-1 flex items-center">
                    <span>
                        {isOpen ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                    </span>
                    <span className="ml-1">Indexing Status</span>
                </div>
            </div>

            {isOpen && (
                <div className="w-full">
                    <div className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark">
                        <div className="w-2/3 pl-2.5 py-1 text-green-500">Indexable</div>
                        <div className="w-1/6 text-right pr-2">{indexingStats.indexable}</div>
                        <div className="w-1/6 text-right pr-2">
                            {total > 0 ? `${((indexingStats.indexable / total) * 100).toFixed(0)}%` : "0%"}
                        </div>
                    </div>
                    <div className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark">
                        <div className="w-2/3 pl-2.5 py-1 text-red-500">Non-Indexable</div>
                        <div className="w-1/6 text-right pr-2">{indexingStats.nonIndexable}</div>
                        <div className="w-1/6 text-right pr-2">
                            {total > 0 ? `${((indexingStats.nonIndexable / total) * 100).toFixed(0)}%` : "0%"}
                        </div>
                    </div>
                    {indexingStats.reasons.map(([reason, count], index) => (
                        <div
                            key={index}
                            className="flex items-center text-[10px] w-full px-2 justify-between border-b dark:border-b-brand-dark opacity-80"
                        >
                            <div className="w-2/3 pl-4 py-1 text-brand-bright truncate italic" title={reason}>
                                {reason}
                            </div>
                            <div className="w-1/6 text-right pr-2">{count}</div>
                            <div className="w-1/6 text-right pr-2">
                                {total > 0 ? `${((count / total) * 100).toFixed(0)}%` : "0%"}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default memo(Indexing);
