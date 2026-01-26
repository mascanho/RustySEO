export const useNotHttps = (crawlData) => {
    return crawlData?.filter((page) => !page?.https) || [];
};
