// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

interface CookiesDataItem {
    label: string;
    count: number | string;
    percentage: string;
}

const Cookies: React.FC = () => {
    const { crawlData } = useGlobalCrawlStore((state) => ({
        crawlData: state.crawlData || [],
    }));

    const [isOpen, setIsOpen] = useState(false);

    // Memoize cookies statistics
    const cookiesStats = useMemo(() => {
        let withCookies = 0;
        let withoutCookies = 0;
        let totalCookies = 0;

        crawlData.forEach((item) => {
            // Determine cookie count based on item structure
            let count = 0;
            if (Array.isArray(item?.cookies?.Ok)) {
                count = item.cookies.Ok.length;
            } else if (Array.isArray(item?.cookies)) {
                count = item.cookies.length;
            }

            totalCookies += count;

            if (count > 0) {
                withCookies++;
            } else {
                withoutCookies++;
            }
        });

        return {
            withCookies,
            withoutCookies,
            totalCookies,
        };
    }, [crawlData]);

    const total = crawlData.length;

    const cookiesData: CookiesDataItem[] = useMemo(() => {
        const avg = total > 0 ? (cookiesStats.totalCookies / total).toFixed(1) : "0";

        return [
            { label: "Total Pages", count: total, percentage: "100%" },
            {
                label: "With Cookies",
                count: cookiesStats.withCookies,
                percentage:
                    total > 0
                        ? `${((cookiesStats.withCookies / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Without Cookies",
                count: cookiesStats.withoutCookies,
                percentage:
                    total > 0
                        ? `${((cookiesStats.withoutCookies / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Avg. Cookies / Page",
                count: avg,
                percentage: "-",
            },
            {
                label: "Total Cookies Found",
                count: cookiesStats.totalCookies,
                percentage: "-",
            },
        ];
    }, [cookiesStats, total]);

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
                    <span className="ml-1">Cookies</span>
                </div>
            </div>

            {isOpen && (
                <div className="w-full">
                    {cookiesData.map((data, index) => (
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

export default React.memo(Cookies);
