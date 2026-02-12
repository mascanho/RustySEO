// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useState, memo } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

const Performance = () => {
    const { crawlData } = useGlobalCrawlStore((state) => ({
        crawlData: state.crawlData || [],
    }));

    const [isOpen, setIsOpen] = useState(false);

    const stats = useMemo(() => {
        let totalPerformance = 0;
        let perfCount = 0;
        let totalAccessibility = 0;
        let accCount = 0;
        let totalBestPractices = 0;
        let bpCount = 0;
        let totalSeo = 0;
        let seoCount = 0;

        let good = 0;
        let needsImprovement = 0;
        let poor = 0;

        crawlData.forEach((item) => {
            if (item.performance_score !== undefined && item.performance_score !== null) {
                const score = item.performance_score * 100;
                totalPerformance += score;
                perfCount++;

                if (score >= 90) good++;
                else if (score >= 50) needsImprovement++;
                else poor++;
            }
            if (item.accessibility_score !== undefined && item.accessibility_score !== null) {
                totalAccessibility += item.accessibility_score * 100;
                accCount++;
            }
            if (item.best_practices_score !== undefined && item.best_practices_score !== null) {
                totalBestPractices += item.best_practices_score * 100;
                bpCount++;
            }
            if (item.seo_score !== undefined && item.seo_score !== null) {
                totalSeo += item.seo_score * 100;
                seoCount++;
            }
        });

        return {
            avgPerformance: perfCount > 0 ? (totalPerformance / perfCount).toFixed(0) : "N/A",
            avgAccessibility: accCount > 0 ? (totalAccessibility / accCount).toFixed(0) : "N/A",
            avgBestPractices: bpCount > 0 ? (totalBestPractices / bpCount).toFixed(0) : "N/A",
            avgSeo: seoCount > 0 ? (totalSeo / seoCount).toFixed(0) : "N/A",
            perfCount,
            good,
            needsImprovement,
            poor,
        };
    }, [crawlData]);

    const performanceSections = useMemo(() => [
        { label: "Performance Score ", value: stats.avgPerformance, suffix: "" },
        { label: "Accessibility Score ", value: stats.avgAccessibility, suffix: "" },
        { label: "Best Practices ", value: stats.avgBestPractices, suffix: "" },
        { label: "SEO Score ", value: stats.avgSeo, suffix: "" },
        { label: "Good (90-100)", value: stats.good, percentage: stats.perfCount > 0 ? `${((stats.good / stats.perfCount) * 100).toFixed(0)}%` : "0%" },
        { label: "Needs Improvement", value: stats.needsImprovement, percentage: stats.perfCount > 0 ? `${((stats.needsImprovement / stats.perfCount) * 100).toFixed(0)}%` : "0%" },
        { label: "Poor (0-49)", value: stats.poor, percentage: stats.perfCount > 0 ? `${((stats.poor / stats.perfCount) * 100).toFixed(0)}%` : "0%" },
    ], [stats]);

    return (
        <div className="text-xs w-full">
            <div className="w-full cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className="text-xs font-semibold border-b dark:border-b-brand-dark pl-1 p-1 flex items-center">
                    <span>
                        {isOpen ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                    </span>
                    <span className="ml-1">Chrome UX Report</span>
                </div>
            </div>

            {isOpen && (
                <div className="w-full">
                    {performanceSections.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
                        >
                            <div className="w-2/3 pl-2.5 py-1 text-brand-bright">
                                {item.label}
                            </div>
                            <div className="w-1/6 text-right pr-2">
                                {item.value}
                                {item.suffix !== undefined ? item.suffix : ""}
                            </div>
                            <div className="w-1/6 text-right pr-2">
                                {item.percentage || ""}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default memo(Performance);
