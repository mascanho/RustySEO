export const useCanonicalsMissing = (crawlData) => {
    return crawlData?.filter((page) => !page?.canonicals || page?.canonicals?.length === 0) || [];
};

export const useCanonicalMismatch = (crawlData) => {
    return crawlData?.filter((page) => {
        if (!page?.canonicals || page?.canonicals?.length === 0 || !page?.url) return false;
        // Normalize logical url and canonical
        const url = page.url.replace(/\/$/, "");
        const canonical = page.canonicals[0].replace(/\/$/, "");
        return url !== canonical;
    }) || [];
};
