// @ts-nocheck
export const useMissingAltText = (crawlData) => {
  return (
    crawlData?.filter((page) => {
      const images = Array.isArray(page?.images) ? page.images : page?.images?.Ok;
      if (!images || !Array.isArray(images)) return false;
      return images.some((img) => !img[1] || img[1].trim() === "");
    }) || []
  );
};

export const useBrokenImages = (crawlData) => {
  return (
    crawlData?.filter((page) => {
      const images = Array.isArray(page?.images) ? page.images : page?.images?.Ok;
      if (!images || !Array.isArray(images)) return false;
      return images.some((img) => img[4] >= 400);
    }) || []
  );
};

export const useLargeImages = (crawlData) => {
  return (
    crawlData?.filter((page) => {
      const images = Array.isArray(page?.images) ? page.images : page?.images?.Ok;
      if (!images || !Array.isArray(images)) return false;
      return images.some((img) => img[2] > 100 * 1024); // Assuming size is in bytes
    }) || []
  );
};
