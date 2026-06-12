// @ts-nocheck
import React, {
  useMemo,
  memo,
  useCallback,
  useEffect,
  useState,
  useReducer,
  useRef,
} from "react";
import debounce from "lodash.debounce";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { invoke } from "@tauri-apps/api/core";

import { FiChevronDown, FiChevronRight, FiChevronUp } from "react-icons/fi";

interface CrawlDataItem {
  internal_links_count?: number;
  external_links_count?: number;
  indexability?: {
    indexability?: number;
  };
}

interface SummaryItem {
  label: string;
  value: number | string;
  percentage: string;
  loading?: boolean;
}

interface BackendStats {
  pages: number;
  total_internal_links: number;
  total_external_links: number;
  total_links: number;
  indexable_pages: number;
  not_indexable_pages: number;
}

const SummaryItemRow: React.FC<SummaryItem> = memo(
  ({ label, value, percentage, loading }) => (
    <div className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark">
      <div className="w-2/3 pl-2.5 py-1 text-brand-bright">{label}</div>
      <div className="w-1/6 text-right pr-2">
        {loading ? (
          <span className="inline-block w-4 animate-pulse">...</span>
        ) : (
          value
        )}
      </div>
      <div className="w-1/6 text-right pr-2">
        {loading ? (
          <span className="inline-block w-4 animate-pulse">...</span>
        ) : (
          percentage
        )}
      </div>
    </div>
  ),
);

SummaryItemRow.displayName = "SummaryItemRow";

type State = {
  internalLinks: number;
  externalLinks: number;
  totalIndexablePages: number;
  isProcessing: boolean;
};

type Action = {
  type: "UPDATE_DATA";
  payload: CrawlDataItem[];
};

const initialState: State = {
  internalLinks: 0,
  externalLinks: 0,
  totalIndexablePages: 0,
  isProcessing: false,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "UPDATE_DATA":
      let internalLinks = 0;
      let externalLinks = 0;
      let totalIndexablePages = 0;

      for (const item of action.payload) {
        internalLinks += item?.internal_links_count || 0;
        externalLinks += item?.external_links_count || 0;
        if ((item?.indexability?.indexability || 0) > 0.5) {
          totalIndexablePages++;
        }
      }

      return {
        internalLinks,
        externalLinks,
        totalIndexablePages,
        isProcessing: false,
      };
    default:
      return state;
  }
};

const Summary: React.FC = () => {
  const crawlData = useGlobalCrawlStore((state) => state.crawlData);
  const isFinishedDeepCrawl = useGlobalCrawlStore(
    (state) => state.isFinishedDeepCrawl,
  );
  const setSummary = useGlobalCrawlStore((state) => state.setSummary);
  const domainCrawlLoading = useGlobalCrawlStore(
    (state) => state.domainCrawlLoading,
  );
  const streamedCrawledPages = useGlobalCrawlStore(
    (state) => state.streamedCrawledPages,
  );
  const streamedTotalPages = useGlobalCrawlStore(
    (state) => state.streamedTotalPages,
  );
  const [state, dispatch] = useReducer(reducer, initialState);
  const [backendStats, setBackendStats] = useState<BackendStats | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isFetching = useRef(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stableCrawlData = useMemo(() => crawlData || [], [crawlData]);
  const isCrawling = domainCrawlLoading && !isFinishedDeepCrawl;

  // Fetch real stats from SQLite via backend
  const fetchBackendStats = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const stats: BackendStats = await invoke(
        "get_crawl_summary_stats_command",
      );
      if (stats && typeof stats.pages === "number") {
        setBackendStats(stats);
      }
    } catch (e) {
      // Silently fall back to crawlData-based stats
    } finally {
      isFetching.current = false;
    }
  }, []);

  // Fetch backend stats once when crawl completes
  useEffect(() => {
    if (isFinishedDeepCrawl) {
      fetchBackendStats();
    }
  }, [isFinishedDeepCrawl, fetchBackendStats]);

  // Stable debounced update function
  const debouncedUpdate = useCallback(
    debounce((data: CrawlDataItem[]) => {
      dispatch({ type: "UPDATE_DATA", payload: data });
    }, 300),
    [],
  );

  // Update global summary
  useEffect(() => {
    if (!state.isProcessing) {
      if (backendStats) {
        // Use accurate backend stats
        setSummary({
          totalPagesCrawled: backendStats.pages,
          totalInternalLinks: backendStats.total_internal_links,
          totalExternalLinks: backendStats.total_external_links,
          totalLinksFound: backendStats.total_links,
          notIndexablePages: backendStats.not_indexable_pages,
          indexablePages: backendStats.indexable_pages,
        });
      } else {
        // Fall back to live crawlData computation
        setSummary({
          totalPagesCrawled: stableCrawlData.length,
          totalInternalLinks: state.internalLinks,
          totalExternalLinks: state.externalLinks,
          totalLinksFound: state.internalLinks + state.externalLinks,
          notIndexablePages:
            stableCrawlData.length - state.totalIndexablePages,
          indexablePages: state.totalIndexablePages,
        });
      }
    }
  }, [state, stableCrawlData, setSummary, backendStats]);

  // Trigger debounced update when crawlData changes
  useEffect(() => {
    debouncedUpdate(stableCrawlData);
    return () => debouncedUpdate.cancel();
  }, [stableCrawlData, debouncedUpdate]);

  // Memoize derived values
  const { totalPagesCrawled, totalNotIndexablePages } = useMemo(() => {
    if (backendStats) {
      return {
        totalPagesCrawled: backendStats.pages,
        totalNotIndexablePages: backendStats.not_indexable_pages,
      };
    }
    const pages = isCrawling
      ? streamedCrawledPages || stableCrawlData.length
      : stableCrawlData.length;
    return {
      totalPagesCrawled: pages,
      totalNotIndexablePages: pages - state.totalIndexablePages,
    };
  }, [
    stableCrawlData,
    state.totalIndexablePages,
    backendStats,
    isCrawling,
    streamedCrawledPages,
  ]);

  const displayInternalLinks = backendStats
    ? backendStats.total_internal_links
    : state.internalLinks;
  const displayExternalLinks = backendStats
    ? backendStats.total_external_links
    : state.externalLinks;
  const displayTotalLinks = backendStats
    ? backendStats.total_links
    : state.internalLinks + state.externalLinks;
  const displayIndexablePages = backendStats
    ? backendStats.indexable_pages
    : state.totalIndexablePages;

  // Memoize summary data
  const summaryData: SummaryItem[] = useMemo(
    () => [
      {
        label: "Pages crawled",
        value: totalPagesCrawled,
        percentage:
          isCrawling && streamedTotalPages
            ? `${((streamedCrawledPages / streamedTotalPages) * 100).toFixed(0)}%`
            : "100%",
        loading: isCrawling && !totalPagesCrawled,
      },
      {
        label: "Total Links Found",
        value: displayTotalLinks,
        percentage: "100%",
        loading: isCrawling && !displayTotalLinks,
      },
      {
        label: "Total Internal Links",
        value: displayInternalLinks,
        percentage:
          displayInternalLinks + displayExternalLinks
            ? `${((displayInternalLinks / (displayInternalLinks + displayExternalLinks)) * 100).toFixed(0)}%`
            : "0%",
        loading: isCrawling && !displayInternalLinks && !displayExternalLinks,
      },
      {
        label: "Total External Links",
        value: displayExternalLinks,
        percentage:
          displayInternalLinks + displayExternalLinks
            ? `${((displayExternalLinks / (displayInternalLinks + displayExternalLinks)) * 100).toFixed(0)}%`
            : "0%",
        loading: isCrawling && !displayInternalLinks && !displayExternalLinks,
      },
      {
        label: "Total Indexable Pages",
        value: displayIndexablePages,
        percentage: totalPagesCrawled
          ? `${((displayIndexablePages / totalPagesCrawled) * 100).toFixed(0)}%`
          : "0%",
        loading: isCrawling && !displayIndexablePages,
      },
      {
        label: "Total Not Indexable Pages",
        value: totalNotIndexablePages,
        percentage: totalPagesCrawled
          ? `${((totalNotIndexablePages / totalPagesCrawled) * 100).toFixed(0)}%`
          : "0%",
        loading: isCrawling && !totalNotIndexablePages && !totalPagesCrawled,
      },
    ],
    [
      totalPagesCrawled,
      displayInternalLinks,
      displayExternalLinks,
      displayTotalLinks,
      displayIndexablePages,
      totalNotIndexablePages,
      isCrawling,
      streamedCrawledPages,
      streamedTotalPages,
    ],
  );

  return (
    <div className="text-xs w-full">
      <div className="w-full cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="text-xs font-semibold border-b dark:border-b-brand-dark pl-1 pb-1.5 pt-0.5 flex items-center">
          <span className="">
            {isOpen ? (
              <FiChevronDown size={14} />
            ) : (
              <FiChevronRight size={14} />
            )}
          </span>
          <span className="ml-1">Summary</span>
          {isCrawling && (
            <span className="ml-2 text-xs text-sky-500 animate-pulse">
              Crawling...
            </span>
          )}
          {state.isProcessing && !isCrawling && (
            <span className="ml-2 text-xs text-gray-500">Processing...</span>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="w-full">
          {summaryData.map((item, index) => (
            <SummaryItemRow key={index} {...item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(Summary);
