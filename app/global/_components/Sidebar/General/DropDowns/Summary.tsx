// @ts-nocheck
import React, {
  useMemo,
  memo,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from "react";
import debounce from "lodash.debounce";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";

interface CrawlDataItem {
  anchor_links?: {
    internal?: { links?: string[] };
    external?: { links?: string[] };
  };
  indexability?: {
    indexability?: number;
  };
}

interface SummaryItem {
  label: string;
  value: number;
  percentage: string;
}

const SummaryItemRow: React.FC<SummaryItem> = memo(
  ({ label, value, percentage }) => (
    <div className="flex items-center text-xs w-full px-2 justify-between border-b dark:border-b-brand-dark">
      <div className="w-2/3 pl-2.5 py-1 text-brand-bright">{label}</div>
      <div className="w-1/6 text-right pr-2">{value}</div>
      <div className="w-1/6 text-right pr-2">{percentage}</div>
    </div>
  ),
);

SummaryItemRow.displayName = "SummaryItemRow";

// Reducer to manage derived data
type State = {
  internalLinks: string[];
  externalLinks: string[];
  totalIndexablePages: number;
};

type Action = {
  type: "UPDATE_DATA";
  payload: CrawlDataItem[];
};

const initialState: State = {
  internalLinks: [],
  externalLinks: [],
  totalIndexablePages: 0,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "UPDATE_DATA":
      const internalLinksSet = new Set<string>();
      const externalLinksSet = new Set<string>();
      let totalIndexablePages = 0;

      for (const item of action.payload) {
        item?.anchor_links?.internal?.links?.forEach((link) =>
          internalLinksSet.add(link),
        );
        item?.anchor_links?.external?.links?.forEach((link) =>
          externalLinksSet.add(link),
        );
        if ((item?.indexability?.indexability || 0) > 0.5) {
          totalIndexablePages++;
        }
      }

      return {
        internalLinks: Array.from(internalLinksSet),
        externalLinks: Array.from(externalLinksSet),
        totalIndexablePages,
      };
    default:
      return state;
  }
};

const Summary: React.FC = () => {
  const domainCrawlData = useGlobalCrawlStore();
  const { setSummary } = useGlobalCrawlStore();

  // Safely get crawlData or default to an empty array
  const crawlData: CrawlDataItem[] = useMemo(
    () => domainCrawlData?.crawlData || [],
    [domainCrawlData],
  );

  // Use reducer to manage derived data
  const [state, dispatch] = useReducer(reducer, initialState);

  // Memoize totals
  const {
    totalPagesCrawled,
    totalInternalLinks,
    totalExternalLinks,
    totalLinksFound,
    totalNotIndexablePages,
  } = useMemo(() => {
    const totalPagesCrawled = crawlData.length;
    const totalInternalLinks = state.internalLinks.length;
    const totalExternalLinks = state.externalLinks.length;
    const totalLinksFound = totalInternalLinks + totalExternalLinks;
    const totalNotIndexablePages =
      totalPagesCrawled - state.totalIndexablePages;

    setSummary({
      totaPagesCrawled: crawlData.length,
      totalInternalLinks: state.internalLinks.length,
      totalExternalLinks: state.externalLinks.length,
      totalLinksFound:
        state?.externalLinks.length + state?.internalLinks.length,
      notIndexablePages: totalNotIndexablePages,
      indexablePages: crawlData?.length - totalNotIndexablePages,
    });

    return {
      totalPagesCrawled,
      totalInternalLinks,
      totalExternalLinks,
      totalLinksFound,
      totalNotIndexablePages,
    };
  }, [crawlData, state]);

  // Memoize summary data
  const summaryData: SummaryItem[] = useMemo(
    () => [
      {
        label: "Pages crawled",
        value: totalPagesCrawled,
        percentage: "100%",
      },
      {
        label: "Total Links Found",
        value: totalLinksFound,
        percentage: "100%",
      },
      {
        label: "Total Internal Links",
        value: totalInternalLinks,
        percentage: totalLinksFound
          ? `${((totalInternalLinks / totalLinksFound) * 100).toFixed(0)}%`
          : "0%",
      },
      {
        label: "Total External Links",
        value: totalExternalLinks,
        percentage: totalLinksFound
          ? `${((totalExternalLinks / totalLinksFound) * 100).toFixed(0)}%`
          : "0%",
      },
      {
        label: "Total Indexable Pages",
        value: state.totalIndexablePages,
        percentage: totalPagesCrawled
          ? `${((state.totalIndexablePages / totalPagesCrawled) * 100).toFixed(0)}%`
          : "0%",
      },
      {
        label: "Total Not Indexable Pages",
        value: totalNotIndexablePages,
        percentage: totalPagesCrawled
          ? `${((totalNotIndexablePages / totalPagesCrawled) * 100).toFixed(0)}%`
          : "0%",
      },
    ],
    [
      totalPagesCrawled,
      totalLinksFound,
      totalInternalLinks,
      totalExternalLinks,
      state.totalIndexablePages,
      totalNotIndexablePages,
    ],
  );

  // Memoize the click handler
  const handleClick = useCallback((e: React.MouseEvent<HTMLDetailsElement>) => {
    console.log(e.currentTarget.innerText);
  }, []);

  // Debounced update function using useRef
  const debouncedUpdate = useRef(
    debounce((data: CrawlDataItem[]) => {
      dispatch({ type: "UPDATE_DATA", payload: data });
    }, 300), // 300ms debounce delay
  ).current;

  // Trigger debounced update when crawlData changes
  useEffect(() => {
    debouncedUpdate(crawlData);
  }, [crawlData, debouncedUpdate]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, [debouncedUpdate]);

  return (
    <div className="text-sx w-full">
      <details className="w-full" onClick={handleClick}>
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 pb-1.5 cursor-pointer flex items-center">
          <span>Summary</span>
        </summary>
        <div className="w-full">
          {summaryData.map((item, index) => (
            <SummaryItemRow key={index} {...item} />
          ))}
        </div>
      </details>
    </div>
  );
};

export default memo(Summary);
