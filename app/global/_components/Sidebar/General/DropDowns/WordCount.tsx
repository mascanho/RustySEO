// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

interface CrawlDataItem {
    word_count?: number;
}

interface WordCountDataItem {
    label: string;
    count: number;
    percentage: string;
}

const WordCount: React.FC = () => {
    const { crawlData } = useGlobalCrawlStore((state) => ({
        crawlData: state.crawlData || [],
    }));

    const [isOpen, setIsOpen] = useState(false);

    // Memoize word count statistics
    const wordCountStats = useMemo(() => {
        let veryShort = 0; // 0-100 words
        let short = 0; // 101-300 words
        let medium = 0; // 301-600 words
        let long = 0; // 601-1000 words
        let veryLong = 0; // 1000+ words
        let noContent = 0; // 0 words

        crawlData.forEach((item) => {
            const wordCount = item?.word_count || 0;

            if (wordCount === 0) {
                noContent++;
            } else if (wordCount <= 100) {
                veryShort++;
            } else if (wordCount <= 300) {
                short++;
            } else if (wordCount <= 600) {
                medium++;
            } else if (wordCount <= 1000) {
                long++;
            } else {
                veryLong++;
            }
        });

        return {
            veryShort,
            short,
            medium,
            long,
            veryLong,
            noContent,
        };
    }, [crawlData]);

    const total = crawlData.length;

    // Memoize word count data with percentages
    const wordCountData: WordCountDataItem[] = useMemo(() => {
        return [
            { label: "Total Pages", count: total, percentage: "100%" },
            {
                label: "No Content (0)",
                count: wordCountStats.noContent,
                percentage:
                    total > 0
                        ? `${((wordCountStats.noContent / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Very Short (1-100)",
                count: wordCountStats.veryShort,
                percentage:
                    total > 0
                        ? `${((wordCountStats.veryShort / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Short (101-300)",
                count: wordCountStats.short,
                percentage:
                    total > 0
                        ? `${((wordCountStats.short / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Medium (301-600)",
                count: wordCountStats.medium,
                percentage:
                    total > 0
                        ? `${((wordCountStats.medium / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Long (601-1000)",
                count: wordCountStats.long,
                percentage:
                    total > 0
                        ? `${((wordCountStats.long / total) * 100).toFixed(0)}%`
                        : "0%",
            },
            {
                label: "Very Long (1000+)",
                count: wordCountStats.veryLong,
                percentage:
                    total > 0
                        ? `${((wordCountStats.veryLong / total) * 100).toFixed(0)}%`
                        : "0%",
            },
        ];
    }, [wordCountStats, total]);

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
                    <span className="ml-1">Word Count</span>
                </div>
            </div>

            {isOpen && (
                <div className="w-full">
                    {wordCountData.map((data, index) => (
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

export default React.memo(WordCount);
