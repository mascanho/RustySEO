export const useSlowPages = (crawlData) => {
    return crawlData?.filter((page) => (page?.response_time || 0) > 2.0) || [];
};

export const useLargeHTML = (crawlData) => {
    return crawlData?.filter((page) => (page?.content_length || 0) > 100 * 1024) || [];
};
