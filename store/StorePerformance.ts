import { create } from "zustand";

// Define the Zustand store
const usePageSpeedStore = create((set, get) => ({
  performance: null,
  fcp: null,
  lcp: null,
  tti: null,
  cls: null,
  speedIndex: null,
  serverResponse: null,
  largePayloads: null,
  domSize: null,
  urlRedirects: null,
  longTasks: null,
  renderBlocking: null,
  netowrkRequests: null,
  passedChecks: 0,
  failedChecks: 0,
  GlobalPerformanceScore: null,
  // Function to set all the values at once
  setPageSpeedData: (pageSpeed: any) =>
    set({
      performance:
        pageSpeed?.lighthouseResult?.categories?.performance?.score || null,
      fcp:
        pageSpeed?.lighthouseResult?.audits?.["first-contentful-paint"]
          ?.score || null,
      lcp:
        pageSpeed?.lighthouseResult?.audits?.["largest-contentful-paint"]
          ?.score || null,
      tti: pageSpeed?.lighthouseResult?.audits?.["interactive"]?.score || null,
      tbt:
        pageSpeed?.lighthouseResult?.audits?.["total-blocking-time"]?.score ||
        null,
      cls:
        pageSpeed?.lighthouseResult?.audits?.["cumulative-layout-shift"]
          ?.score || null,
      speedIndex:
        pageSpeed?.lighthouseResult?.audits?.["speed-index"]?.score || null,
      serverResponse:
        pageSpeed?.lighthouseResult?.audits?.["server-response-time"]?.score ||
        null,
      largePayloads:
        pageSpeed?.lighthouseResult?.audits?.["total-byte-weight"]?.score ||
        null,
      domSize:
        pageSpeed?.lighthouseResult?.audits?.["dom-size"]?.numericValue || null,
      urlRedirects:
        pageSpeed?.lighthouseResult?.audits?.redirects?.details?.items.length ||
        null,
      longTasks:
        pageSpeed?.lighthouseResult?.audits?.["long-tasks"]?.score || null,
      renderBlocking:
        pageSpeed?.lighthouseResult?.audits?.["render-blocking-resources"]
          ?.numericValue || null,
      networkRequests:
        pageSpeed?.lighthouseResult?.audits?.["network-requests"]?.score ||
        null,
    }),
  setChecksData: (passedChecks: any, failedChecks: any) =>
    set({
      passedChecks,
      failedChecks,
    }),
  setGlobalPerformanceScore: (GlobalPerformanceScore: object) =>
    set({
      GlobalPerformanceScore,
    }),
}));

export default usePageSpeedStore;
