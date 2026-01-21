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

export interface Ad {
    id: string;
    name: string;
    type: AdType;
    headlines: string[];
    descriptions: string[];
    finalUrl: string;
    displayPath: string;
    keywords: string[];
    sitelinks: Sitelink[];
    images: AdImage[];
    logos: AdImage[];
    businessName?: string;
}
