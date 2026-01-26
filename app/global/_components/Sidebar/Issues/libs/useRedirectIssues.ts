// @ts-nocheck
export const useLongRedirectChains = (crawlData) => {
  return crawlData?.filter((page) => page?.redirect_chain?.length > 2) || [];
};
