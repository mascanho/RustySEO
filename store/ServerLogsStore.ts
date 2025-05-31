// @ts-nocheck
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { shallow } from "zustand/shallow";

interface BotPageDetails {
  crawler_type: string;
  file_type: string;
  response_size: string;
  timestamp: string;
  ip: string;
  referer: string;
  browser: string;
  user_agent: string;
  frequency: number;
  method: string;
  verified: boolean;
  taxonomy: string;
  filename: string;
}

interface GoogleBotPagesFrequency {
  [key: string]: BotPageDetails[];
}

interface CrawlerTotals {
  google: number;
  bing: number;
  semrush: number;
  hrefs: number;
  moz: number;
  uptime: number;
  openai: number;
  claude: number;
  google_bot_pages: string[];
  google_bot_page_frequencies: GoogleBotPagesFrequency;
}

interface LogEntry {
  ip: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  user_agent: string;
  referer: string;
  response_size: string;
  country?: string;
  is_crawler: boolean;
  crawler_type: string;
  browser: string;
  file_type: string;
  frequency?: number;
  verified?: boolean;
}

interface LogAnalysisOverview {
  message: string;
  line_count: number;
  unique_ips: number;
  unique_user_agents: number;
  crawler_count: number;
  success_rate: number;
  totals: CrawlerTotals;
  log_start_time: string;
  log_finish_time: string;
}

interface Filters {
  status_code: string | null;
  method: string | null;
  is_crawler: boolean | null;
  search_term: string;
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
  clearEntries: () => void;
}

const defaultTotals: CrawlerTotals = {
  google: 0,
  bing: 0,
  semrush: 0,
  hrefs: 0,
  moz: 0,
  uptime: 0,
  openai: 0,
  claude: 0,
  google_bot_pages: [],
  google_bot_page_frequencies: {},
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
    log_start_time: "",
    log_finish_time: "",
  },
  isLoading: false,
  error: null,
  filters: {
    status_code: null,
    method: null,
    is_crawler: null,
    search_term: "",
  },
};

const mergeFrequencyObjects = (
  existing: GoogleBotPagesFrequency = {},
  incoming: GoogleBotPagesFrequency = {},
): GoogleBotPagesFrequency => {
  const merged = JSON.parse(JSON.stringify(existing));

  for (const [url, incomingDetails] of Object.entries(incoming)) {
    if (!merged[url]) {
      merged[url] = incomingDetails;
      continue;
    }

    const existingDetailsMap = new Map<string, BotPageDetails>();
    merged[url].forEach((detail) => {
      const key = `${detail.timestamp}_${detail.ip}_${detail.user_agent}`;
      existingDetailsMap.set(key, detail);
    });

    for (const newDetail of incomingDetails) {
      const key = `${newDetail.timestamp}_${newDetail.ip}_${newDetail.user_agent}`;
      if (existingDetailsMap.has(key)) {
        const existingDetail = existingDetailsMap.get(key)!;
        existingDetail.frequency += newDetail.frequency;
      } else {
        existingDetailsMap.set(key, newDetail);
      }
    }

    merged[url] = Array.from(existingDetailsMap.values());
  }

  return merged;
};

const ensureUniqueUrls = (
  existingEntries: LogEntry[],
  newEntries: LogEntry[],
): LogEntry[] => {
  const urlMap = new Map<string, LogEntry>();

  // Process existing entries
  existingEntries.forEach((entry) => {
    const normalizedPath = entry.path.toLowerCase().trim();
    if (urlMap.has(normalizedPath)) {
      const existing = urlMap.get(normalizedPath)!;
      // Sum frequency
      existing.frequency = (existing.frequency || 1) + (entry.frequency || 1);

      // Keep metadata from most recent entry
      if (new Date(entry.timestamp) > new Date(existing.timestamp)) {
        existing.timestamp = entry.timestamp;
        existing.status = entry.status;
        existing.ip = entry.ip;
        existing.user_agent = entry.user_agent;
        existing.method = entry.method;
        existing.file_type = entry.file_type;
        existing.crawler_type = entry.crawler_type;
        existing.verified = entry.verified;
        existing.response_size = entry.response_size;
      }
    } else {
      urlMap.set(normalizedPath, {
        ...entry,
        frequency: entry.frequency || 1,
      });
    }
  });

  // Process new entries
  newEntries.forEach((entry) => {
    const normalizedPath = entry.path.toLowerCase().trim();
    if (urlMap.has(normalizedPath)) {
      const existing = urlMap.get(normalizedPath)!;
      // Sum frequency
      existing.frequency = (existing.frequency || 1) + (entry.frequency || 1);

      // Keep metadata from most recent entry
      if (new Date(entry.timestamp) > new Date(existing.timestamp)) {
        existing.timestamp = entry.timestamp;
        existing.status = entry.status;
        existing.ip = entry.ip;
        existing.user_agent = entry.user_agent;
        existing.method = entry.method;
        existing.file_type = entry.file_type;
        existing.crawler_type = entry.crawler_type;
        existing.verified = entry.verified;
        existing.response_size = entry.response_size;
      }
    } else {
      urlMap.set(normalizedPath, {
        ...entry,
        frequency: entry.frequency || 1,
      });
    }
  });

  return Array.from(urlMap.values());
};

export const useLogAnalysisStore = create<
  LogAnalysisState & LogAnalysisActions
>()(
  immer((set) => ({
    ...initialState,

    setLogData: (data) =>
      set((state) => {
        const uniqueEntries = ensureUniqueUrls(
          state.entries,
          data.entries || [],
        );

        state.entries = uniqueEntries;

        state.overview = {
          ...state.overview,
          message: data.overview?.message || state.overview.message,
          line_count:
            (state.overview.line_count || 0) + (data.overview?.line_count || 0),
          unique_ips:
            (state.overview.unique_ips || 0) + (data.overview?.unique_ips || 0),
          unique_user_agents:
            (state.overview.unique_user_agents || 0) +
            (data.overview?.unique_user_agents || 0),
          crawler_count:
            (state.overview.crawler_count || 0) +
            (data.overview?.crawler_count || 0),
          success_rate:
            data.overview?.success_rate || state.overview.success_rate,
          totals: {
            ...state.overview.totals,
            ...(data.overview?.totals || {}),
            google:
              (state.overview.totals.google || 0) +
              (data.overview?.totals?.google || 0),
            bing:
              (state.overview.totals.bing || 0) +
              (data.overview?.totals?.bing || 0),
            semrush:
              (state.overview.totals.semrush || 0) +
              (data.overview?.totals?.semrush || 0),
            hrefs:
              (state.overview.totals.hrefs || 0) +
              (data.overview?.totals?.hrefs || 0),
            moz:
              (state.overview.totals.moz || 0) +
              (data.overview?.totals?.moz || 0),
            uptime:
              (state.overview.totals.uptime || 0) +
              (data.overview?.totals?.uptime || 0),
            openai:
              (state.overview.totals.openai || 0) +
              (data.overview?.totals?.openai || 0),
            claude:
              (state.overview.totals.claude || 0) +
              (data.overview?.totals?.claude || 0),
            google_bot_pages: [
              ...new Set([
                ...(state.overview.totals.google_bot_pages || []),
                ...(data.overview?.totals?.google_bot_pages || []),
              ]),
            ],
            google_bot_page_frequencies: mergeFrequencyObjects(
              state.overview.totals.google_bot_page_frequencies,
              data.overview?.totals?.google_bot_page_frequencies || {},
            ),
          },
          log_start_time:
            data.overview?.log_start_time || state.overview.log_start_time,
          log_finish_time:
            data.overview?.log_finish_time || state.overview.log_finish_time,
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

    clearEntries: () =>
      set((state) => {
        state.entries = [];
        state.overview = {
          ...initialState.overview,
          log_start_time: state.overview.log_start_time,
          log_finish_time: state.overview.log_finish_time,
        };
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
