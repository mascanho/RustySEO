export const useShortContent = (crawlData) => {
    return crawlData?.filter((page) => (page?.word_count || 0) < 300) || [];
};
