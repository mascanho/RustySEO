export const useMultipleH1 = (crawlData) => {
    return crawlData?.filter((page) => page?.headings?.h1?.length > 1) || [];
};

export const useMissingH1 = (crawlData) => {
    return crawlData?.filter((page) => !page?.headings?.h1 || page?.headings?.h1?.length === 0) || [];
};

export const useMissingH2 = (crawlData) => {
    return crawlData?.filter((page) => !page?.headings?.h2 || page?.headings?.h2?.length === 0) || [];
};
