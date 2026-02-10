export interface RustyAiContext {
    mode: 'Shallow' | 'Deep';
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
    };
    deep_summary?: {
        total_pages: number;
        total_issues: number;
        domain: string;
        status_codes_distribution: string;
    };
}

export const buildRustyAiContext = (
    pathname: string,
    pageSpeedStore: any,
    onPageSEO: any,
    contentStore: any,
    crawlStore: any,
    issuesData: any[] = []
): RustyAiContext => {
    const isShallow = pathname === "/";

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
            }
        };
    } else {
        // Deep Crawl Mode
        const crawlData = crawlStore.crawlData || [];
        const domain = crawlData.length > 0 ? new URL(crawlData[0].url).hostname : "Unknown";

        // Calculate status code distribution
        const statusCodes = crawlData.reduce((acc: any, page: any) => {
            acc[page.status_code] = (acc[page.status_code] || 0) + 1;
            return acc;
        }, {});

        const distributionStr = Object.entries(statusCodes)
            .map(([code, count]) => `${code}: ${count}`)
            .join(", ");

        return {
            mode: 'Deep',
            deep_summary: {
                total_pages: crawlData.length,
                total_issues: issuesData.length,
                domain: domain,
                status_codes_distribution: distributionStr || "N/A",
            }
        };
    }
};
