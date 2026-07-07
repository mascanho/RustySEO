import { useMemo } from "react";
import useGlobalCrawlStore, {
  useAggregatedData,
  useCrawlDataVersion,
} from "@/store/GlobalCrawlDataStore";

const EMPTY_ARRAY: any[] = [];

// Reads the current (live) deep-crawl dataset from the global store.
// `enabled` gates the read so the Visualisations hub costs nothing while
// closed — only the active chart (and the hub's own summary counts) pay for
// touching `crawlData`, matching the pattern already used by every General
// tab dropdown (see Sidebar/General/DropDowns/*.tsx).
export function useVisualisationData(enabled: boolean) {
  const crawlDataVersion = useCrawlDataVersion();
  const aggregatedData = useAggregatedData();

  const crawlData = useMemo(() => {
    if (!enabled) return EMPTY_ARRAY;
    return useGlobalCrawlStore.getState().crawlData || [];
    // crawlDataVersion is the lightweight change signal for crawlData;
    // it's read here only to retrigger this memo, not for its value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, crawlDataVersion]);

  return {
    crawlData,
    aggregatedData,
    isEmpty: crawlData.length === 0,
  };
}
