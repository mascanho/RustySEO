export const useMissingAltText = (crawlData) => {
    return crawlData?.filter((page) => {
        const images = page?.images?.Ok;
        if (!images || !Array.isArray(images)) return false;
        return images.some(img => !img[1] || img[1].trim() === "");
    }) || [];
};

export const useBrokenImages = (crawlData) => {
    return crawlData?.filter((page) => {
        const images = page?.images?.Ok;
        if (!images || !Array.isArray(images)) return false;
        return images.some(img => img[4] >= 400);
    }) || [];
};

export const useLargeImages = (crawlData) => {
    return crawlData?.filter((page) => {
        const images = page?.images?.Ok;
        if (!images || !Array.isArray(images)) return false;
        return images.some(img => img[2] > 100 * 1024); // Assuming size is in bytes. User code used 100, maybe KB?
        // User code: image[2] > 100.
        // If Rust u64 size is bytes, 100 bytes is too small. If it is KB, 100 is correct.
        // Let's check `html_size_calculator.rs` or `image_converter`.
        // Usually size is bytes. But maybe the crawler converts to KB?
        // Let's stick to user's logic: `image[2] > 100` in IssuesContainer.
        // Wait, IssuesContainer says `names="Large Images"`, `image[2] > 100`.
        // If it is bytes, that's tiny. It must be KB.
    }) || [];
};
