// @ts-nocheck
export const useNoIndex = (crawlData) => {
  return (
    crawlData?.filter((page) => {
      const robots = page?.meta_robots?.meta_robots;
      if (!robots || !Array.isArray(robots)) return false;
      return robots.some((r) => r.toLowerCase().includes("noindex"));
    }) || []
  );
};

export const useNoFollow = (crawlData) => {
  return (
    crawlData?.filter((page) => {
      const robots = page?.meta_robots?.meta_robots;
      if (!robots || !Array.isArray(robots)) return false;
      return robots.some((r) => r.toLowerCase().includes("nofollow"));
    }) || []
  );
};
