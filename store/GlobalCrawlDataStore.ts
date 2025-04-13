// @ts-nocheck
import { create } from "zustand";
import { shallow } from "zustand/shallow";
import { useCallback } from "react";

interface PageDetails {
  url: string;
  // ... other page details properties
}

interface StreamingUpdate {
  result?: PageDetails;
  progress?: {
    crawled: number;
    total: number;
  };
  metadata?: Record<string, any>;
}

interface CrawlStore {
  // State
  crawlData: PageDetails[];
  domainCrawlLoading: boolean;
  crawlerType: string;
  issues: string[];
  statusCodes: string[];
  headingsH1: string[];
  headingsH2: string[];
  issueRow: string[];
  selectedTableURL: string[];
  javascript: string[];
  css: string[];
  robots: string[];
  sitemaps: string[];
  isGeneratingExcel: boolean;
  summary: string[];
  isFinishedDeepCrawl: boolean;
  genericChart: string;
  issuesView: string;
  issuesData: string[];
  crawlSessionTotalArray: string[];
  isExtracting: boolean;
  totalUrlsCrawled: number;
  streamedCrawledPages: number;
  streamedTotalPages: number;
  deepCrawlTab: string;

  // Original actions (maintained for backward compatibility)
  setDomainCrawlData: (data: PageDetails[]) => void;
  addDomainCrawlResult: (result: PageDetails) => void;
  clearDomainCrawlData: () => void;
  setDomainCrawlLoading: (loading: boolean) => void;
  setCrawlerType: (type: string) => void;
  setIssues: (issues: string[]) => void;
  setStatusCodes: (codes: string[]) => void;
  setHeadingsH1: (headings: string[]) => void;
  setHeadingsH2: (headings: string[]) => void;
  setIssueRow: (row: string[]) => void;
  setSelectedTableURL: (row: string[]) => void;
  setJavascript: (row: string[]) => void;
  setCss: (row: string[]) => void;
  setRobots: (row: string[]) => void;
  setSitemaps: (row: string[]) => void;
  setIsGeneratingExcel: (isGenerating: boolean) => void;
  setSummary: (summary: string[]) => void;
  setFinishedDeepCrawl: (isFinished: boolean) => void;
  setGenericChart: (chart: string) => void;
  setIssuesView: (view: string) => void;
  setIssuesData: (data: string[]) => void;
  setCrawlSessionTotalArray: (data: string[]) => void;
  setIsExtracting: (isExtracting: boolean) => void;
  setTotalUrlsCrawled: (total: number) => void;
  setStreamedCrawledPages: (pages: number) => void;
  setStreamedTotalPages: (pages: number) => void;
  setDeepCrawlTab: (tab: string) => void;
  updateStreamingData: (
    result: PageDetails,
    crawledPages: number,
    totalPages: number,
  ) => void;

  // New action groups
  actions: {
    data: {
      setDomainCrawlData: (data: PageDetails[]) => void;
      addDomainCrawlResult: (result: PageDetails) => void;
      clearDomainCrawlData: () => void;
      setIssues: (issues: string[]) => void;
      setStatusCodes: (codes: string[]) => void;
      setHeadingsH1: (headings: string[]) => void;
      setHeadingsH2: (headings: string[]) => void;
      setIssueRow: (row: string[]) => void;
      setSelectedTableURL: (row: string[]) => void;
      setJavascript: (row: string[]) => void;
      setCss: (row: string[]) => void;
      setRobots: (row: string[]) => void;
      setSitemaps: (row: string[]) => void;
      setSummary: (summary: string[]) => void;
      setIssuesData: (data: string[]) => void;
      setCrawlSessionTotalArray: (data: string[]) => void;
    };
    ui: {
      setGenericChart: (chart: string) => void;
      setIssuesView: (view: string) => void;
      setDeepCrawlTab: (tab: string) => void;
    };
    status: {
      setDomainCrawlLoading: (loading: boolean) => void;
      setIsGeneratingExcel: (isGenerating: boolean) => void;
      setFinishedDeepCrawl: (isFinished: boolean) => void;
      setIsExtracting: (isExtracting: boolean) => void;
      setCrawlerType: (type: string) => void;
    };
    progress: {
      setTotalUrlsCrawled: (total: number) => void;
      setStreamedCrawledPages: (pages: number) => void;
      setStreamedTotalPages: (pages: number) => void;
      updateStreaming: (update: StreamingUpdate) => void;
    };
  };
}

// Utility function to create setters dynamically
const createSetter =
  <T>(key: keyof CrawlStore) =>
  (value: T) =>
    useGlobalCrawlStore.setState({ [key]: value } as any);

// Create the Zustand store
const useGlobalCrawlStore = create<CrawlStore>((set, get) => {
  // Common setter functions
  const setters = {
    setDomainCrawlData: createSetter<PageDetails[]>("crawlData"),
    addDomainCrawlResult: (result: PageDetails) =>
      set((state) => {
        if (state.crawlData.some((item) => item.url === result.url)) {
          return state;
        }
        return { crawlData: [...state.crawlData, result] };
      }),
    clearDomainCrawlData: () => set({ crawlData: [] }),
    setDomainCrawlLoading: createSetter<boolean>("domainCrawlLoading"),
    setCrawlerType: createSetter<string>("crawlerType"),
    setIssues: createSetter<string[]>("issues"),
    setStatusCodes: createSetter<string[]>("statusCodes"),
    setHeadingsH1: createSetter<string[]>("headingsH1"),
    setHeadingsH2: createSetter<string[]>("headingsH2"),
    setIssueRow: createSetter<string[]>("issueRow"),
    setSelectedTableURL: createSetter<string[]>("selectedTableURL"),
    setJavascript: createSetter<string[]>("javascript"),
    setCss: createSetter<string[]>("css"),
    setRobots: createSetter<string[]>("robots"),
    setSitemaps: createSetter<string[]>("sitemaps"),
    setIsGeneratingExcel: createSetter<boolean>("isGeneratingExcel"),
    setSummary: createSetter<string[]>("summary"),
    setFinishedDeepCrawl: createSetter<boolean>("isFinishedDeepCrawl"),
    setGenericChart: createSetter<string>("genericChart"),
    setIssuesView: createSetter<string>("issuesView"),
    setIssuesData: createSetter<string[]>("issuesData"),
    setCrawlSessionTotalArray: createSetter<string[]>("crawlSessionTotalArray"),
    setIsExtracting: createSetter<boolean>("isExtracting"),
    setTotalUrlsCrawled: createSetter<number>("totalUrlsCrawled"),
    setStreamedCrawledPages: createSetter<number>("streamedCrawledPages"),
    setStreamedTotalPages: createSetter<number>("streamedTotalPages"),
    setDeepCrawlTab: createSetter<string>("deepCrawlTab"),
    updateStreamingData: (
      result: PageDetails,
      crawledPages: number,
      totalPages: number,
    ) =>
      set((state) => ({
        crawlData: state.crawlData.some((item) => item.url === result.url)
          ? state.crawlData
          : [...state.crawlData, result],
        streamedCrawledPages: crawledPages,
        streamedTotalPages: totalPages,
      })),
  };

  return {
    // Initial State
    crawlData: [],
    domainCrawlLoading: false,
    crawlerType: "spider",
    issues: [],
    statusCodes: [],
    headingsH1: [],
    headingsH2: [],
    issueRow: [],
    selectedTableURL: [],
    javascript: [],
    css: [],
    robots: [],
    sitemaps: [],
    isGeneratingExcel: false,
    summary: [],
    isFinishedDeepCrawl: false,
    genericChart: "",
    issuesView: "",
    issuesData: [],
    crawlSessionTotalArray: [],
    isExtracting: false,
    totalUrlsCrawled: 0,
    streamedCrawledPages: 0,
    streamedTotalPages: 0,
    deepCrawlTab: "",

    // Original actions (for backward compatibility)
    ...setters,

    // New action groups
    actions: {
      data: {
        setDomainCrawlData: setters.setDomainCrawlData,
        addDomainCrawlResult: setters.addDomainCrawlResult,
        clearDomainCrawlData: setters.clearDomainCrawlData,
        setIssues: setters.setIssues,
        setStatusCodes: setters.setStatusCodes,
        setHeadingsH1: setters.setHeadingsH1,
        setHeadingsH2: setters.setHeadingsH2,
        setIssueRow: setters.setIssueRow,
        setSelectedTableURL: setters.setSelectedTableURL,
        setJavascript: setters.setJavascript,
        setCss: setters.setCss,
        setRobots: setters.setRobots,
        setSitemaps: setters.setSitemaps,
        setSummary: setters.setSummary,
        setIssuesData: setters.setIssuesData,
        setCrawlSessionTotalArray: setters.setCrawlSessionTotalArray,
      },
      ui: {
        setGenericChart: setters.setGenericChart,
        setIssuesView: setters.setIssuesView,
        setDeepCrawlTab: setters.setDeepCrawlTab,
      },
      status: {
        setDomainCrawlLoading: setters.setDomainCrawlLoading,
        setIsGeneratingExcel: setters.setIsGeneratingExcel,
        setFinishedDeepCrawl: setters.setFinishedDeepCrawl,
        setIsExtracting: setters.setIsExtracting,
        setCrawlerType: setters.setCrawlerType,
      },
      progress: {
        setTotalUrlsCrawled: setters.setTotalUrlsCrawled,
        setStreamedCrawledPages: setters.setStreamedCrawledPages,
        setStreamedTotalPages: setters.setStreamedTotalPages,
        updateStreaming: (update: StreamingUpdate) =>
          set((state) => ({
            crawlData:
              update.result &&
              !state.crawlData.some((item) => item.url === update.result.url)
                ? [...state.crawlData, update.result]
                : state.crawlData,
            streamedCrawledPages:
              update.progress?.crawled ?? state.streamedCrawledPages,
            streamedTotalPages:
              update.progress?.total ?? state.streamedTotalPages,
          })),
      },
    },
  };
});

// Memoized selectors
export const useCrawlData = () => {
  const selector = useCallback((state: CrawlStore) => state.crawlData, []);
  return useGlobalCrawlStore(selector, shallow);
};

export const useCrawlLoading = () => {
  const selector = useCallback(
    (state: CrawlStore) => state.domainCrawlLoading,
    [],
  );
  return useGlobalCrawlStore(selector);
};

export const useStreamingProgress = () => {
  const selector = useCallback(
    (state: CrawlStore) => ({
      crawledPages: state.streamedCrawledPages,
      totalPages: state.streamedTotalPages,
    }),
    [],
  );
  return useGlobalCrawlStore(selector, shallow);
};

export const useCrawlSummary = () => {
  const selector = useCallback((state: CrawlStore) => state.summary, []);
  return useGlobalCrawlStore(selector, shallow);
};

// Action hooks
export const useCrawlActions = () =>
  useGlobalCrawlStore((state) => state.actions);
export const useDataActions = () =>
  useGlobalCrawlStore((state) => state.actions.data);
export const useUIActions = () =>
  useGlobalCrawlStore((state) => state.actions.ui);
export const useStatusActions = () =>
  useGlobalCrawlStore((state) => state.actions.status);
export const useProgressActions = () =>
  useGlobalCrawlStore((state) => state.actions.progress);

// Default export for backward compatibility
export default useGlobalCrawlStore;
