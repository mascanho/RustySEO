// @ts-nocheck
import React, { useEffect, useState, useMemo, useCallback } from "react";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import useFindDuplicateTitles from "./libs/useDuplicatedTitles";
import useFindDuplicateDescriptions from "./libs/useDuplicatedDescriptions";
import useResponseCodes from "./libs/useResponseCodes";
import { useFixesStore } from "@/store/FixesStore";
import useGlobalConsoleStore from "@/store/GlobalConsoleLog";

// Memoized row component to prevent unnecessary re-renders
const IssueRow = React.memo(({ item, isSelected, onClick }) => (
  <tr
    onClick={() => onClick(item.name)}
    className={`cursor-pointer border border-b p-1 text-[9px] dark:text-white ${
      isSelected
        ? "dark:text-[#2B6CC4] text-[#2B6CC4] font-bold"
        : "dark:text-[#f5f5f5]"
    }`}
  >
    <td className="px-2 py-1 dark:bg-brand-darker border text-[9px]">
      {item.name}
    </td>
    <td className="px-2 py-1 dark:bg-brand-darker border">{item.issueCount}</td>
    <td className="px-2 py-1 dark:bg-brand-darker border">{item.percentage}</td>
    <td
      className={`px-2 py-1 dark:bg-brand-darker border text-xs font-semibold text-center ${
        item.priority === "High"
          ? "bg-[hsl(710,100%,60%)] text-white dark:bg-red-500"
          : item.priority === "Medium"
            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-100"
            : "bg-green-100 text-green-800 dark:bg-green-100"
      }`}
    >
      {item.priority}
    </td>
  </tr>
));

IssueRow.displayName = "IssueRow";

const IssuesContainer = () => {
  // Selective Zustand subscriptions to minimize re-renders
  const crawlData = useGlobalCrawlStore((state) => state.crawlData);
  const setIssues = useGlobalCrawlStore((state) => state.setIssues);
  const issueRow = useGlobalCrawlStore((state) => state.issueRow);
  const setIssueRow = useGlobalCrawlStore((state) => state.setIssueRow);
  const setIssuesData = useGlobalCrawlStore((state) => state.setIssuesData);
  const setIssuesView = useGlobalCrawlStore((state) => state.setIssuesView);
  const issuesView = useGlobalCrawlStore((state) => state.issuesView);
  const setGenericChart = useGlobalCrawlStore((state) => state.setGenericChart);
  const statusCodes = useGlobalCrawlStore((state) => state.statusCodes);
  const headingsH1 = useGlobalCrawlStore((state) => state.headingsH1);
  const { setFix } = useFixesStore();
  const { isFinishedDeepCrawl } = useGlobalConsoleStore();

  const [isMode, setIsMode] = useState(null);

  // Memoized computations to avoid recalculating on every render
  const missingTitles = useMemo(
    () => crawlData?.filter((page) => page?.title === "") || [],
    [crawlData],
  );
  const missingDescriptions = useMemo(
    () => crawlData?.filter((page) => page?.description === "") || [],
    [crawlData],
  );
  const duplicateTitles = useFindDuplicateTitles(crawlData, "title");
  const duplicateDescriptions = useFindDuplicateDescriptions(
    crawlData,
    "description",
  );
  const descriptionsAbove160Chars = useMemo(
    () => crawlData?.filter((page) => page?.description?.length > 160) || [],
    [crawlData],
  );
  const response404 = useResponseCodes(crawlData, 404);
  const response5xx = useResponseCodes(crawlData, 500);
  const pagetitleBelow30Chars = useMemo(
    () =>
      crawlData?.filter((page) => page?.title?.[0]?.title?.length < 30) || [],
    [crawlData],
  );
  const pageTitlesAbove60Chars = useMemo(
    () =>
      crawlData?.filter((page) => page?.title?.[0]?.title?.length > 60) || [],
    [crawlData],
  );
  const lowContentPages = useMemo(
    () =>
      crawlData?.filter((page) =>
        Array.isArray(page?.text_ratio)
          ? page.text_ratio.every((obj) => obj.text_ratio < 50)
          : page?.text_ratio < 50,
      ) || [],
    [crawlData],
  );
  const missingH1 = useMemo(
    () => crawlData?.filter((page) => !page?.headings?.h1) || [],
    [crawlData],
  );
  const missingH2 = useMemo(
    () => crawlData?.filter((page) => !page?.headings?.h2) || [],
    [crawlData],
  );
  const missingSchema = useMemo(
    () => crawlData?.filter((page) => !page?.schema) || [],
    [crawlData],
  );
  const imagesAbove100KB = useMemo(
    () =>
      crawlData?.filter((page) =>
        page?.images?.Ok?.some((image) => image[2] > 100),
      ) || [],
    [crawlData],
  );

  // Memoized issues array
  const issuesArr = useMemo(
    () => [
      {
        id: 1,
        name: "Missing Page Title",
        issueCount: missingTitles.length,
        priority: "High",
        percentage:
          ((missingTitles.length / (crawlData?.length || 1)) * 100).toFixed(0) +
          "%",
      },
      {
        id: 2,
        name: "Missing Description",
        issueCount: missingDescriptions.length,
        priority: "High",
        percentage:
          (
            (missingDescriptions.length / (crawlData?.length || 1)) *
            100
          ).toFixed(0) + "%",
      },
      {
        id: 3,
        name: "Duplicated Titles",
        issueCount: duplicateTitles?.length || 0,
        priority: "High",
        percentage:
          ((duplicateTitles?.length / (crawlData?.length || 1)) * 100).toFixed(
            0,
          ) + "%",
      },
      {
        id: 4,
        name: "Page Title > 60 Chars",
        issueCount: pageTitlesAbove60Chars.length,
        priority: "Medium",
        percentage:
          (
            (pageTitlesAbove60Chars.length / (crawlData?.length || 1)) *
            100
          ).toFixed(0) + "%",
      },
      {
        id: 5,
        name: "Page Title < 30 Chars",
        issueCount: pagetitleBelow30Chars.length,
        priority: "Medium",
        percentage:
          (
            (pagetitleBelow30Chars?.length / (crawlData?.length || 1)) *
            100
          ).toFixed(0) + "%",
      },
      {
        id: 6,
        name: "Duplicated Descriptions",
        issueCount: duplicateDescriptions?.length || 0,
        priority: "Medium",
        percentage:
          (
            (duplicateDescriptions?.length / (crawlData?.length || 1)) *
            100
          ).toFixed(0) + "%",
      },
      {
        id: 7,
        name: "Descriptions > 160 Chars",
        issueCount: descriptionsAbove160Chars.length,
        priority: "Medium",
        percentage:
          (
            (descriptionsAbove160Chars.length / (crawlData?.length || 1)) *
            100
          ).toFixed(0) + "%",
      },
      {
        id: 8,
        name: "404 Response",
        issueCount: response404?.length || 0,
        priority: "High",
        percentage:
          ((response404?.length / (crawlData?.length || 1)) * 100).toFixed(1) +
            "%" || 0,
      },
      {
        id: 9,
        name: "5XX Response",
        issueCount: response5xx?.length || 0,
        priority: "High",
        percentage:
          ((response5xx?.length / (crawlData?.length || 1)) * 100).toFixed(0) +
          "%",
      },
      {
        id: 10,
        name: "H1 Missing",
        issueCount: missingH1.length,
        priority: "High",
        percentage:
          ((missingH1.length / (crawlData?.length || 1)) * 100).toFixed(0) +
          "%",
      },
      {
        id: 11,
        name: "H2 Missing",
        issueCount: missingH2.length,
        priority: "Low",
        percentage:
          ((missingH2.length / (crawlData?.length || 1)) * 100).toFixed(0) +
          "%",
      },
      {
        id: 12,
        name: "Low Content",
        issueCount: lowContentPages.length,
        priority: "Low",
        percentage:
          ((lowContentPages.length / (crawlData?.length || 1)) * 100).toFixed(
            0,
          ) + "%",
      },
      {
        id: 13,
        name: "Missing Schema",
        issueCount: missingSchema.length,
        priority: "Medium",
        percentage:
          ((missingSchema.length / (crawlData?.length || 1)) * 100).toFixed(0) +
          "%",
      },
      {
        id: 14,
        name: "Large Images",
        issueCount: imagesAbove100KB.length,
        priority: "Medium",
        percentage:
          ((imagesAbove100KB.length / (crawlData?.length || 1)) * 100).toFixed(
            0,
          ) + "%",
      },
    ],
    [
      missingTitles,
      missingDescriptions,
      duplicateTitles,
      pageTitlesAbove60Chars,
      pagetitleBelow30Chars,
      duplicateDescriptions,
      descriptionsAbove160Chars,
      statusCodes,
      response5xx,
      missingH1,
      missingH2,
      lowContentPages,
      missingSchema,
      imagesAbove100KB,
      crawlData,
    ],
  );

  // Memoized sum of issue counts
  const sumIssues = useMemo(() => {
    return issuesArr.reduce(
      (total, issue) => total + (issue.issueCount || 0),
      0,
    );
  }, [issuesArr]);

  // Memoized issue data map for handleIssueClick
  const issueDataMap = useMemo(
    () => ({
      "Missing Page Title": missingTitles,
      "Missing Description": missingDescriptions,
      "Duplicated Titles": duplicateTitles,
      "Page Title > 60 Chars": pageTitlesAbove60Chars,
      "Page Title < 30 Chars": pagetitleBelow30Chars,
      "Duplicated Descriptions": duplicateDescriptions,
      "Descriptions > 160 Chars": descriptionsAbove160Chars,
      "404 Response": response404,
      "5XX Response": response5xx,
      "H1 Missing": missingH1,
      "H2 Missing": missingH2,
      "Low Content": lowContentPages,
      "Missing Schema": missingSchema,
      "Large Images": imagesAbove100KB,
    }),
    [
      missingTitles,
      missingDescriptions,
      duplicateTitles,
      pageTitlesAbove60Chars,
      pagetitleBelow30Chars,
      duplicateDescriptions,
      descriptionsAbove160Chars,
      response404,
      response5xx,
      missingH1,
      missingH2,
      lowContentPages,
      missingSchema,
      imagesAbove100KB,
    ],
  );

  // Set dark mode on mount
  useEffect(() => {
    setIsMode(localStorage.getItem("dark-mode"));
  }, []);

  // Update issues count when sumIssues changes
  useEffect(() => {
    setIssues(sumIssues);
  }, [sumIssues, setIssues]);

  // Memoized click handler
  const handleIssueClick = useCallback(
    (issueName) => {
      setIssueRow(issueName);
      setIssuesView(issueName);
      setGenericChart("");
      setFix(issueName);
      setIssuesData(issueDataMap[issueName] || []);
    },
    [
      setIssueRow,
      setIssuesView,
      setGenericChart,
      setFix,
      setIssuesData,
      issueDataMap,
    ],
  );

  // Empty state
  if (!crawlData || crawlData.length === 0) {
    return (
      <section className="text-xs w-full space-y-1 min-h-[10rem] h-[calc(100vh-39rem)] overflow-y-auto overflow-x-hidden relative flex items-center justify-center">
        <span className="text-xs text-black/50 dark:text-white/50">
          No data. Crawl something
        </span>
      </section>
    );
  }

  return (
    <section
      style={{ width: "100%", scrollbarGutter: "stable", overflowY: "visible" }}
      className="text-xs space-y-1 min-h-[10rem] h-[calc(100vh-39rem)] overflow-y-visible overflow-x-hidden relative"
    >
      <table className="w-full border-collapse border-0 issues dark:text-white text-black  pt-2">
        <thead className="sticky top-0 dark:bg-brand-darker">
          <tr className="text-xs bg-gray-100">
            <th
              scope="col"
              className="p-2 text-left border dark:border-black border-bl"
            >
              Problem
            </th>
            <th align="left" className="p-2 text-left">
              Urls
            </th>
            <th scope="col" className="p-2 text-center dark:border-black">
              %
            </th>
            <th scope="col" className="p-2 text-left">
              Priority
            </th>
          </tr>
        </thead>
        <tbody>
          {issuesArr.map((item) => (
            <IssueRow
              key={item.id}
              item={item}
              isSelected={issueRow === item.name}
              onClick={handleIssueClick}
            />
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default IssuesContainer;
