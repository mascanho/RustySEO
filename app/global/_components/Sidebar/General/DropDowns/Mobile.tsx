// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

interface CrawlDataItem {
    mobile?: boolean;
}

interface MobileDataItem {
    label: string;
    count: number;
    percentage: string;
}

const Mobile: React.FC = () => {
    const { crawlData } = useGlobalCrawlStore((state) => ({
        crawlData: state.crawlData || [],
    }));

    const [isOpen, setIsOpen] = useState(false);

    // Memoize mobile statistics
    const mobileStats = useMemo(() => {
        let mobileFriendly = 0;
        let notMobileFriendly = 0;
        let unknown = 0;

        crawlData.forEach((item) => {
            const mobile = item?.mobile;

            if (mobile === true) {
                mobileFriendly++;
            } else if (mobile === false) {
                notMobileFriendly++;
            } else {
                unknown++;
            }
        });

        return {
            mobileFriendly,
            notMobileFriendly,
            unknown,
        };
    }, [crawlData]);

    const total = crawlData.length;

    // Memoize mobile data with percentages
    const mobileData: MobileDataItem[] = useMemo(() => {
        return [
            { label: "Total Pages", count: total, percentage: "100%" },
            {
                label: "Mobile Friendly",
                count: mobileStats.mobileFriendly,
                percentage:
                    total > 0
                        ? `${((mobileStats.mobileFriendly / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Not Mobile Friendly",
                count: mobileStats.notMobileFriendly,
                percentage:
                    total > 0
                        ? `${((mobileStats.notMobileFriendly / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Unknown",
                count: mobileStats.unknown,
                percentage:
                    total > 0
                        ? `${((mobileStats.unknown / total) * 100).toFixed(0)}%`
                        : "0%",
            },
        ];
    }, [mobileStats, total]);

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
                    <span className="ml-1">Mobile Friendliness</span>
                </div>
            </div>

            {isOpen && (
                <div className="w-full">
                    {mobileData.map((data, index) => (
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

export default React.memo(Mobile);
