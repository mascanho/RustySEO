// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

interface CrawlDataItem {
    redirect_chain?: any[];
    status_code?: number;
}

interface RedirectDataItem {
    label: string;
    count: number;
    percentage: string;
}

const Redirects: React.FC = () => {
    const { crawlData } = useGlobalCrawlStore((state) => ({
        crawlData: state.crawlData || [],
    }));

    const [isOpen, setIsOpen] = useState(false);

    // Memoize redirect statistics
    const redirectStats = useMemo(() => {
        let totalRedirects = 0;
        let singleRedirect = 0;
        let redirectChains = 0;
        let permanentRedirects = 0; // 301
        let temporaryRedirects = 0; // 302, 307

        crawlData.forEach((item) => {
            const statusCode = item?.status_code;
            const redirectChain = item?.redirect_chain;

            // Check if it's a redirect status code
            if (statusCode && statusCode >= 300 && statusCode < 400) {
                totalRedirects++;

                if (statusCode === 301) {
                    permanentRedirects++;
                } else if (statusCode === 302 || statusCode === 307) {
                    temporaryRedirects++;
                }

                // Check if it's part of a redirect chain
                if (redirectChain && Array.isArray(redirectChain) && redirectChain.length > 1) {
                    redirectChains++;
                } else {
                    singleRedirect++;
                }
            }
        });

        return {
            totalRedirects,
            singleRedirect,
            redirectChains,
            permanentRedirects,
            temporaryRedirects,
        };
    }, [crawlData]);

    const total = crawlData.length;

    // Memoize redirect data with percentages
    const redirectData: RedirectDataItem[] = useMemo(() => {
        return [
            { label: "Total Pages", count: total, percentage: "100%" },
            {
                label: "Total Redirects",
                count: redirectStats.totalRedirects,
                percentage:
                    total > 0
                        ? `${((redirectStats.totalRedirects / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Permanent (301)",
                count: redirectStats.permanentRedirects,
                percentage:
                    total > 0
                        ? `${((redirectStats.permanentRedirects / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Temporary (302/307)",
                count: redirectStats.temporaryRedirects,
                percentage:
                    total > 0
                        ? `${((redirectStats.temporaryRedirects / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Single Redirects",
                count: redirectStats.singleRedirect,
                percentage:
                    total > 0
                        ? `${((redirectStats.singleRedirect / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Redirect Chains",
                count: redirectStats.redirectChains,
                percentage:
                    total > 0
                        ? `${((redirectStats.redirectChains / total) * 100).toFixed(0)}%`
                        : "0%",
            },
        ];
    }, [redirectStats, total]);

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
                    <span className="ml-1">Redirects</span>
                </div>
            </div>

            {isOpen && (
                <div className="w-full">
                    {redirectData.map((data, index) => (
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

export default React.memo(Redirects);
