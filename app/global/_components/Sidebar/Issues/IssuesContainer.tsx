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
    setIssuesData,
    setIssuesView,
    issuesView,
    setGenericChart,
  } = useGlobalCrawlStore();
  const [isMode, setIsMode] = useState(null);

  // Find pages with missing titles
  const missingTitles = crawlData?.filter((page) => page?.title === "");

  // Find pages with missing descriptions
  const missingDescriptions = crawlData?.filter(
    (page) => page?.description === "",
  );

  // Find duplicates in `crawlData` based on the "title" key
  const duplicateTitles = useFindDuplicateTitles(crawlData, "title");

  // Find duplicates in `crawlData` based on the "description" key
  const duplicateDescriptions = useFindDuplicateDescriptions(
    crawlData,
    "description",
  );

  // Descriptions > 160 characters
  const descriptionsAbove160Chars = crawlData?.filter(
    (page) => page?.description?.length > 160,
  );

  // Find pages with a 404 response code in `crawlData`
  const response404 = useResponseCodes(crawlData, 404);

  // PAGES WITH RESPONSE 5XX
  const response5xx = useResponseCodes(crawlData, 500);

  // Find pages with titles shorter than 30 characters in `crawlData`
  const pagetitleBelow30Chars = crawlData?.filter((page) =>
    page.title?.every((obj) => obj?.title.length < 30),
  );

  // Find pages with titles longer than 60 characters in `crawlData`
  const pageTitlesAbove60Chars = crawlData?.filter((page) =>
    page?.title?.every((obj) => obj?.title.length > 60),
  );

  // LOW CONTENT PAGES. WHERE TEXT RATIO IS BELOW 50
  const lowContentPages = crawlData?.filter((page) =>
    page?.text_ratio?.every((obj) => obj.text_ratio < 50),
  );

  const missingH1 = crawlData?.filter(
    (page) => !page?.headings?.hasOwnProperty("h1"),
  );

  // MISSING H2 on the page
  const missingH2 = crawlData?.filter(
    (page) => !page?.headings?.hasOwnProperty("h2"),
  );

  // MISSING SCHEMA
  const missingSchema = crawlData?.filter((page) => !page?.schema);

  // IMAGES BIGGER THAN 100KB
  const imagesAbove100KB = crawlData?.filter((page) =>
    page?.images?.Ok?.some((image) => image[2] > 100),
  );

  useEffect(() => {
    const mode = localStorage.getItem("dark-mode");
    setIsMode(mode);
  }, [issueRow]);

  // Prepare issues data
  const issuesArr = [
    {
      id: 1,
      name: "Missing Page Title",
      issueCount: missingTitles?.length || 0,
      priority: "High",
      percentage:
        ((missingTitles?.length / (crawlData?.length || 1)) * 100).toFixed(1) +
        "%",
    },

    {
      id: 3,
      name: "Duplicated Titles",
      issueCount: duplicateTitles?.length || 0,
      priority: "High",
      percentage:
        ((duplicateTitles.length / (crawlData?.length || 1)) * 100).toFixed(1) +
        "%",
    },
    {
      id: 4,
      name: "Page Title > 60 Chars",
      issueCount: pageTitlesAbove60Chars?.length || 0,
      priority: "Medium",
      percentage:
        (
          (pageTitlesAbove60Chars?.length / (crawlData?.length || 1)) *
          100
        ).toFixed(1) + "%",
    },
    {
      id: 5,
      name: "Page Title < 30 Chars",
      issueCount: pagetitleBelow30Chars?.length || 0,
      priority: "Medium",
      percentage:
        (
          (pagetitleBelow30Chars?.length / (crawlData?.length || 1)) *
          100
        ).toFixed(1) + "%",
    },
    {
      id: 2,
      name: "Missing Description",
      issueCount: missingDescriptions?.length || 0,
      priority: "High",
      percentage:
        (
          (missingDescriptions?.length / (crawlData?.length || 1)) *
          100
        ).toFixed(1) + "%",
    },
    {
      id: 6,
      name: "Duplicated Descriptions",
      issueCount: duplicateDescriptions?.length || 0,
      priority: "Medium",
      percentage:
        (
          (duplicateDescriptions.length / (crawlData?.length || 1)) *
          100
        ).toFixed(1) + "%",
    },
    {
      id: 7,
      name: "Descriptions > 160 Chars",
      issueCount: descriptionsAbove160Chars?.length || 0,
      priority: "Medium",
      percentage:
        (
          (descriptionsAbove160Chars?.length / (crawlData?.length || 1)) *
          100
        ).toFixed(1) + "%",
    },
    {
      id: 8,
      name: "404 Response",
      issueCount: statusCodes?.[3]?.count || 0,
      priority: "High",
      percentage:
        ((statusCodes?.[3]?.count / (crawlData?.length || 1)) * 100).toFixed(
          1,
        ) + "%",
    },
    {
      id: 9,
      name: "5XX Response",
      issueCount: response5xx?.length || 0,
      priority: "High",
      percentage:
        ((response5xx?.length / (crawlData?.length || 1)) * 100).toFixed(1) +
        "%",
    },
    {
      id: 10,
      name: "H1 Missing",
      issueCount: missingH1?.length || 0,
      priority: "High",
      percentage:
        ((headingsH1?.[1]?.count / (crawlData?.length || 1)) * 100).toFixed(1) +
        "%",
    },
    {
      id: 11,
      name: "H2 Missing",
      issueCount: missingH2?.length || 0,
      priority: "Low",
      percentage:
        ((missingH2.length / (crawlData?.length || 1)) * 100).toFixed(1) + "%",
    },
    {
      id: 12,
      name: "Low Content",
      issueCount: lowContentPages?.length || 0,
      priority: "Low",
      percentage:
        ((lowContentPages?.length / (crawlData?.length || 1)) * 100).toFixed(
          1,
        ) + "%",
    },
    {
      id: 13,
      name: "Missing Schema",
      issueCount: missingSchema?.length || 0,
      priority: "Medium",
      percentage:
        ((missingSchema?.length / (crawlData?.length || 1)) * 100).toFixed(1) +
        "%",
    },
    {
      id: 14,
      name: "Large Images",
      issueCount: imagesAbove100KB?.length || 0,
      priority: "Medium",
      percentage:
        ((imagesAbove100KB?.length / (crawlData?.length || 1)) * 100).toFixed(
          1,
        ) + "%",
    },
  ];

  useEffect(() => {
    const handler = setTimeout(() => {
      setIssues(issuesArr);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [crawlData, issuesArr]); // Add dependencies to prevent unnecessary re-renders

  // Handle click on the rows
  const handleIssueClick = (issueName) => {
    setIssueRow(issueName);
    setIssuesView(issueName);
    setGenericChart("");

    const issueDataMap = {
      "Missing Page Title": missingTitles,
      "Duplicated Titles": duplicateTitles,
      "Page Title > 60 Chars": pageTitlesAbove60Chars,
      "Page Title < 30 Chars": pagetitleBelow30Chars,
      "Missing Description": missingDescriptions,
      "Duplicated Descriptions": duplicateDescriptions,
      "Descriptions > 160 Chars": descriptionsAbove160Chars,
      "404 Response": response404,
      "5XX Response": response5xx,
      "H1 Missing": missingH1,
      "H2 Missing": missingH2,
      "Low Content": lowContentPages,
      "Missing Schema": missingSchema,
      "Large Images": imagesAbove100KB,
    };

    setIssuesData(issueDataMap[issueName] || []);
  };

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
    <section className="text-xs w-full space-y-1 min-h-[10rem]  h-[calc(100vh-39rem)] overflow-y-auto overflow-x-hidden relative">
      <table className="w-full border-collapse issues pt-2 ">
        <thead className="sticky top-0 dark:bg-brand-darker ">
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
        <tbody className="w-full">
          {issuesArr?.map((item, index) => (
            <tr
              key={item.id}
              onClick={() => handleIssueClick(item.name)}
              className="cursor-pointer border border-b p-1 text-[9px]"
              style={{
                color: issuesView !== item.name ? "#f5f5f5" : "",
                color: issueRow === item.name ? "#2B6CC4" : "",
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
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default IssuesContainer;
