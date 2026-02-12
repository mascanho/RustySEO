// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React, { useMemo, useEffect, memo, useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

interface SecurityCounts {
  https: number; // Number of HTTPS URLs
  http: number; // Number of HTTP URLs
  mixedContent: number; // Pages with both HTTP and HTTPS resources
  unsafeAnchors: number; // Pages with unsafe cross-origin links
  insecureIframes: number; // Iframes without sandbox
  missingCors: number; // Resources missing crossorigin attribute
  inlineScripts: number; // Inline scripts with potential risks
}

interface Section {
  label: string;
  count: number;
  percentage: string;
}

const Security = () => {
  const { crawlData, setSecurityData } = useGlobalCrawlStore();
  const [isOpen, setIsOpen] = useState(false);

  // Ensure crawlData is always an array
  const safeCrawlData = useMemo(
    () => (Array.isArray(crawlData) ? crawlData : []),
    [crawlData],
  );

  // Memoize security analysis
  const { counts, totalPages } = useMemo(() => {
    let httpsCount = 0;
    let httpCount = 0;
    let mixedContentCount = 0;
    let unsafeAnchorsCount = 0;
    let insecureIframesCount = 0;
    let missingCorsCount = 0;
    let inlineScriptsCount = 0;

    safeCrawlData.forEach((item) => {
      // Count HTTPS vs HTTP
      if (item.https === true) {
        httpsCount++;
      } else if (item.https === false) {
        httpCount++;
      }

      // Check for mixed content (pre-calculated by backend)
      if (item.security?.total_mixed_content > 0) {
        mixedContentCount++;
      }

      // Add cross-origin security metrics
      if (item.security) {
        unsafeAnchorsCount += item.security.total_unsafe_anchors || 0;
        insecureIframesCount += item.security.total_insecure_iframes || 0;
        missingCorsCount += item.security.total_missing_cors || 0;
        inlineScriptsCount += item.security.total_inline_scripts || 0;
      }
    });

    const counts: SecurityCounts = {
      https: httpsCount,
      http: httpCount,
      mixedContent: mixedContentCount,
      unsafeAnchors: unsafeAnchorsCount,
      insecureIframes: insecureIframesCount,
      missingCors: missingCorsCount,
      inlineScripts: inlineScriptsCount,
    };

    return {
      counts,
      totalPages: safeCrawlData.length,
    };
  }, [safeCrawlData]);

  // Memoize sections to avoid recalculating on every render
  const sections: Section[] = useMemo(() => {
    const calculatePercentage = (count: number, total: number): string => {
      if (!total) return "0%";
      return `${Math.min((count / total) * 100, 100).toFixed(0)}%`;
    };

    return [
      {
        label: "HTTPS URLs",
        count: counts.https,
        percentage: calculatePercentage(counts.https, totalPages),
      },
      {
        label: "HTTP URLs",
        count: counts.http,
        percentage: calculatePercentage(counts.http, totalPages),
      },
      {
        label: "Mixed Content",
        count: counts.mixedContent,
        percentage: calculatePercentage(counts.mixedContent, counts.https),
      },
      {
        label: "Unsafe Anchors",
        count: counts.unsafeAnchors,
        percentage: calculatePercentage(counts.unsafeAnchors, totalPages),
      },
      {
        label: "Insecure Iframes",
        count: counts.insecureIframes,
        percentage: calculatePercentage(counts.insecureIframes, totalPages),
      },
      // {
      //   label: "Missing CORS",
      //   count: counts.missingCors,
      //   percentage: calculatePercentage(counts.missingCors, totalPages),
      // },
      {
        label: "Inline Scripts",
        count: counts.inlineScripts,
        percentage: calculatePercentage(counts.inlineScripts, totalPages),
      },
    ];
  }, [counts, totalPages]);

  // Update security data state when sections change
  useEffect(() => {
    if (typeof setSecurityData === "function") {
      setSecurityData(sections);
    }
  }, [sections, setSecurityData]);

  return (
    <div className="text-xs w-full">
      <div className="w-full cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="text-xs font-semibold border-b dark:border-b-brand-dark pl-1 p-1 flex items-center">
          <span className="">
            {isOpen ? (
              <FiChevronDown size={14} />
            ) : (
              <FiChevronRight size={14} />
            )}
          </span>
          <span className="ml-1">Security</span>
        </div>
      </div>

      {isOpen && (
        <div className="w-full">
          {sections.map(({ label, count, percentage }) => (
            <div
              key={label}
              className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark"
            >
              <div className="w-2/3 pl-2.5 py-1 text-brand-bright">{label}</div>
              <div className="w-1/6 text-right pr-2">{count}</div>
              <div className="w-1/6 text-center pl-2">{percentage}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(Security);
