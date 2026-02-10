export interface RustyAiContext {
    mode: 'Shallow' | 'Deep' | 'LogAnalyser';
    page_metrics?: {
        performance: string;
        fcp: string;
        lcp: string;
        tti: string;
        cls: string;
        speed_index: string;
        server_response: string;
    };
    seo_info?: {
        title: string;
        description: string;
        canonical: string;
        indexability: string;
        h1: string;
        word_count: string;
        reading_time: string;
        reading_level: string;
    };
    deep_summary?: {
        total_pages: number;
        total_issues: number;
        domain: string;
        status_codes_distribution: string;
        depth_distribution: string;
        avg_response_time: string;
    };
    log_summary?: {
        total_lines: number;
        unique_ips: number;
        crawler_count: number;
        success_rate: string;
        bot_breakdown: string;
        top_pages: string;
    };
}

export const buildRustyAiContext = (
    pathname: string,
    pageSpeedStore: any,
    onPageSEO: any,
    contentStore: any,
    crawlStore: any,
    logAnalysisStore: any,
    issuesData: any[] = []
): RustyAiContext => {
    const isShallow = pathname === "/";
    const isLogAnalyser = pathname === "/serverlogs";

    if (isShallow) {
        return {
            mode: 'Shallow',
            page_metrics: {
                performance: String(pageSpeedStore.performance ?? "N/A"),
                fcp: String(pageSpeedStore.fcp ?? "N/A"),
                lcp: String(pageSpeedStore.lcp ?? "N/A"),
                tti: String(pageSpeedStore.tti ?? "N/A"),
                cls: String(pageSpeedStore.cls ?? "N/A"),
                speed_index: String(pageSpeedStore.speedIndex ?? "N/A"),
                server_response: String(pageSpeedStore.serverResponse ?? "N/A"),
            },
            seo_info: {
                title: String(onPageSEO.seopagetitle ?? "N/A"),
                description: String(onPageSEO.seodescription ?? "N/A"),
                canonical: String(onPageSEO.seocanonical ?? "N/A"),
                indexability: String(onPageSEO.seoindexability ?? "N/A"),
                h1: Array.isArray(onPageSEO.seoheadings) ? onPageSEO.seoheadings.join(", ") : String(onPageSEO.seoheadings ?? "N/A"),
                word_count: String(contentStore.wordCount ?? 0),
                reading_time: String(contentStore.readingTime ?? "N/A"),
                reading_level: String(contentStore.readingLevel ?? "N/A"),
            }
        };
    } else if (isLogAnalyser) {
        const overview = logAnalysisStore.overview;
        const botBreakdown = Object.entries(overview.totals.bot_stats || {})
            .map(([bot, stats]: [string, any]) => `${bot}: ${stats.count || 0}`)
            .join(", ");

        const topPages = (overview.totals.google_bot_pages || []).slice(0, 10).join(", ");

        return {
            mode: 'LogAnalyser',
            log_summary: {
                total_lines: overview.line_count,
                unique_ips: overview.unique_ips,
                crawler_count: overview.crawler_count,
                success_rate: `${(overview.success_rate * 100).toFixed(1)}%`,
                bot_breakdown: botBreakdown || "N/A",
                top_pages: topPages || "N/A",
            }
        };
    } else {
        // Deep Crawl Mode
        const crawlData = crawlStore.crawlData || [];
        const domain = crawlData.length > 0 ? new URL(crawlData[0].url).hostname : "Unknown";

        // Distribution calculations
        const statusCodes: Record<string, number> = {};
        const depthDist: Record<string, number> = {};
        let totalResponseTime = 0;
        let responseTimeCount = 0;

        crawlData.forEach((page: any) => {
            statusCodes[page.status_code] = (statusCodes[page.status_code] || 0) + 1;
            depthDist[page.depth] = (depthDist[page.depth] || 0) + 1;
            if (page.response_time) {
                totalResponseTime += page.response_time;
                responseTimeCount++;
            }
        });

        const statusDistStr = Object.entries(statusCodes)
            .map(([code, count]) => `${code}: ${count}`)
            .join(", ");

        const depthDistStr = Object.entries(depthDist)
            .map(([depth, count]) => `Level ${depth}: ${count}`)
            .join(", ");

        return {
            mode: 'Deep',
            deep_summary: {
                total_pages: crawlData.length,
                total_issues: issuesData.length,
                domain: domain,
                status_codes_distribution: statusDistStr || "N/A",
                depth_distribution: depthDistStr || "N/A",
                avg_response_time: responseTimeCount > 0
                    ? `${(totalResponseTime / responseTimeCount).toFixed(2)}ms`
                    : "N/A",
            }
        };
    }
};
