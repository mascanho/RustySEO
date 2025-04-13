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

interface LogAnalysisOverview {
  message: string;
  lineCount: number;
  uniqueIps: number;
  uniqueUserAgents: number;
  crawlerCount: number;
  successRate: number;
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
    overview: LogAnalysisOverview;
  }) => void;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  resetAll: () => void;
}

const initialState: LogAnalysisState = {
  entries: [],
  overview: {
    message: "",
    lineCount: 0,
    uniqueIps: 0,
    uniqueUserAgents: 0,
    crawlerCount: 0,
    successRate: 0,
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

    setLogData: (data: {
      entries: LogEntry[];
      overview: LogAnalysisOverview;
    }) =>
      set((state) => {
        state.entries = data.entries;
        state.overview = {
          message: data.overview.message,
          lineCount: data.overview.lineCount,
          uniqueIps: data.overview.uniqueIps,
          uniqueUserAgents: data.overview.uniqueUserAgents,
          crawlerCount: data.overview.crawlerCount,
          successRate: data.overview.successRate,
        };
        state.isLoading = false;
        state.error = null;
        console.log("setLogData: Stored entries count:", data.entries.length); // Debug
        console.log("setLogData: Overview:", data.overview); // Debug
      }),

    setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) =>
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
    }),
    shallow,
  );
