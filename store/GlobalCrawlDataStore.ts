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
  // State properties
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
  inlinks: string[];
  outlinks: string[];
  robotsBlocked: string[];
  cookies: string[];
  favicon: string[];
  aggregatedData: {
    images: any[];
    scripts: string[];
    css: string[];
    internalLinks: any[];
    externalLinks: any[];
    keywords: any[];
    redirects: any[];
    cwv: any[];
    files: any[];
  };
  setAggregatedData: (data: Partial<CrawlStore['aggregatedData']>) => void;

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
  setInlinks: (links: string[]) => void;
  setOutlinks: (links: string[]) => void;
  setRobotsBlocked: (links: string[]) => void;
  setCookies: (cookies: string[]) => void;
  setFavicon: (favicon: string) => void;
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
      setInlinks: (links: string[]) => void;
      setOutlinks: (links: string[]) => void;
      setRobotsBlocked: (links: string[]) => void;
      setCookies: (cookies: string[]) => void;
      setFavicon: (favicon: string) => void;
      selectURL: (url: string) => void;
      setAggregatedData: (data: Partial<CrawlStore['aggregatedData']>) => void;
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
    setAggregatedData: (data: Partial<CrawlStore['aggregatedData']>) =>
      set((state) => ({
        aggregatedData: { ...state.aggregatedData, ...data }
      })),
    addDomainCrawlResult: (result: PageDetails) =>
      set((state) => {
        // Use a private set for deduplication if we want to be super fast, 
        // but for now let's at least optimize the logic.
        // We can't easily add a Set to the store state without changing too much, 
        // but we can at least avoid the check if the length is large and we trust the backend.
        // Actually, let's keep a Set of visited URLs in the store.
        if (!state.visitedUrls) {
          state.visitedUrls = new Set(state.crawlData.map(item => item.url));
        }

        if (state.visitedUrls.has(result.url)) {
          return state;
        }

        state.visitedUrls.add(result.url);
        return { crawlData: [...state.crawlData, result] };
      }),
    clearDomainCrawlData: () => set({
      crawlData: [],
      visitedUrls: new Set(),
      aggregatedData: {
        images: [],
        scripts: [],
        css: [],
        internalLinks: [],
        externalLinks: [],
        keywords: [],
        redirects: [],
        cwv: [],
        files: [],
      }
    }),
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
    setInlinks: createSetter<string[]>("inlinks"),
    setOutlinks: createSetter<string[]>("outlinks"),
    setRobotsBlocked: createSetter<string[]>("robotsBlocked"),
    setCookies: createSetter<string[]>("cookies"),
    setFavicon: createSetter<string>("favicon"),

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
    aggregatedData: {
      images: [],
      scripts: [],
      css: [],
      internalLinks: [],
      externalLinks: [],
      keywords: [],
      redirects: [],
      cwv: [],
      files: [],
    },
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
    inlinks: [],
    outlinks: [],
    robotsBlocked: [],
    cookies: [],
    favicon: "",
    visitedUrls: new Set(),

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
        setInlinks: setters.setInlinks,
        setOutlinks: setters.setOutlinks,
        setRobotsBlocked: setters.setRobotsBlocked,
        setCookies: setters.setCookies,
        setFavicon: setters.setFavicon,
        setAggregatedData: setters.setAggregatedData,
        selectURL: async (url: string) => {
          const state = get();
          const rows = state.crawlData;

          let pageData = rows.find((item) => item.url === url);
          if (!pageData) return;

          // Fetch full data from backend because we only have LightCrawlResult in state
          try {
            const { invoke } = await import("@tauri-apps/api/core");
            const fullData = await invoke("get_url_data_command", { url });
            if (fullData) {
              pageData = fullData;
            }
          } catch (error) {
            console.error("Failed to fetch full URL data:", error);
          }

          setters.setSelectedTableURL([pageData]);

          const normalizeUrl = (url: string) => {
            if (!url) return "";
            try {
              let u = url.toString().trim().toLowerCase();
              u = u.replace(/^(?:https?:\/\/)?/i, "");
              u = u.replace(/^www\./i, "");
              const queryIdx = u.indexOf("?");
              if (queryIdx !== -1) u = u.substring(0, queryIdx);
              const hashIdx = u.indexOf("#");
              if (hashIdx !== -1) u = u.substring(0, hashIdx);
              if (u.endsWith("/")) u = u.slice(0, -1);
              return u;
            } catch (e) {
              return "";
            }
          };

          const targetUrlNormalized = normalizeUrl(url);

          // Use debouncedCrawlData from TablesContainer? No, we use store state.
          // This matched call is still O(N) but only on click.
          // Fetch incoming links from backend
          let innerLinksMatched = [];
          try {
            const { invoke } = await import("@tauri-apps/api/core");
            innerLinksMatched = await invoke("get_incoming_links_command", { targetUrl: url });
          } catch (error) {
            console.error("Failed to fetch incoming links:", error);
            // Fallback to client-side filtering if command fails (though less reliable)
            innerLinksMatched = rows.filter((r) => {
              const internalLinks = r?.inoutlinks_status_codes?.internal || [];
              return internalLinks.some(
                (link: any) => normalizeUrl(link?.url) === targetUrlNormalized,
              );
            });
          }

          console.log('🔍 Inlinks Debug:', {
            selectedUrl: url,
            normalizedUrl: targetUrlNormalized,
            totalPages: rows.length,
            pagesWithLinksToThisUrl: innerLinksMatched.length,
            samplePage: innerLinksMatched[0]
          });

          // Extract all internal links that point to the selected URL
          const inlinksData = [];
          innerLinksMatched.forEach((page) => {
            const internalLinks = page?.inoutlinks_status_codes?.internal || [];
            internalLinks.forEach((link: any) => {
              if (normalizeUrl(link?.url) === targetUrlNormalized) {
                inlinksData.push({
                  anchor_text: link?.anchor_text || "",
                  url: link?.url || "",
                  relative_path: link?.relative_path || null,
                  status: link?.status || null,
                  error: link?.error || null,
                  rel: link?.rel || "",
                  target: link?.target || "",
                  title: link?.title || "",
                });
              }
            });
          });

          console.log('📊 Inlinks Data:', {
            totalInlinks: inlinksData.length,
            sampleInlink: inlinksData[0]
          });

          // Format data to match BOTH InlinksSubTable and InnerLinksDetailsTable expectations
          // data[0] = selected URL with inlinks data (for InlinksSubTable)
          // data[1] = array of pages that link to this URL (for InnerLinksDetailsTable)
          setters.setInlinks([
            {
              url,
              inoutlinks_status_codes: {
                internal: inlinksData
              }
            },
            innerLinksMatched  // Array of pages for InnerLinksDetailsTable
          ]);

          const allOutgoingLinks = [];
          if (pageData.inoutlinks_status_codes?.internal) {
            allOutgoingLinks.push(...pageData.inoutlinks_status_codes.internal);
          }
          if (pageData.inoutlinks_status_codes?.external) {
            allOutgoingLinks.push(...pageData.inoutlinks_status_codes.external);
          }

          setters.setOutlinks([{ url }, allOutgoingLinks]);
        },
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
      robots: {
        setRobotsBlocked: setters.setRobotsBlocked,
      },
    },
  };
});

// Memoized selectors
export const useCrawlData = () => {
  const selector = useCallback((state: CrawlStore) => state.crawlData, []);
  return useGlobalCrawlStore(selector, shallow);
};

export const useAggregatedData = () => {
  const selector = useCallback((state: CrawlStore) => state.aggregatedData, []);
  return useGlobalCrawlStore(selector, shallow);
};

export const useCrawlLoading = () => {
  const selector = useCallback(
    (state: CrawlStore) => state.domainCrawlLoading,
    [],
  );
  return useGlobalCrawlStore(selector);
};

export const useIsGeneratingExcel = () => {
  const selector = useCallback(
    (state: CrawlStore) => state.isGeneratingExcel,
    [],
  );
  return useGlobalCrawlStore(selector);
};

export const useIssuesView = () => {
  const selector = useCallback((state: CrawlStore) => state.issuesView, []);
  return useGlobalCrawlStore(selector);
};

export const useIssuesData = () => {
  const selector = useCallback((state: CrawlStore) => state.issuesData, []);
  return useGlobalCrawlStore(selector, shallow);
};

export const useSelectedTableURL = () => {
  const selector = useCallback(
    (state: CrawlStore) => state.selectedTableURL,
    [],
  );
  return useGlobalCrawlStore(selector, shallow);
};

export const useInlinks = () => {
  const selector = useCallback((state: CrawlStore) => state.inlinks, []);
  return useGlobalCrawlStore(selector, shallow);
};

export const useOutlinks = () => {
  const selector = useCallback((state: CrawlStore) => state.outlinks, []);
  return useGlobalCrawlStore(selector, shallow);
};

export const useRobotsBlocked = () => {
  const selector = useCallback((state: CrawlStore) => state.robotsBlocked, []);
  return useGlobalCrawlStore(selector, shallow);
};

export const useCookies = () => {
  const selector = useCallback((state: CrawlStore) => state.cookies, []);
  return useGlobalCrawlStore(selector, shallow);
};

export const useFavicon = () => {
  const selector = useCallback((state: CrawlStore) => state.favicon, []);
  return useGlobalCrawlStore(selector, shallow);
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
