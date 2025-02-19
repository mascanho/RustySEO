// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useEffect, useState } from "react";
import useFindDuplicateTitles from "./libs/useDuplicatedTitles";
import useFindDuplicateDescriptions from "./libs/useDuplicatedDescriptions";
import useResponseCodes from "./libs/useResponseCodes";

const IssuesContainer = () => {
  const {
    crawlData,
    setIssues,
    issues,
    statusCodes,
    headingsH1,
    issueRow,
    setIssueRow,
    setISSUESduplicatedTitles,
    setIssuesView,
  } = useGlobalCrawlStore();
  const [isMode, setIsMode] = useState(null);
  // Find duplicates in `crawlData` based on the "title" key
  const duplicateTitles = useFindDuplicateTitles(crawlData, "title");

  // Find duplicates in `crawlData` based on the "description" key
  const duplicateDescriptions = useFindDuplicateDescriptions(
    crawlData,
    "description",
  );

  // Descriptions > 160 characters
  const descriptionsAbove160Chars = crawlData?.filter(
    (page) => page.description && page.description.length > 160,
  );

  // Find pages with a 404 response code in `crawlData`
  const response404 = useResponseCodes(crawlData, 404);

  // Find pages with titles shorter than 30 characters in `crawlData`
  const pagetitleBelow30Chars = crawlData?.filter((page) =>
    page.title?.every((obj) => obj.title.length < 30),
  );

  // Find pages with titles longer than 60 characters in `crawlData`
  const pageTitlesAbove60Chars = crawlData?.filter((page) => {
    page?.[0]?.title?.every((obj) => obj.title.length > 60);
  });

  useEffect(() => {
    const mode = localStorage.getItem("dark-mode");
    setIsMode(mode);
  }, [issueRow]);

  // Prepare issues data
  const issuesArr = [
    {
      id: 1,
      name: "Duplicated Titles",
      issueCount: duplicateTitles?.length > 0 ? duplicateTitles.length : 0,
      priority: "High",
      percentage:
        ((duplicateTitles.length / (crawlData?.length || 1)) * 100).toFixed(1) +
        "%",
    },
    {
      id: 2,
      name: "Page Title > 60 Chars",
      issueCount: pageTitlesAbove60Chars
        ? pageTitlesAbove60Chars?.length
        : 0 || 0,
      priority: "Medium",
      percentage:
        (
          (pageTitlesAbove60Chars?.length / (crawlData?.length || 1)) *
          100
        ).toFixed(1) + "%",
    },
    {
      id: 3,
      name: "Page Title < 30 Chars",
      issueCount: pagetitleBelow30Chars
        ? pagetitleBelow30Chars?.length
        : 0 || 0,
      priority: "Medium",
      percentage:
        (
          (pagetitleBelow30Chars?.length / (crawlData?.length || 1)) *
          100
        ).toFixed(1) + "%",
    },
    {
      id: 4,
      name: "Duplicated Descriptions",
      issueCount:
        duplicateDescriptions?.length > 0 ? duplicateDescriptions.length : 0,
      priority: "Medium",
      percentage:
        (
          (duplicateDescriptions.length / (crawlData?.length || 1)) *
          100
        ).toFixed(1) + "%",
    },
    {
      id: 5,
      name: "Descriptions > 160 Chars",
      issueCount: descriptionsAbove160Chars
        ? descriptionsAbove160Chars?.length
        : 0 || 0,
      priority: "Medium",
      percentage:
        (
          (descriptionsAbove160Chars?.length / (crawlData?.length || 1)) *
          100
        ).toFixed(1) + "%",
    },
    {
      id: 6,
      name: "404 Response",
      issueCount: statusCodes?.length > 0 ? statusCodes?.[3]?.count : 0,
      priority: "High",
      percentage:
        ((statusCodes?.[3]?.count / (crawlData?.length || 1)) * 100).toFixed(
          1,
        ) + "%",
    },
    {
      id: 7,
      name: "H1 Missing",
      issueCount: headingsH1?.length > 0 ? headingsH1?.[1]?.count : 0,
      priority: "High",
      percentage:
        ((headingsH1?.[1]?.count / (crawlData?.length || 1)) * 100).toFixed(1) +
        "%",
    },
  ];

  // useEffect(() => {
  //   setIssues([duplicateTitles, duplicateDescriptions, response404]);
  // }, [crawlData]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setIssues(issuesArr);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [crawlData]);

  // Hnadle click on the rows
  const handleIssueClick = (issueName, index) => {
    setIssueRow(issueName);
    console.log(issueName);
    setIssuesView(issueName);
  };

  if (crawlData.length === 0) {
    return (
      <section className="text-xs w-full space-y-1 min-h-[10rem] h-[calc(100vh-39rem)] overflow-y-auto overflow-x-hidden relative flex items-center justify-center">
        <span className="text-xs text-black/50 dark:text-white/50">
          No data. Crawl something
        </span>
      </section>
    );
  }

  return (
    <section className="text-xs w-full space-y-1 min-h-[10rem] h-[calc(100vh-39rem)] overflow-y-auto overflow-x-hidden relative">
      <table className="w-full border-collapse issues pt-2">
        <thead>
          <tr className="text-xs bg-gray-100 ">
            <th className="p-2 text-left border border-bl">Problem</th>
            <th className="p-2 text-center">Urls</th>
            <th className="p-2 text-left">%</th>
            <th className="p-2 text-left">Priority</th>
          </tr>
        </thead>
        <tbody className="w-full">
          {issuesArr?.map((item, index) => (
            <tr
              onClick={() => handleIssueClick(item.name, index)}
              key={item.id}
              className="cursor-pointer border border-b p-1 text-[9px]"
              style={{
                background:
                  issueRow === item.name || isMode === "true"
                    ? "#2B6CC4"
                    : "white",
                color: issueRow === item.name && "white",
              }}
            >
              <td className="px-2 py-1 dark:bg-brand-darker border text-[9px]">
                {item.name}
              </td>
              <td className="px-2 py-1 dark:bg-brand-darker border">
                {item.issueCount}
              </td>
              <td className="px-2 py-1 dark:bg-brand-darker border">
                {item.percentage}
              </td>
              <td
                className={`px-2 py-1 dark:bg-brand-darker border text-xs font-semibold  text-center ${
                  item.priority === "High"
                    ? "bg-red-400 text-white dark:bg-red-400" // High priority
                    : item.priority === "Medium"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-100" // Medium priority
                      : "bg-green-100 text-green-800 dark:bg-green-100" // Low priority (default)
                }`}
              >
                {item.priority}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default IssuesContainer;
