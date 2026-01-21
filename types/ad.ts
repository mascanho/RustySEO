export type AdType = 'search' | 'pmax' | 'display';

export interface Sitelink {
    id: string;
    title: string;
    url: string;
    description1?: string;
    description2?: string;
}

export interface AdImage {
    id: string;
    url: string;
    name: string;
    size: number;
    type: string;
}

export type BiddingStrategy = 'manual_cpc' | 'maximize_conversions' | 'maximize_clicks' | 'target_roas' | 'target_cpa';

export interface AdExtension {
    id: string;
    type: 'callout' | 'structured_snippet' | 'call' | 'price' | 'promotion';
    value: string;
    extra?: string; // For call phone number, promotion code, etc.
}

export interface Ad {
    id: string;
    name: string;
    status: 'enabled' | 'paused' | 'removed';
    type: AdType;
    // Core Content
    headlines: string[];
    descriptions: string[];
    finalUrl: string;
    displayPath: string;
    businessName?: string;
    // Targeting
    keywords: string[];
    locations: string[];
    languages: string[];
    // Assets & Extensions
    sitelinks: Sitelink[];
    images: AdImage[];
    logos: AdImage[];
    extensions: AdExtension[];
    // Campaign Settings
    budget: number;
    currency: string;
    biddingStrategy: BiddingStrategy;
    targetCPA?: number;
    targetROAS?: number;
    startDate?: string;
    endDate?: string;
}
