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
        file_types?: string;
        status_codes?: string;
        content_segments?: string;
        specialized_bots?: string;
        trend_totals?: {
            path_count: number;
            path_hits: number;
            status_count: number;
            status_hits: number;
            method_count: number;
            method_hits: number;
            user_agent_count: number;
            user_agent_hits: number;
            referer_count: number;
            referer_hits: number;
            browser_count: number;
            browser_hits: number;
            verified_count: number;
            verified_hits: number;
            ip_count: number;
            ip_hits: number;
            human_count: number;
            human_hits: number;
            top_paths?: [string, number][];
            top_status_codes?: [string, number][];
            top_user_agents?: [string, number][];
            top_referrers?: [string, number][];
            top_browsers?: [string, number][];
        };
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
        const widgetAggs = logAnalysisStore.widgetAggs;
        const totals = overview.totals || {};
        
        // Improve bot breakdown by using individual totals
        const bots = [
            { name: 'Google', count: totals.google },
            { name: 'Bing', count: totals.bing },
            { name: 'Semrush', count: totals.semrush },
            { name: 'Hrefs', count: totals.hrefs },
            { name: 'Moz', count: totals.moz },
            { name: 'Uptime', count: totals.uptime },
            { name: 'OpenAI', count: totals.openai },
            { name: 'Claude', count: totals.claude },
        ];

        const botBreakdown = bots
            .filter(b => b.count > 0)
            .map(b => `${b.name}: ${b.count}`)
            .join(", ") || "No major search bots detected";

        // Top pages from all traffic (from widgetAggs.content)
        const topPages = Object.entries(widgetAggs?.content || {})
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 10)
            .map(([path, count]) => `${path} (${count})`)
            .join(", ");

        const fileTypes = Object.entries(widgetAggs?.file_types || {})
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([ext, count]) => `${ext.toUpperCase()}: ${count}`)
            .join(", ");
        
        const statusCodes = Object.entries(widgetAggs?.status_codes || {})
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([code, count]) => `${code}: ${count}`)
            .join(", ");

        const crawlerTypes = Object.entries(widgetAggs?.crawler_types || {})
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([type, count]) => `${type}: ${count}`)
            .join(", ");

        // Success rate: if it's already > 1, it's likely a percentage value (0-100)
        const rawSuccessRate = overview.success_rate || 0;
        const successRateDisplay = rawSuccessRate > 1 
            ? `${rawSuccessRate.toFixed(1)}%` 
            : `${(rawSuccessRate * 100).toFixed(1)}%`;

        return {
            mode: 'LogAnalyser',
            log_summary: {
                total_lines: overview.line_count,
                unique_ips: overview.unique_ips,
                crawler_count: overview.crawler_count,
                success_rate: successRateDisplay,
                bot_breakdown: botBreakdown,
                top_pages: topPages || "N/A",
                file_types: fileTypes || "N/A",
                status_codes: statusCodes || "N/A",
                content_segments: "Included in Top Pages", // Content is already paths
                specialized_bots: crawlerTypes || "N/A",
                trend_totals: logAnalysisStore.trendTotals ? {
                    path_count: logAnalysisStore.trendTotals.path_count,
                    path_hits: logAnalysisStore.trendTotals.path_hits,
                    status_count: logAnalysisStore.trendTotals.status_count,
                    status_hits: logAnalysisStore.trendTotals.status_hits,
                    method_count: logAnalysisStore.trendTotals.method_count,
                    method_hits: logAnalysisStore.trendTotals.method_hits,
                    user_agent_count: logAnalysisStore.trendTotals.user_agent_count,
                    user_agent_hits: logAnalysisStore.trendTotals.user_agent_hits,
                    referer_count: logAnalysisStore.trendTotals.referer_count,
                    referer_hits: logAnalysisStore.trendTotals.referer_hits,
                    browser_count: logAnalysisStore.trendTotals.browser_count,
                    browser_hits: logAnalysisStore.trendTotals.browser_hits,
                    verified_count: logAnalysisStore.trendTotals.verified_count,
                    verified_hits: logAnalysisStore.trendTotals.verified_hits,
                    ip_count: logAnalysisStore.trendTotals.ip_count,
                    ip_hits: logAnalysisStore.trendTotals.ip_hits,
                    human_count: logAnalysisStore.trendTotals.human_count,
                    human_hits: logAnalysisStore.trendTotals.human_hits,
                    top_paths: logAnalysisStore.trendTotals.top_paths,
                    top_status_codes: logAnalysisStore.trendTotals.top_status_codes,
                    top_user_agents: logAnalysisStore.trendTotals.top_user_agents,
                    top_referrers: logAnalysisStore.trendTotals.top_referrers,
                    top_browsers: logAnalysisStore.trendTotals.top_browsers,
                } : undefined,
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
