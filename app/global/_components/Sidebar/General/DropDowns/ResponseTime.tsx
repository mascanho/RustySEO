// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState, memo } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

const ResponseTime = () => {
    const { crawlData } = useGlobalCrawlStore((state) => ({
        crawlData: state.crawlData || [],
    }));

    const [isOpen, setIsOpen] = useState(false);

    const stats = useMemo(() => {
        let fast = 0; // < 200ms
        let average = 0; // 200ms - 1s
        let slow = 0; // > 1s
        let totalTime = 0;
        let count = 0;

        crawlData.forEach((item) => {
            if (item.response_time !== undefined && item.response_time !== null) {
                const time = item.response_time * 1000; // convert to ms
                totalTime += time;
                count++;

                if (time < 200) fast++;
                else if (time <= 1000) average++;
                else slow++;
            }
        });

        return {
            fast,
            average,
            slow,
            avg: count > 0 ? (totalTime / count).toFixed(0) : 0,
        };
    }, [crawlData]);

    const total = crawlData.length;

    const sections = [
        { label: "Average Response Time", value: `${stats.avg}ms`, percentage: "" },
        {
            label: "Fast (< 200ms)",
            value: stats.fast,
            percentage: total > 0 ? `${((stats.fast / total) * 100).toFixed(0)}%` : "0%",
            color: "text-green-500",
        },
        {
            label: "Average (200ms-1s)",
            value: stats.average,
            percentage: total > 0 ? `${((stats.average / total) * 100).toFixed(0)}%` : "0%",
            color: "text-yellow-500",
        },
        {
            label: "Slow (> 1s)",
            value: stats.slow,
            percentage: total > 0 ? `${((stats.slow / total) * 100).toFixed(0)}%` : "0%",
            color: "text-red-500",
        },
    ];

    return (
        <div className="text-xs w-full">
            <div className="w-full cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className="text-xs font-semibold border-b dark:border-b-brand-dark pl-1 p-1 flex items-center">
                    <span>
                        {isOpen ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                    </span>
                    <span className="ml-1">Response Time</span>
                </div>
            </div>

            {isOpen && (
                <div className="w-full">
                    {sections.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
                        >
                            <div className={`w-2/3 pl-2.5 py-1 ${item.color || "text-brand-bright"}`}>
                                {item.label}
                            </div>
                            <div className="w-1/6 text-right pr-2">{item.value}</div>
                            <div className="w-1/6 text-right pr-2">{item.percentage}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default memo(ResponseTime);
