// @ts-nocheck
import useOnPageSeo from "@/store/storeOnPageSeo";
import usePageSpeedStore from "@/store/StorePerformance";
import { useEffect, useMemo, useCallback } from "react";
import useContentStore from "@/store/storeContent";

const useGetChecks = () => {
  // Extract all necessary state from Zustand store using a custom hook
  const usePageSpeedStoreState = (selector) =>
    usePageSpeedStore(useCallback(selector, []));
  const useOnPageSeoState = (selector) =>
    useOnPageSeo(useCallback(selector, []));
  const useContentStoreState = (selector) =>
    useContentStore(useCallback(selector, []));

  const performance = usePageSpeedStoreState((state) => state.performance);
  const fcp = usePageSpeedStoreState((state) => state.fcp);
  const lcp = usePageSpeedStoreState((state) => state.lcp);
  const tti = usePageSpeedStoreState((state) => state.tti);
  const tbt = usePageSpeedStoreState((state) => state.tbt);
  const cls = usePageSpeedStoreState((state) => state.cls);
  const speedIndex = usePageSpeedStoreState((state) => state.speedIndex);
  const serverResponse = usePageSpeedStoreState(
    (state) => state.serverResponse,
  );
  const largePayloads = usePageSpeedStoreState((state) => state.largePayloads);
  const domSize = usePageSpeedStoreState((state) => state.domSize);
  const urlRedirects = usePageSpeedStoreState((state) => state.urlRedirects);
  const longTasks = usePageSpeedStoreState((state) => state.longTasks);
  const renderBlocking = usePageSpeedStoreState(
    (state) => state.renderBlocking,
  );
  const networkRequests = usePageSpeedStoreState(
    (state) => state.networkRequests,
  );

  // Extract the SEO from Zustand
  const favicon = useOnPageSeoState((state) => state.favicon);
  const seoTitle = useOnPageSeoState((state) => state.seopagetitle);
  const seoDescription = useOnPageSeoState((state) => state.seodescription);
  const seoCanonical = useOnPageSeoState((state) => state.seocanonical);
  const seoHreflangs = useOnPageSeoState((state) => state.seohreflangs);
  const seoOpengraph = useOnPageSeoState((state) => state.seoopengraph);
  const seoSchema = useOnPageSeoState((state) => state.seoschema);
  const seoCharset = useOnPageSeoState((state) => state.seocharset);
  const seoIndexability = useOnPageSeoState((state) => state.seoindexability);
  const seoAltTags = useOnPageSeoState((state) => state.seoalttags);
  const seoStatusCodes = useOnPageSeoState((state) => state.seostatusCodes);
  const seoheadings = useOnPageSeoState((state) => state.seoheadings);
  const seoOpenGraph = useOnPageSeoState((state) => state.seoOpenGraph);
  const seoUrlLength = useOnPageSeoState((state) => state.seoUrlLength);

  // Extract the CONTENT from ZUSTAND
  const wordCount = useContentStoreState((state) => state.wordCount);
  const readingTime = useContentStoreState((state) => state.readingTime);
  const readingLevelResults = useContentStoreState(
    (state) => state.readingLevel,
  );
  const contentStructure = useContentStoreState(
    (state) => state.contentStructure,
  );
  const keywords = useContentStoreState((state) => state.keywords);
  const video = useContentStoreState((state) => state.video);

  const setGlobalPerformanceScore = usePageSpeedStore(
    (state) => state.setGlobalPerformanceScore,
  );

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

  useEffect(() => {
    setGlobalPerformanceScore(score);
  }, [score, setGlobalPerformanceScore]);

  const checks = useMemo(() => {
    const createCheck = (id, name, condition) => ({
      id,
      name,
      status: condition ? "Passed" : "Failed",
    });

    return [
      createCheck("1", "Performance", performance >= 0.5),
      createCheck("3", "First Contentful Paint", fcp >= 0.5),
      createCheck("4", "Largest Contentful Paint", lcp >= 0.5),
      createCheck("5", "Time to Interactive", tti >= 0.5),
      createCheck("5", "Total Blocking Time", tbt >= 0.5),
      createCheck("6", "Cumulative Layout Shift", cls >= 0.5),
      createCheck("7", "Speed Index", speedIndex >= 0.5),
      createCheck("8", "Server Response Time", serverResponse >= 0.5),
      createCheck("9", "Total Byte Weight", largePayloads >= 0.5),
      createCheck("10", "DOM Size", domSize <= 1500),
      createCheck("11", "URL Redirects", urlRedirects <= 0),
      createCheck("12", "Long Tasks", longTasks <= 0),
      createCheck("13", "Render Blocking Resources", renderBlocking <= 0),
      createCheck("14", "Network Requests", networkRequests <= 0.5),
      createCheck("15", "Favicon", favicon?.length > 0),
      createCheck(
        "16",
        "Page Title",
        seoTitle?.length <= 60 && seoTitle.length > 0,
      ),
      createCheck(
        "17",
        "Page Description",
        seoDescription?.length <= 160 && seoDescription.length > 0,
      ),
      createCheck("18", "Canonical", seoCanonical !== "No canonical URL found"),
      createCheck("19", "Hreflangs", seoHreflangs?.length > 0),
      createCheck("201", "URL length", seoUrlLength.length > 200),
      createCheck("20", "OpenGraph", seoOpengraph?.image),
      createCheck("21", "Structured Data", seoSchema?.length > 0),
      createCheck("22", "Page Charset", seoCharset?.length > 0),
      createCheck(
        "23",
        "Indexability",
        seoIndexability && seoIndexability[0] === "Indexable",
      ),
      createCheck(
        "24",
        "Images Alt Text",
        seoAltTags?.filter((tag) => tag?.alt_text === "").length === 0,
      ),
      createCheck("25", "404 Links", seoStatusCodes?.length === 0),
      createCheck("26", "Repeated Headings", seoheadings?.length === 0),
      createCheck("27", "Word Count", wordCount && wordCount[0] > 0),
      createCheck("28", "Reading Time", readingTime && readingTime[2] < 10),
      createCheck(
        "29",
        "Keyword Density",
        keywords?.length > 0 && keywords[0]?.[0]?.[1] > 20,
      ),
      {
        id: "30",
        name: readingLevelResults?.[0]?.[1] || "Reading Level",
        status: ["Very Easy", "Easy", "Fairly Easy", "Standard"].includes(
          readingLevelResults?.[0]?.[1],
        )
          ? "Passed"
          : "Failed",
      },
      createCheck("31", "Content Structure", contentStructure === "Neutral"),
      createCheck("32", "Media / Video", video?.[0] === "Yes"),
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
    seoAltTags,
    seoStatusCodes,
    seoheadings,
    seoOpenGraph,
    wordCount,
    readingTime,
    readingLevelResults,
    contentStructure,
    keywords,
    video,
  ]);

  return checks;
};

export default useGetChecks;
