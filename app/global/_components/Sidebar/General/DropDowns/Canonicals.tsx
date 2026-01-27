// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

interface CrawlDataItem {
    canonicals?: string[] | null;
}

interface CanonicalDataItem {
    label: string;
    count: number;
    percentage: string;
}

const Canonicals: React.FC = () => {
    const { crawlData } = useGlobalCrawlStore((state) => ({
        crawlData: state.crawlData || [],
    }));

    const [isOpen, setIsOpen] = useState(false);

    // Memoize canonical statistics
    const canonicalStats = useMemo(() => {
        let withCanonical = 0;
        let withoutCanonical = 0;
        let selfReferencing = 0;
        let externalCanonical = 0;

        crawlData.forEach((item) => {
            const canonicals = item?.canonicals;

            if (!canonicals || canonicals.length === 0) {
                withoutCanonical++;
            } else {
                withCanonical++;

                // Check if self-referencing (canonical points to same URL)
                if (canonicals[0] === item.url) {
                    selfReferencing++;
                } else if (canonicals[0] && !canonicals[0].includes(new URL(item.url).hostname)) {
                    externalCanonical++;
                }
            }
        });

        return {
            withCanonical,
            withoutCanonical,
            selfReferencing,
            externalCanonical,
        };
    }, [crawlData]);

    const total = crawlData.length;

    // Memoize canonical data with percentages
    const canonicalData: CanonicalDataItem[] = useMemo(() => {
        return [
            { label: "Total Pages", count: total, percentage: "100%" },
            {
                label: "With Canonical",
                count: canonicalStats.withCanonical,
                percentage:
                    total > 0
                        ? `${((canonicalStats.withCanonical / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Without Canonical",
                count: canonicalStats.withoutCanonical,
                percentage:
                    total > 0
                        ? `${((canonicalStats.withoutCanonical / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Self-Referencing",
                count: canonicalStats.selfReferencing,
                percentage:
                    total > 0
                        ? `${((canonicalStats.selfReferencing / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "External Canonical",
                count: canonicalStats.externalCanonical,
                percentage:
                    total > 0
                        ? `${((canonicalStats.externalCanonical / total) * 100).toFixed(0)}%`
                        : "0%",
            },
        ];
    }, [canonicalStats, total]);

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
                    <span className="ml-1">Canonicals</span>
                </div>
            </div>

            {isOpen && (
                <div className="w-full">
                    {canonicalData.map((data, index) => (
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

export default React.memo(Canonicals);
