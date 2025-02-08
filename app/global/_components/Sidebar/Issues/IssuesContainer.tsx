// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useEffect } from "react";
import useFindDuplicateTitles from "./libs/useDuplicatedTitles";
import useFindDuplicateDescriptions from "./libs/useDuplicatedDescriptions";
import useResponseCodes from "./libs/useResponseCodes";

const IssuesContainer = () => {
  const { crawlData, setIssues, issues, statusCodes, headingsH1 } =
    useGlobalCrawlStore();

  // Find duplicates in `crawlData` based on a key (e.g., "title")
  const duplicateTitles = useFindDuplicateTitles(crawlData, "title");
  const duplicateDescriptions = useFindDuplicateDescriptions(
    crawlData,
    "description",
  );

  useEffect(() => {
    setIssues({
      duplicateTitles,
      duplicateDescriptions,
    });
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

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="text-xs bg-gray-100 border">
          <th className="p-2 text-left border border-bl">Problem</th>
          <th className="p-2 text-left">Urls</th>
          <th className="p-2 text-left">%</th>
          <th className="p-2 text-left">Priority</th>
        </tr>
      </thead>
      <tbody>
        {issuesArr?.map((item, index) => (
          <tr
            onClick={() => console.log("Clicked on issue", item.name)}
            key={index}
            className="border-b cursor-pointer"
          >
            <td className="p-2">{item.name}</td>
            <td className="p-2">{item.issueCount}</td>
            <td className="p-2">{item.percentage}</td>
            <td className="p-2">
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
