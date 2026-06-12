// @ts-nocheck
import React, { useEffect, useMemo, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { useFixesStore } from "@/store/FixesStore";
import { ISSUE_REGISTRY } from "./libs/issuesRegistry";
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
  IconShare,
  IconRobot
} from "@tabler/icons-react";

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
  if (lowerName.includes("robots") || lowerName.includes("blocked")) return <IconRobot {...iconProps} className="text-gray-600" />;

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
  const [debouncedCrawlData, setDebouncedCrawlData] = React.useState(() => useGlobalCrawlStore.getState().crawlData);

  React.useEffect(() => {
    // Instead of a timeout that gets constantly cancelled by fast crawlData updates,
    // we use an interval to periodically fetch the latest valid array from the store.
    const timer = setInterval(() => {
      const currentStored = useGlobalCrawlStore.getState().crawlData;
      setDebouncedCrawlData((prev) => {
        // Only update if there is actually new data to avoid unnecessary renders
        if (prev.length !== currentStored.length) {
          return currentStored;
        }
        return prev;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  const robotsBlocked = useGlobalCrawlStore((state) => state.robotsBlocked);
  const setIssues = useGlobalCrawlStore((state) => state.setIssues);
  const issueRow = useGlobalCrawlStore((state) => state.issueRow);
  const setIssueRow = useGlobalCrawlStore((state) => state.setIssueRow);
  const setIssuesData = useGlobalCrawlStore((state) => state.setIssuesData);
  const setIssuesView = useGlobalCrawlStore((state) => state.setIssuesView);
  const setGenericChart = useGlobalCrawlStore((state) => state.setGenericChart);
  const { setFix } = useFixesStore();

  // Compute all issues from the registry
  const issueResults = useMemo(() => {
    const results: Record<string, any[]> = {};
    for (const def of ISSUE_REGISTRY) {
      results[def.name] = def.detect(debouncedCrawlData || [], robotsBlocked);
    }
    return results;
  }, [debouncedCrawlData, robotsBlocked]);

  const totalUrls = debouncedCrawlData?.length || 1;

  const issuesArr = useMemo(() =>
    ISSUE_REGISTRY.map((def) => {
      const urls = issueResults[def.name] || [];
      return {
        id: def.id,
        name: def.name,
        issueCount: urls.length,
        priority: def.priority,
        percentage: ((urls.length / totalUrls) * 100).toFixed(0) + "%",
      };
    }).sort((a, b) => b.issueCount - a.issueCount),
    [issueResults, totalUrls],
  );

  const sumIssues = useMemo(
    () => issuesArr.reduce((total, issue) => total + issue.issueCount, 0),
    [issuesArr],
  );

  useEffect(() => {
    setIssues(sumIssues);
  }, [sumIssues, setIssues]);

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    listen("crawl_complete", (event) => {
      const state = useGlobalCrawlStore.getState();
      const crawlData = state.crawlData || [];
      const blocked = state.robotsBlocked || [];

      const detected: { name: string; count: number; priority: string }[] = [];
      for (const def of ISSUE_REGISTRY) {
        const urls = def.detect(crawlData, blocked);
        if (urls.length > 0) {
          detected.push({
            name: def.name,
            count: urls.length,
            priority: def.priority,
          });
        }
      }

      const report = {
        timestamp: new Date().toISOString(),
        totalUrlsCrawled: crawlData.length,
        totalIssuesFound: detected.reduce((s, d) => s + d.count, 0),
        robotsBlockedUrls: blocked,
        issuesSummary: detected,
      };

      console.log("=== CRAWL COMPLETE - ISSUES REPORT ===");
      console.log("Event payload:", event.payload);
      console.log("Issues Report:", JSON.stringify(report, null, 2));
      console.log("=== END ISSUES REPORT ===");
    }).then((unlistenFn) => {
      unlisten = unlistenFn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const handleIssueClick = useCallback((issueName) => {
    setIssueRow(issueName);
    setIssuesView(issueName);
    setGenericChart("");
    setFix(issueName);
    setIssuesData(issueResults[issueName] || []);
  }, [setIssueRow, setIssuesView, setGenericChart, setFix, setIssuesData, issueResults]);

  if (!debouncedCrawlData || debouncedCrawlData.length === 0) {
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
