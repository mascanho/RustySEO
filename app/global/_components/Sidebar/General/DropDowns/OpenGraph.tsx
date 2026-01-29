// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

interface OpenGraphDataItem {
    label: string;
    count: number;
    percentage: string;
}

const OpenGraph: React.FC = () => {
    const { crawlData } = useGlobalCrawlStore((state) => ({
        crawlData: state.crawlData || [],
    }));

    const [isOpen, setIsOpen] = useState(false);

    // Memoize OpenGraph statistics
    const ogStats = useMemo(() => {
        let withOG = 0;
        let withoutOG = 0;
        let withOGTitle = 0;
        let withOGDescription = 0;
        let withOGImage = 0;
        let withOGUrl = 0;
        let withOGType = 0;

        crawlData.forEach((item) => {
            const og = item?.opengraph;

            if (!og || Object.keys(og).length === 0) {
                withoutOG++;
            } else {
                withOG++;

                // Check for specific OG properties
                if (og["og:title"]) withOGTitle++;
                if (og["og:description"]) withOGDescription++;
                if (og["og:image"]) withOGImage++;
                if (og["og:url"]) withOGUrl++;
                if (og["og:type"]) withOGType++;
            }
        });

        return {
            withOG,
            withoutOG,
            withOGTitle,
            withOGDescription,
            withOGImage,
            withOGUrl,
            withOGType,
        };
    }, [crawlData]);

    const total = crawlData.length;

    // Memoize OpenGraph data with percentages
    const ogData: OpenGraphDataItem[] = useMemo(() => {
        return [
            { label: "Total Pages", count: total, percentage: "100%" },
            {
                label: "With OpenGraph",
                count: ogStats.withOG,
                percentage:
                    total > 0
                        ? `${((ogStats.withOG / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Without OpenGraph",
                count: ogStats.withoutOG,
                percentage:
                    total > 0
                        ? `${((ogStats.withoutOG / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Has og:title",
                count: ogStats.withOGTitle,
                percentage:
                    total > 0
                        ? `${((ogStats.withOGTitle / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Has og:description",
                count: ogStats.withOGDescription,
                percentage:
                    total > 0
                        ? `${((ogStats.withOGDescription / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Has og:image",
                count: ogStats.withOGImage,
                percentage:
                    total > 0
                        ? `${((ogStats.withOGImage / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Has og:url",
                count: ogStats.withOGUrl,
                percentage:
                    total > 0
                        ? `${((ogStats.withOGUrl / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Has og:type",
                count: ogStats.withOGType,
                percentage:
                    total > 0
                        ? `${((ogStats.withOGType / total) * 100).toFixed(0)}%`
                        : "0%",
            },
        ];
    }, [ogStats, total]);

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
                    <span className="ml-1">OpenGraph</span>
                </div>
            </div>

            {isOpen && (
                <div className="w-full">
                    {ogData.map((data, index) => (
                        <div
                            key={index}
                            className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
                        >
                            <div className="w-2/3 pl-2.5 py-1 text-brand-bright">
                                {data?.label}
                            </div>
                            <div className="w-1/6 text-right pr-2">{data?.count}</div>
                            <div className="w-1/6 text-right pr-2">{data?.percentage}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default React.memo(OpenGraph);
