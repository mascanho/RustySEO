// @ts-nocheck
import useOnPageSeo from "@/store/storeOnPageSeo";
import usePageSpeedStore from "@/store/StorePerformance";
import { useMemo } from "react";

const useGetChecks = () => {
  // Extract all necessary state from Zustand store
  const performance = usePageSpeedStore((state) => state.performance);
  const fcp = usePageSpeedStore((state) => state.fcp);
  const lcp = usePageSpeedStore((state) => state.lcp);
  const tti = usePageSpeedStore((state) => state.tti);
  const tbt = usePageSpeedStore((state) => state.tbt);
  const cls = usePageSpeedStore((state) => state.cls);
  const speedIndex = usePageSpeedStore((state) => state.speedIndex);
  const serverResponse = usePageSpeedStore((state) => state.serverResponse);
  const largePayloads = usePageSpeedStore((state) => state.largePayloads);
  const domSize = usePageSpeedStore((state) => state.domSize);
  const urlRedirects = usePageSpeedStore((state) => state.urlRedirects);
  const longTasks = usePageSpeedStore((state) => state.longTasks);
  const renderBlocking = usePageSpeedStore((state) => state.renderBlocking);
  const networkRequests = usePageSpeedStore((state) => state.netowrkRequests);

  // Extract the SEO from Zustand
  const favicon = useOnPageSeo((state) => state.favicon);
  const seoTitle = useOnPageSeo((state) => state.seopagetitle);
  const seoDescription = useOnPageSeo((state) => state.seodescription);
  const seoCanonical = useOnPageSeo((state) => state.seocanonical);
  const seoHreflangs = useOnPageSeo((state) => state.seohreflangs);
  const seoOpengraph = useOnPageSeo((state) => state.seoopengraph);
  const seoSchema = useOnPageSeo((state) => state.seoschema);

  console.log(favicon, "SEO CHECKLIST");

  // Use useMemo to avoid recalculating on every render
  const checks = useMemo(() => {
    return [
      {
        id: "1",
        name: "Performance",
        status: performance >= 0.5 ? "Passed" : "Failed", // Dynamically set based on performance score
      },

      {
        id: "3",
        name: "First Contentful Paint",
        status: fcp >= 0.5 ? "Passed" : "Failed",
      },
      {
        id: "4",
        name: "Largest Contentful Paint",
        status: lcp >= 0.5 ? "Passed" : "Failed",
      },
      {
        id: "5",
        name: "Time to Interactive",
        status: tti >= 0.5 ? "Passed" : "Failed",
      },

      {
        id: "5",
        name: "Total Blocking Time",
        status: tbt >= 0.5 ? "Passed" : "Failed",
      },

      {
        id: "6",
        name: "Cumulative Layout Shift",
        status: cls >= 0.5 ? "Passed" : "Failed",
      },
      {
        id: "7",
        name: "Speed Index",
        status: speedIndex >= 0.5 ? "Passed" : "Failed",
      },
      {
        id: "8",
        name: "Server Response Time",
        status: serverResponse >= 0.5 ? "Passed" : "Failed",
      },
      {
        id: "9",
        name: "Total Byte Weight",
        status: largePayloads >= 0.5 ? "Passed" : "Failed",
      },
      {
        id: "10",
        name: "DOM Size",
        status: domSize <= 1500 ? "Passed" : "Failed",
      },
      {
        id: "11",
        name: "URL Redirects",
        status: urlRedirects <= 0 ? "Passed" : "Failed",
      },
      {
        id: "12",
        name: "Long Tasks",
        status: longTasks <= 0 ? "Passed" : "Failed",
      },
      {
        id: "13",
        name: "Render Blocking Resources",
        status: renderBlocking <= 0 ? "Passed" : "Failed",
      },
      {
        id: "14",
        name: "Network Requests",
        status: networkRequests <= 0.5 ? "Passed" : "Failed",
      },
      {
        id: "16",
        name: "Favicon",
        status: favicon?.length > 0 ? "Passed" : "Failed",
      },
      {
        id: "16",
        name: "Page Title",
        status: seoTitle?.length < 60 ? "Passed" : "Failed",
      },
    ];
  }, [
    performance,
    fcp,
    lcp,
    tti,
    tbt,
    cls,
    speedIndex,
    serverResponse,
    largePayloads,
    domSize,
    urlRedirects,
    longTasks,
    renderBlocking,
    networkRequests,
    seoTitle,
    favicon,
  ]);

  return checks;
};

export default useGetChecks;
