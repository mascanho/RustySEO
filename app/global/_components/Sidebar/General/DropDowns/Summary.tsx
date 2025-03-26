// @ts-nocheck
import React, {
  useMemo,
  memo,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
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

const CHUNK_SIZE = 5000; // Process 5000 items at a time
const DEBOUNCE_DELAY = 300;

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

type State = {
  internalLinks: string[];
  externalLinks: string[];
  totalIndexablePages: number;
  isProcessing: boolean;
};

type Action =
  | {
      type: "UPDATE_DATA";
      payload: {
        internalLinks: string[];
        externalLinks: string[];
        totalIndexablePages: number;
      };
    }
  | { type: "START_PROCESSING" }
  | { type: "END_PROCESSING" };

const initialState: State = {
  internalLinks: [],
  externalLinks: [],
  totalIndexablePages: 0,
  isProcessing: false,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "UPDATE_DATA":
      return {
        ...state,
        ...action.payload,
        isProcessing: false,
      };
    case "START_PROCESSING":
      return {
        ...state,
        isProcessing: true,
      };
    case "END_PROCESSING":
      return {
        ...state,
        isProcessing: false,
      };
    default:
      return state;
  }
};

// Web Worker processor
const createWorker = () => {
  if (typeof window !== "undefined" && window.Worker) {
    const workerCode = `
      self.onmessage = function(e) {
        const { data, chunkIndex, chunkSize } = e.data;
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, data.length);
        const chunk = data.slice(start, end);
        
        const internalLinksSet = new Set();
        const externalLinksSet = new Set();
        let totalIndexablePages = 0;

        for (const item of chunk) {
          item?.anchor_links?.internal?.links?.forEach(link => internalLinksSet.add(link));
          item?.anchor_links?.external?.links?.forEach(link => externalLinksSet.add(link));
          if ((item?.indexability?.indexability || 0) > 0.5) {
            totalIndexablePages++;
          }
        }

        postMessage({
          internalLinks: Array.from(internalLinksSet),
          externalLinks: Array.from(externalLinksSet),
          totalIndexablePages,
          isFinal: end >= data.length
        });
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    return new Worker(URL.createObjectURL(blob));
  }
  return null;
};

const Summary: React.FC = () => {
  const domainCrawlData = useGlobalCrawlStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const processingChunkRef = useRef<number>(0);
  const crawlDataRef = useRef<CrawlDataItem[]>([]);

  // Safely get crawlData or default to an empty array
  const crawlData: CrawlDataItem[] = useMemo(
    () => domainCrawlData?.crawlData || [],
    [domainCrawlData],
  );

  // Use reducer to manage derived data
  const [state, dispatch] = useReducer(reducer, initialState);

  // Initialize worker
  useEffect(() => {
    workerRef.current = createWorker();
    if (workerRef.current) {
      workerRef.current.onmessage = (e) => {
        const { internalLinks, externalLinks, totalIndexablePages, isFinal } =
          e.data;

        dispatch({
          type: "UPDATE_DATA",
          payload: {
            internalLinks,
            externalLinks,
            totalIndexablePages,
          },
        });

        if (!isFinal) {
          processNextChunk();
        }
      };
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Process data in chunks
  const processData = useCallback((data: CrawlDataItem[]) => {
    if (data.length === 0) {
      dispatch({
        type: "UPDATE_DATA",
        payload: {
          internalLinks: [],
          externalLinks: [],
          totalIndexablePages: 0,
        },
      });
      return;
    }

    crawlDataRef.current = data;
    processingChunkRef.current = 0;
    dispatch({ type: "START_PROCESSING" });
    processNextChunk();
  }, []);

  const processNextChunk = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        data: crawlDataRef.current,
        chunkIndex: processingChunkRef.current,
        chunkSize: CHUNK_SIZE,
      });
      processingChunkRef.current++;
    } else {
      // Fallback to main thread processing if workers aren't supported
      const chunkStart = processingChunkRef.current * CHUNK_SIZE;
      const chunkEnd = Math.min(
        chunkStart + CHUNK_SIZE,
        crawlDataRef.current.length,
      );
      const chunk = crawlDataRef.current.slice(chunkStart, chunkEnd);

      const internalLinksSet = new Set(state.internalLinks);
      const externalLinksSet = new Set(state.externalLinks);
      let totalIndexablePages = state.totalIndexablePages;

      for (const item of chunk) {
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

      dispatch({
        type: "UPDATE_DATA",
        payload: {
          internalLinks: Array.from(internalLinksSet),
          externalLinks: Array.from(externalLinksSet),
          totalIndexablePages,
        },
      });

      if (chunkEnd < crawlDataRef.current.length) {
        processingChunkRef.current++;
        setTimeout(processNextChunk, 0); // Yield to main thread
      }
    }
  }, [state.internalLinks, state.externalLinks, state.totalIndexablePages]);

  // Debounced update function using useRef
  const debouncedUpdate = useRef(
    debounce((data: CrawlDataItem[]) => {
      processData(data);
    }, DEBOUNCE_DELAY),
  ).current;

  // Trigger debounced update when crawlData changes
  useEffect(() => {
    if (isExpanded) {
      debouncedUpdate(crawlData);
    }
  }, [crawlData, debouncedUpdate, isExpanded]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, [debouncedUpdate]);

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

  const handleToggle = useCallback(
    (e: React.MouseEvent<HTMLDetailsElement>) => {
      const newState = !isExpanded;
      setIsExpanded(newState);

      // Process data if expanding for the first time
      if (
        newState &&
        crawlData.length > 0 &&
        state.internalLinks.length === 0
      ) {
        debouncedUpdate(crawlData);
      }

      console.log(e.currentTarget.innerText);
    },
    [isExpanded, crawlData, state.internalLinks.length, debouncedUpdate],
  );

  return (
    <div className="text-sx w-full">
      <details className="w-full" onClick={handleToggle} open={isExpanded}>
        <summary className="text-xs font-semibold border-b dark:border-b-brand-dark pl-2 pb-1.5 cursor-pointer flex items-center">
          <span>Summary</span>
          {state.isProcessing && (
            <span className="ml-2 text-xs text-gray-500">Processing...</span>
          )}
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
