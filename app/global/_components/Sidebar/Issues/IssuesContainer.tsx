// @ts-nocheck
import React, { useEffect, useMemo, useCallback } from "react";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import useFindDuplicateTitles from "./libs/useDuplicatedTitles";
import useFindDuplicateDescriptions from "./libs/useDuplicatedDescriptions";
import useResponseCodes from "./libs/useResponseCodes";
import { useFixesStore } from "@/store/FixesStore";
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
  IconPhoto,
  IconLockOff,
  IconRoute,
  IconEyeOff,
  IconClock,
  IconMaximize,
  IconLink,
  IconShieldExclamation,
  IconHierarchy2,
  IconShare
} from "@tabler/icons-react";

// Import new modularized hooks
import { useMultipleH1, useMissingH1, useMissingH2 } from "./libs/useHeadingsIssues";
import { useCanonicalsMissing, useCanonicalMismatch } from "./libs/useCanonicalIssues";
import { useNoIndex, useNoFollow } from "./libs/useIndexabilityIssues";
import { useMissingAltText, useBrokenImages, useLargeImages } from "./libs/useImageIssues";
import { useSlowPages, useLargeHTML } from "./libs/usePerformanceIssues";
import { useShortContent } from "./libs/useContentIssues";
import { useNotHttps } from "./libs/useHttpsIssues";
import { useLongRedirectChains } from "./libs/useRedirectIssues";

const getIssueIcon = (name) => {
  const iconProps = { size: 16, className: "flex-none" };
  const lowerName = name.toLowerCase();

  if (lowerName.includes("title")) return <IconLetterT {...iconProps} className="text-blue-500" />;
  if (lowerName.includes("description")) return <IconFileDescription {...iconProps} className="text-cyan-500" />;
  if (lowerName.includes("404") || lowerName.includes("broken")) return <IconLinkOff {...iconProps} className="text-red-500" />;
  if (lowerName.includes("5xx")) return <IconServerOff {...iconProps} className="text-red-600" />;
  if (lowerName.includes("h1") || lowerName.includes("h2")) return <IconHeading {...iconProps} className="text-purple-500" />;
  if (lowerName.includes("content") || lowerName.includes("word count")) return <IconFileText {...iconProps} className="text-amber-500" />;
  if (lowerName.includes("schema")) return <IconLayout {...iconProps} className="text-emerald-500" />;
  if (lowerName.includes("image")) return <IconPhoto {...iconProps} className="text-orange-500" />;
  if (lowerName.includes("https") || lowerName.includes("security")) return <IconLockOff {...iconProps} className="text-red-400" />;
  if (lowerName.includes("redirect")) return <IconRoute {...iconProps} className="text-yellow-500" />;
  if (lowerName.includes("noindex") || lowerName.includes("nofollow")) return <IconEyeOff {...iconProps} className="text-gray-500" />;
  if (lowerName.includes("canonical")) return <IconLink {...iconProps} className="text-indigo-500" />;
  if (lowerName.includes("slow") || lowerName.includes("performance")) return <IconClock {...iconProps} className="text-rose-500" />;
  if (lowerName.includes("large") || lowerName.includes("size")) return <IconMaximize {...iconProps} className="text-slate-500" />;
  if (lowerName.includes("nested") || lowerName.includes("depth")) return <IconHierarchy2 {...iconProps} className="text-pink-500" />;
  if (lowerName.includes("opengraph") || lowerName.includes("social")) return <IconShare {...iconProps} className="text-blue-400" />;

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

  // Basic SEO Issues
  const missingTitles = useMemo(() => crawlData?.filter((page) => !page?.title?.[0]?.title) || [], [crawlData]);
  const missingDescriptions = useMemo(() => crawlData?.filter((page) => !page?.description || page?.description === "") || [], [crawlData]);
  const duplicateTitles = useFindDuplicateTitles(crawlData);
  const duplicateDescriptions = useFindDuplicateDescriptions(crawlData);
  const descriptionsAbove160Chars = useMemo(() => crawlData?.filter((page) => page?.description?.length > 160) || [], [crawlData]);
  const pagetitleBelow30Chars = useMemo(() => crawlData?.filter((page) => page?.title?.[0]?.title?.length < 30) || [], [crawlData]);
  const pageTitlesAbove60Chars = useMemo(() => crawlData?.filter((page) => page?.title?.[0]?.title?.length > 60) || [], [crawlData]);

  // Status Code Issues
  const response404 = useResponseCodes(crawlData, 404);
  const response5xx = useResponseCodes(crawlData, 500);

  // Modularized Issues
  const multipleH1 = useMultipleH1(crawlData);
  const missingH1 = useMissingH1(crawlData);
  const missingH2 = useMissingH2(crawlData);
  const canonicalsMissing = useCanonicalsMissing(crawlData);
  const canonicalMismatch = useCanonicalMismatch(crawlData);
  const noIndex = useNoIndex(crawlData);
  const noFollow = useNoFollow(crawlData);
  const missingAltText = useMissingAltText(crawlData);
  const brokenImages = useBrokenImages(crawlData);
  const largeImages = useLargeImages(crawlData);
  const slowPages = useSlowPages(crawlData);
  const largeHTML = useLargeHTML(crawlData);
  const shortContent = useShortContent(crawlData);
  const notHttps = useNotHttps(crawlData);
  const longRedirectChains = useLongRedirectChains(crawlData);
  const deepLinks = useMemo(() => crawlData?.filter((page) => page?.url_depth > 5) || [], [crawlData]);
  const missingOG = useMemo(() => crawlData?.filter((page) => !page?.opengraph || Object.keys(page.opengraph).length === 0) || [], [crawlData]);

  // Existing ad-hoc filters
  const missingSchema = useMemo(() => crawlData?.filter((page) => !page?.schema) || [], [crawlData]);

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
    { id: 12, name: "Multiple H1 tags", issueCount: multipleH1.length, priority: "Medium" },
    { id: 13, name: "Canonical Missing", issueCount: canonicalsMissing.length, priority: "Medium" },
    { id: 14, name: "Canonical Mismatch", issueCount: canonicalMismatch.length, priority: "Medium" },
    { id: 15, name: "NoIndex Pages", issueCount: noIndex.length, priority: "Medium" },
    { id: 16, name: "NoFollow Pages", issueCount: noFollow.length, priority: "Medium" },
    { id: 17, name: "Images Missing Alt Text", issueCount: missingAltText.length, priority: "Low" },
    { id: 18, name: "Broken Images", issueCount: brokenImages.length, priority: "High" },
    { id: 19, name: "Large Images (>100KB)", issueCount: largeImages.length, priority: "Medium" },
    { id: 20, name: "Slow Response (>2s)", issueCount: slowPages.length, priority: "High" },
    { id: 21, name: "Large HTML Page (>100KB)", issueCount: largeHTML.length, priority: "Low" },
    { id: 22, name: "Thin Content (<300 words)", issueCount: shortContent.length, priority: "Low" },
    { id: 23, name: "Non-HTTPS Pages", issueCount: notHttps.length, priority: "High" },
    { id: 24, name: "Long Redirect Chains", issueCount: longRedirectChains.length, priority: "Medium" },
    { id: 25, name: "Missing Schema", issueCount: missingSchema.length, priority: "Medium" },
    { id: 26, name: "Deeply Nested URLs (>5 Depth)", issueCount: deepLinks.length, priority: "Low" },
    { id: 27, name: "Missing OpenGraph Tags", issueCount: missingOG.length, priority: "Low" },
  ].map(issue => ({
    ...issue,
    percentage: ((issue.issueCount / (crawlData?.length || 1)) * 100).toFixed(0) + "%"
  })).sort((a, b) => b.issueCount - a.issueCount),
    [missingTitles, missingDescriptions, duplicateTitles, pageTitlesAbove60Chars, pagetitleBelow30Chars, duplicateDescriptions, descriptionsAbove160Chars, response404, response5xx, missingH1, missingH2, multipleH1, canonicalsMissing, canonicalMismatch, noIndex, noFollow, missingAltText, brokenImages, largeImages, slowPages, largeHTML, shortContent, notHttps, longRedirectChains, missingSchema, deepLinks, missingOG, crawlData]);

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
    "Multiple H1 tags": multipleH1,
    "Canonical Missing": canonicalsMissing,
    "Canonical Mismatch": canonicalMismatch,
    "NoIndex Pages": noIndex,
    "NoFollow Pages": noFollow,
    "Images Missing Alt Text": missingAltText,
    "Broken Images": brokenImages,
    "Large Images (>100KB)": largeImages,
    "Slow Response (>2s)": slowPages,
    "Large HTML Page (>100KB)": largeHTML,
    "Thin Content (<300 words)": shortContent,
    "Non-HTTPS Pages": notHttps,
    "Long Redirect Chains": longRedirectChains,
    "Missing Schema": missingSchema,
    "Deeply Nested URLs (>5 Depth)": deepLinks,
    "Missing OpenGraph Tags": missingOG,
  }), [missingTitles, missingDescriptions, duplicateTitles, pageTitlesAbove60Chars, pagetitleBelow30Chars, duplicateDescriptions, descriptionsAbove160Chars, response404, response5xx, missingH1, missingH2, multipleH1, canonicalsMissing, canonicalMismatch, noIndex, noFollow, missingAltText, brokenImages, largeImages, slowPages, largeHTML, shortContent, notHttps, longRedirectChains, missingSchema, deepLinks, missingOG]);

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
