import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { shallow } from "zustand/shallow";

interface LogEntry {
  ip: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  userAgent: string;
  referer: string;
  responseSize: number;
  country?: string;
  isCrawler: boolean;
}

interface CrawlerTotals {
  google: number;
  bing: number;
  semrush: number;
  hrefs: number;
  moz: number;
  uptime: number;
  claude?: number;
  openai?: number;
}

interface LogAnalysisOverview {
  message: string;
  lineCount: number;
  uniqueIps: number;
  uniqueUserAgents: number;
  crawlerCount: number;
  successRate: number;
  totals: CrawlerTotals;
}

interface Filters {
  statusCode: string | null;
  method: string | null;
  isCrawler: boolean | null;
  searchTerm: string;
}

interface LogAnalysisState {
  entries: LogEntry[];
  overview: LogAnalysisOverview;
  isLoading: boolean;
  error: string | null;
  filters: Filters;
}

interface LogAnalysisActions {
  setLogData: (data: {
    entries: LogEntry[];
    overview: Partial<LogAnalysisOverview>;
  }) => void;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  resetAll: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultTotals: CrawlerTotals = {
  google: 0,
  bing: 0,
  semrush: 0,
  hrefs: 0,
  moz: 0,
  uptime: 0,
};

const initialState: LogAnalysisState = {
  entries: [],
  overview: {
    message: "",
    lineCount: 0,
    uniqueIps: 0,
    uniqueUserAgents: 0,
    crawlerCount: 0,
    successRate: 0,
    totals: defaultTotals,
  },
  isLoading: false,
  error: null,
  filters: {
    statusCode: null,
    method: null,
    isCrawler: null,
    searchTerm: "",
  },
};

export const useLogAnalysisStore = create<
  LogAnalysisState & LogAnalysisActions
>()(
  immer((set) => ({
    ...initialState,

    setLogData: (data) =>
      set((state) => {
        state.entries = data.entries || [];
        state.overview = {
          message: data.overview.message || "",
          lineCount: data.overview.lineCount || 0,
          uniqueIps: data.overview.uniqueIps || 0,
          uniqueUserAgents: data.overview.uniqueUserAgents || 0,
          crawlerCount: data.overview.crawlerCount || 0,
          successRate: data.overview.successRate || 0,
          totals: {
            ...defaultTotals,
            ...(data.overview.totals || {}),
          },
        };
        state.isLoading = false;
        state.error = null;

        console.log("Log entries stored:", state.entries.length);
        console.log("Overview data stored:", state.overview);
      }),

    setFilter: (key, value) =>
      set((state) => {
        state.filters[key] = value;
      }),

    resetFilters: () =>
      set((state) => {
        state.filters = initialState.filters;
      }),

    resetAll: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),

    setLoading: (isLoading) =>
      set((state) => {
        state.isLoading = isLoading;
      }),

    setError: (error) =>
      set((state) => {
        state.error = error;
      }),
  })),
);

export const useLogAnalysis = () =>
  useLogAnalysisStore(
    (state) => ({
      entries: state.entries,
      overview: state.overview,
      isLoading: state.isLoading,
      error: state.error,
      filters: state.filters,
      setLogData: state.setLogData,
      setFilter: state.setFilter,
      resetFilters: state.resetFilters,
      resetAll: state.resetAll,
      setLoading: state.setLoading,
      setError: state.setError,
    }),
    shallow,
  );
