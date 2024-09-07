// @ts-nocheck
import useOnPageSeo from "@/store/storeOnPageSeo";
import usePageSpeedStore from "@/store/StorePerformance";
import { useEffect, useMemo } from "react";
import useContentStore from "@/store/storeContent";

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
  const seoCharset = useOnPageSeo((state) => state.seocharset);
  const seoIndexability = useOnPageSeo((state) => state.seoindexability);
  const seoAltTags = useOnPageSeo((state) => state.seoalttags);
  const noAltTags = seoAltTags?.filter((tag) => tag?.alt_text === "");
  const seoStatusCodes = useOnPageSeo((state) => state.seostatusCodes);
  const seoheadings = useOnPageSeo((state) => state.seoheadings);
  const seoImages = useOnPageSeo((state) => state.seoImages);
  const seoOpenGraph = useOnPageSeo((state) => state.seoOpenGraph);

  // Extract the CONTENT from ZUSTAND
  const wordCount = useContentStore((state) => state.wordCount);
  const readingTime = useContentStore((state) => state.readingTime);
  const readingLevelResults = useContentStore((state) => state.readingLevel);
  const contentStructure = useContentStore((state) => state.contentStructure);
  const keywordDensity = useContentStore((state) => state.keywordDensity);
  const contentSentiment = useContentStore((state) => state.contentSentiment);
  const keywords = useContentStore((state) => state.keywords);

  // SET ALL OF THE PERFOMANCE STATE INTO A GLOBAL STATE
  const setGlobalPerformanceScore = usePageSpeedStore(
    (state) => state.setGlobalPerformanceScore,
  );

  useEffect(() => {
    const score = {
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
    };

    setGlobalPerformanceScore(score);
  }, []);

  // Use useMemo to calculate the score only when its dependencies change
  const score = useMemo(
    () => ({
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
    }),
    [
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
    ],
  );

  // Use useEffect to set the global performance score only once
  useEffect(() => {
    setGlobalPerformanceScore(score);
  }, [score, setGlobalPerformanceScore]);
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
        id: "15",
        name: "Favicon",
        status: favicon?.length > 0 ? "Passed" : "Failed",
      },
      {
        id: "16",
        name: "Page Title",
        status:
          seoTitle?.length <= 60 && seoTitle.length > 0 ? "Passed" : "Failed",
      },

      {
        id: "17",
        name: "Page Description",
        status:
          seoDescription?.length <= 160 && seoDescription.length > 0
            ? "Passed"
            : "Failed",
      },
      {
        id: "18",
        name: "Canonical",
        status: seoCanonical !== "No canonical URL found" ? "Passed" : "Failed",
      },
      {
        id: "19",
        name: "Hreflangs",
        status: seoHreflangs?.length > 1 ? "Passed" : "Failed",
      },
      {
        id: "20",
        name: "OpenGraph",
        status: seoOpengraph?.image ? "Passed" : "Failed",
      },
      {
        id: "21",
        name: "Structured Data",
        status: seoSchema?.length > 0 ? "Passed" : "Failed",
      },
      {
        id: "22",
        name: "Page Charset",
        status: seoCharset?.length > 0 ? "Passed" : "Failed",
      },
      {
        id: "23",
        name: "Indexability",
        status:
          seoIndexability && seoIndexability[0] === "Indexable"
            ? "Passed"
            : "Failed",
      },
      {
        id: "24",
        name: "Images Alt Text",
        status: noAltTags?.length === 0 ? "Passed" : "Failed",
      },
      {
        id: "25",
        name: "404 Links",
        status: seoStatusCodes?.length === 0 ? "Passed" : "Failed",
      },
      {
        id: "26",
        name: "Repeated Headings",
        status: seoheadings?.length === 0 ? "Passed" : "Failed",
      },
      {
        id: "27",
        name: "Word Count",
        status: wordCount && wordCount[0] > 0 ? "Passed" : "Failed",
      },
      {
        id: "28",
        name: "Reading Time",
        status: readingTime && readingTime[2] < 10 ? "Passed" : "Failed",
      },
      {
        id: "29",
        name: "Keyword Density",
        status:
          keywords && keywords[0] && keywords[0][0] && keywords[0][0][1] > 20
            ? "Passed"
            : "Failed",
      },
      {
        id: "30",
        name:
          readingLevelResults &&
          readingLevelResults[0] &&
          readingLevelResults[0][1]
            ? readingLevelResults[0][1]
            : "Reading Level",
        status:
          readingLevelResults &&
          readingLevelResults[0] &&
          readingLevelResults[0][1] &&
          (readingLevelResults[0][1] === "Very Easy" ||
            readingLevelResults[0][1] === "Easy" ||
            readingLevelResults[0][1] === "Fairly Easy" ||
            readingLevelResults[0][1] === "Standard")
            ? "Passed"
            : "Failed",
      },

      {
        id: "31",
        name: "Content Structure",
        status: contentStructure === "Neutral" ? "Passed" : "Failed",
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
    seoDescription,
    seoCanonical,
    seoHreflangs,
    seoOpengraph,
    seoSchema,
    seoCharset,
    seoIndexability,
    // seoAltTags,
    noAltTags,
    seoStatusCodes,
    seoheadings,
    seoOpenGraph,
  ]);

  return checks;
};

export default useGetChecks;
