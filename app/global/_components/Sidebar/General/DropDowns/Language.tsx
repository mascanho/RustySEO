// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

interface CrawlDataItem {
    language?: string;
}

interface LanguageDataItem {
    label: string;
    count: number;
    percentage: string;
}

const Language: React.FC = () => {
    const { crawlData } = useGlobalCrawlStore((state) => ({
        crawlData: state.crawlData || [],
    }));

    const [isOpen, setIsOpen] = useState(false);

    // Memoize language statistics
    const languageStats = useMemo(() => {
        const languageMap = new Map<string, number>();
        let noLanguage = 0;

        crawlData.forEach((item) => {
            const language = item?.language;

            if (!language || language === "") {
                noLanguage++;
            } else {
                const currentCount = languageMap.get(language) || 0;
                languageMap.set(language, currentCount + 1);
            }
        });

        // Convert to array and sort by count descending
        const sortedLanguages = Array.from(languageMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Top 10 languages

        return {
            languages: sortedLanguages,
            noLanguage,
        };
    }, [crawlData]);

    const total = crawlData.length;

    // Memoize language data with percentages
    const languageData: LanguageDataItem[] = useMemo(() => {
        const data: LanguageDataItem[] = [
            { label: "Total Pages", count: total, percentage: "100%" },
        ];

        // Add each language
        languageStats.languages.forEach(([lang, count]) => {
            data.push({
                label: lang.toUpperCase(),
                count: count,
                percentage:
                    total > 0 ? `${((count / total) * 100).toFixed(0)}%` : "0%",
            });
        });

        // Add no language count
        if (languageStats.noLanguage > 0) {
            data.push({
                label: "No Language",
                count: languageStats.noLanguage,
                percentage:
                    total > 0
                        ? `${((languageStats.noLanguage / total) * 100).toFixed(0)}%`
                        : "0%",
            });
        }

        return data;
    }, [languageStats, total]);

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
                    <span className="ml-1">Language</span>
                </div>
            </div>

            {isOpen && (
                <div className="w-full">
                    {languageData.map((data, index) => (
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

export default React.memo(Language);
