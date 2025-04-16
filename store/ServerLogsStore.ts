import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { shallow } from "zustand/shallow";

interface LogEntry {
  ip: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  user_agent: string;
  referer: string;
  response_size: number;
  country?: string;
  crawler_type: string;
  is_crawler: boolean;
  browser: string;
  file_type: string;
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
  line_count: number;
  unique_ips: number;
  unique_user_agents: number;
  crawler_count: number;
  success_rate: number;
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
    line_count: 0,
    unique_ips: 0,
    unique_user_agents: 0,
    crawler_count: 0,
    success_rate: 0,
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
        const ov = data.overview || {};
        state.overview = {
          message: ov.message || "",
          line_count: ov.line_count || ov.lineCount || 0,
          unique_ips: ov.unique_ips || ov.uniqueIps || 0,
          unique_user_agents: ov.unique_user_agents || ov.uniqueUserAgents || 0,
          crawler_count: ov.crawler_count || ov.crawlerCount || 0,
          success_rate: ov.success_rate || ov.successRate || 0,
          totals: {
            ...defaultTotals,
            ...(ov.totals || {}),
          },
        };
        state.isLoading = false;
        state.error = null;
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
