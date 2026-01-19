// @ts-nocheck
import React, { useEffect, useState, useMemo, useCallback } from "react";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import useFindDuplicateTitles from "./libs/useDuplicatedTitles";
import useFindDuplicateDescriptions from "./libs/useDuplicatedDescriptions";
import useResponseCodes from "./libs/useResponseCodes";
import { useFixesStore } from "@/store/FixesStore";
import useGlobalConsoleStore from "@/store/GlobalConsoleLog";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconInfoCircle,
  IconFileText,
  IconLetterT,
  IconFileDescription,
  IconLinkOff,
  IconServerOff,
  IconHeading,
  IconLayout,
  IconPhoto
} from "@tabler/icons-react";

const getIssueIcon = (name) => {
  const iconProps = { size: 16, className: "flex-none" };
  if (name.includes("Title")) return <IconLetterT {...iconProps} className="text-blue-500" />;
  if (name.includes("Description")) return <IconFileDescription {...iconProps} className="text-cyan-500" />;
  if (name.includes("404")) return <IconLinkOff {...iconProps} className="text-red-500" />;
  if (name.includes("5XX")) return <IconServerOff {...iconProps} className="text-red-600" />;
  if (name.includes("H1") || name.includes("H2")) return <IconHeading {...iconProps} className="text-purple-500" />;
  if (name.includes("Content")) return <IconFileText {...iconProps} className="text-amber-500" />;
  if (name.includes("Schema")) return <IconLayout {...iconProps} className="text-emerald-500" />;
  if (name.includes("Images")) return <IconPhoto {...iconProps} className="text-orange-500" />;
  return <IconInfoCircle {...iconProps} />;
};

const PriorityBadge = ({ priority }) => {
  const styles = {
    High: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30",
    Medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
    Low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
  };

  const icons = {
    High: <IconAlertCircle size={10} />,
    Medium: <IconAlertTriangle size={10} />,
    Low: <IconInfoCircle size={10} />
  };

  return (
    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${styles[priority]}`}>
      {icons[priority]}
      {priority}
    </span>
  );
};

const IssueRow = React.memo(({ item, isSelected, onClick }) => (
  <div
    onClick={() => onClick(item.name)}
    className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 border ${isSelected
      ? "bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30 shadow-sm"
      : "bg-white dark:bg-brand-dark/40 border-gray-100 dark:border-brand-dark hover:bg-gray-50 dark:hover:bg-brand-dark/60"
      }`}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className={`p-1.5 rounded-md ${isSelected ? 'bg-white dark:bg-brand-dark shadow-sm' : 'bg-gray-50 dark:bg-brand-dark/30 group-hover:bg-white dark:group-hover:bg-brand-dark'}`}>
        {getIssueIcon(item.name)}
      </div>
      <div className="flex flex-col min-w-0">
        <span className={`text-[11px] truncate font-medium ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>
          {item.name}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 dark:text-gray-400">{item.issueCount} URLs affected</span>
          <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{item.percentage}</span>
        </div>
      </div>
    </div>
    <div className="flex-none ml-2">
      <PriorityBadge priority={item.priority} />
    </div>
  </div>
));

IssueRow.displayName = "IssueRow";

const IssuesContainer = () => {
  const crawlData = useGlobalCrawlStore((state) => state.crawlData);
  const setIssues = useGlobalCrawlStore((state) => state.setIssues);
  const issueRow = useGlobalCrawlStore((state) => state.issueRow);
  const setIssueRow = useGlobalCrawlStore((state) => state.setIssueRow);
  const setIssuesData = useGlobalCrawlStore((state) => state.setIssuesData);
  const setIssuesView = useGlobalCrawlStore((state) => state.setIssuesView);
  const setGenericChart = useGlobalCrawlStore((state) => state.setGenericChart);
  const { setFix } = useFixesStore();

  const missingTitles = useMemo(() => crawlData?.filter((page) => !page?.title || page?.title === "") || [], [crawlData]);
  const missingDescriptions = useMemo(() => crawlData?.filter((page) => !page?.description || page?.description === "") || [], [crawlData]);
  const duplicateTitles = useFindDuplicateTitles(crawlData, "title");
  const duplicateDescriptions = useFindDuplicateDescriptions(crawlData, "description");
  const descriptionsAbove160Chars = useMemo(() => crawlData?.filter((page) => page?.description?.length > 160) || [], [crawlData]);
  const response404 = useResponseCodes(crawlData, 404);
  const response5xx = useResponseCodes(crawlData, 500);
  const pagetitleBelow30Chars = useMemo(() => crawlData?.filter((page) => page?.title?.[0]?.title?.length < 30) || [], [crawlData]);
  const pageTitlesAbove60Chars = useMemo(() => crawlData?.filter((page) => page?.title?.[0]?.title?.length > 60) || [], [crawlData]);
  const lowContentPages = useMemo(() =>
    crawlData?.filter((page) =>
      Array.isArray(page?.text_ratio)
        ? page.text_ratio.every((obj) => obj.text_ratio < 50)
        : (page?.text_ratio || 0) < 50
    ) || [], [crawlData]);
  const missingH1 = useMemo(() => crawlData?.filter((page) => !page?.headings?.h1) || [], [crawlData]);
  const missingH2 = useMemo(() => crawlData?.filter((page) => !page?.headings?.h2) || [], [crawlData]);
  const missingSchema = useMemo(() => crawlData?.filter((page) => !page?.schema) || [], [crawlData]);
  const imagesAbove100KB = useMemo(() => crawlData?.filter((page) => page?.images?.Ok?.some((image) => image[2] > 100)) || [], [crawlData]);

  const issuesArr = useMemo(() => [
    { id: 1, name: "Missing Page Title", issueCount: missingTitles.length, priority: "High" },
    { id: 2, name: "Missing Description", issueCount: missingDescriptions.length, priority: "High" },
    { id: 3, name: "Duplicated Titles", issueCount: duplicateTitles?.length || 0, priority: "High" },
    { id: 4, name: "Page Title > 60 Chars", issueCount: pageTitlesAbove60Chars.length, priority: "Medium" },
    { id: 5, name: "Page Title < 30 Chars", issueCount: pagetitleBelow30Chars.length, priority: "Medium" },
    { id: 6, name: "Duplicated Descriptions", issueCount: duplicateDescriptions?.length || 0, priority: "Medium" },
    { id: 7, name: "Descriptions > 160 Chars", issueCount: descriptionsAbove160Chars.length, priority: "Medium" },
    { id: 8, name: "404 Response", issueCount: response404?.length || 0, priority: "High" },
    { id: 9, name: "5XX Response", issueCount: response5xx?.length || 0, priority: "High" },
    { id: 10, name: "H1 Missing", issueCount: missingH1.length, priority: "High" },
    { id: 11, name: "H2 Missing", issueCount: missingH2.length, priority: "Low" },
    { id: 12, name: "Low Content", issueCount: lowContentPages.length, priority: "Low" },
    { id: 13, name: "Missing Schema", issueCount: missingSchema.length, priority: "Medium" },
    { id: 14, name: "Large Images", issueCount: imagesAbove100KB.length, priority: "Medium" },
  ].map(issue => ({
    ...issue,
    percentage: ((issue.issueCount / (crawlData?.length || 1)) * 100).toFixed(0) + "%"
  })).sort((a, b) => b.issueCount - a.issueCount),
    [missingTitles, missingDescriptions, duplicateTitles, pageTitlesAbove60Chars, pagetitleBelow30Chars, duplicateDescriptions, descriptionsAbove160Chars, response404, response5xx, missingH1, missingH2, lowContentPages, missingSchema, imagesAbove100KB, crawlData]);

  const sumIssues = useMemo(() => issuesArr.reduce((total, issue) => total + (issue.issueCount || 0), 0), [issuesArr]);

  const issueDataMap = useMemo(() => ({
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
  }), [missingTitles, missingDescriptions, duplicateTitles, pageTitlesAbove60Chars, pagetitleBelow30Chars, duplicateDescriptions, descriptionsAbove160Chars, response404, response5xx, missingH1, missingH2, lowContentPages, missingSchema, imagesAbove100KB]);

  useEffect(() => {
    setIssues(sumIssues);
  }, [sumIssues, setIssues]);

  const handleIssueClick = useCallback((issueName) => {
    setIssueRow(issueName);
    setIssuesView(issueName);
    setGenericChart("");
    setFix(issueName);
    setIssuesData(issueDataMap[issueName] || []);
  }, [setIssueRow, setIssuesView, setGenericChart, setFix, setIssuesData, issueDataMap]);

  if (!crawlData || crawlData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full opacity-50 dark:text-white">
        <IconAlertCircle size={48} className="mb-2 text-gray-300 dark:text-gray-600" />
        <span className="text-sm font-medium">No crawl results.</span>
        <span className="text-[10px]">Crawl a domain to see issues.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-brand-darker overflow-hidden">
      <div className="p-3 border-b dark:border-brand-dark bg-gray-50/50 dark:bg-brand-dark/20 flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-sm font-bold dark:text-white">Issue Explorer</h2>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">Found {sumIssues} potential improvements</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2 custom-scrollbar">
        <div className="space-y-1.5 pb-4">
          {issuesArr.filter(i => i.issueCount > 0).map((item) => (
            <IssueRow
              key={item.id}
              item={item}
              isSelected={issueRow === item.name}
              onClick={handleIssueClick}
            />
          ))}

          {issuesArr.every(i => i.issueCount === 0) && (
            <div className="text-center py-12">
              <span className="text-xs text-green-500 font-medium">✅ No issues found! Excellent work.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssuesContainer;
