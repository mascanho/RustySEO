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
  } = useGlobalCrawlStore();
  const [isMode, setIsMode] = useState(null);

  // Find duplicates in `crawlData` based on a key (e.g., "title")
  const duplicateTitles = useFindDuplicateTitles(crawlData, "title");
  const duplicateDescriptions = useFindDuplicateDescriptions(
    crawlData,
    "description",
  );
  const response404 = useResponseCodes(crawlData, 404);

  useEffect(() => {
    const mode = localStorage.getItem("dark-mode");
    setIsMode(mode);
  }, [issueRow]);
  console.log(isMode);

  useEffect(() => {
    setIssues([duplicateTitles, duplicateDescriptions, response404]);
  }, [crawlData]);

  // Prepare issues data
  const issuesArr = [
    {
      name: "Duplicated Titles",
      issueCount: duplicateTitles?.length > 0 ? duplicateTitles.length : 0,
      priority: "High",
      percentage:
        ((duplicateTitles.length / (crawlData?.length || 1)) * 100).toFixed(1) +
        "%",
    },

    {
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
      name: "404 Response",
      issueCount: statusCodes?.length > 0 ? statusCodes?.[3]?.count : 0,
      priority: "High",
      percentage:
        ((statusCodes?.[3]?.count / (crawlData?.length || 1)) * 100).toFixed(
          1,
        ) + "%",
    },
    {
      name: "H1: Missing",
      issueCount: headingsH1?.length > 0 ? headingsH1?.[1]?.count : 0,
      priority: "High",
      percentage:
        ((headingsH1?.[1]?.count / (crawlData?.length || 1)) * 100).toFixed(1) +
        "%",
    },
  ];

  const handleIssueClick = (issueName) => {
    setIssueRow(issueName);
  };

  return (
    <table className="w-full border-collapse issues">
      <thead>
        <tr className="text-xs bg-gray-100 ">
          <th className="p-2 text-left border border-bl">Problem</th>
          <th className="p-2 text-center">Urls</th>
          <th className="p-2 text-left">%</th>
          <th className="p-2 text-left">Priority</th>
        </tr>
      </thead>
      <tbody>
        {issuesArr?.map((item, index) => (
          <tr
            onClick={() => handleIssueClick(item.name)}
            key={index}
            className="cursor-pointer border border-b p-1"
            style={{
              background:
                issueRow === item.name || isMode === "true"
                  ? "#2B6CC4"
                  : "white",
              color: issueRow === item.name && "white",
            }}
          >
            <td className="px-2 py-1 dark:bg-brand-darker border">
              {item.name}
            </td>
            <td className="px-2 py-1 dark:bg-brand-darker border">
              {item.issueCount}
            </td>
            <td className="px-2 py-1 dark:bg-brand-darker border">
              {item.percentage}
            </td>
            <td className="px-2 py-1 dark:bg-brand-darker border">
              <span
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  item.priority === "High"
                    ? "bg-red-100 text-red-800" // High priority
                    : item.priority === "Medium"
                      ? "bg-yellow-100 text-yellow-800" // Medium priority
                      : "bg-green-100 text-green-800" // Low priority (default)
                }`}
              >
                {item.priority}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default IssuesContainer;
