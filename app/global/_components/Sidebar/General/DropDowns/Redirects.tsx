// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

interface CrawlDataItem {
    url: string;
    original_url: string;
    status_code: number;
    had_redirect: boolean;
    redirect_chain?: { url: string; status_code: number }[];
    redirect_count: number;
    redirection_type?: string;
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
            const hadRedirect = item?.had_redirect;
            const redirectChain = item?.redirect_chain;
            const redirectCount = item?.redirect_count || 0;

            // Check if it's a redirect (either by status code or if it had a redirect flag)
            // Some redirects might result in a 200 OK final status code if the crawler followed them.
            if ((statusCode && statusCode >= 300 && statusCode < 400) || hadRedirect) {
                totalRedirects++;

                // Determine redirect type from the first hop or the redirect flag
                let firstHopStatus = statusCode;
                if (redirectChain && redirectChain.length > 0) {
                    // Usually the first hop has the redirect status code (e.g. 301)
                    firstHopStatus = redirectChain[0].status_code;
                }

                if (firstHopStatus === 301 || firstHopStatus === 308) {
                    permanentRedirects++;
                } else if (firstHopStatus === 302 || firstHopStatus === 307 || firstHopStatus === 303) {
                    temporaryRedirects++;
                }

                // Check if it's part of a redirect chain (more than 1 hop)
                if (redirectCount > 1 || (redirectChain && redirectChain.length > 2)) {
                    redirectChains++;
                } else if (redirectCount === 1 || (redirectChain && redirectChain.length === 2)) {
                    // A single redirect A -> B has 1 hop in redirect_count and usually 2 elements in redirect_chain [A, B]
                    singleRedirect++;
                } else if (hadRedirect) {
                    // Fallback for cases where hadRedirect is true but count/chain is missing
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
                label: "Permanent (301/308)",
                count: redirectStats.permanentRedirects,
                percentage:
                    total > 0
                        ? `${((redirectStats.permanentRedirects / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Temporary (302/303/307)",
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
