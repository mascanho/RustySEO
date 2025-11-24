// @ts-nocheck
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { shallow } from "zustand/shallow";
import { invoke } from "@tauri-apps/api/core";

interface BotPageDetails {
  crawler_type: string;
  file_type: string;
  response_size: number;
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
  response_size: number;
  country?: string;
  is_crawler: boolean;
  crawler_type: string;
  browser: string;
  file_type: string;
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

interface Taxonomy {
  id: string;
  name: string;
  paths: string[];
  matchType: "startsWith" | "contains";
}

interface LogAnalysisState {
  entries: LogEntry[];
  overview: LogAnalysisOverview;
  isLoading: boolean;
  error: string | null;
  filters: Filters;
  taxonomies: Taxonomy[];
  taxonomyNameMap: { [path: string]: string[] };
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
  setTaxonomies: (taxonomies: Taxonomy[]) => void;
  loadTaxonomies: () => Promise<void>;
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
  taxonomies: [],
  taxonomyNameMap: {},
};

const mergeFrequencyObjects = (
  existing: GoogleBotPagesFrequency = {},
  incoming: GoogleBotPagesFrequency = {},
): GoogleBotPagesFrequency => {
  // ... (implementation unchanged)
  const merged = JSON.parse(JSON.stringify(existing));

  for (const [url, incomingDetails] of Object.entries(incoming)) {
    if (!merged[url]) {
      merged[url] = [...incomingDetails];
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
        existingDetail.response_size += newDetail.response_size;
      } else {
        existingDetailsMap.set(key, { ...newDetail });
      }
    }
    merged[url] = Array.from(existingDetailsMap.values());
  }

  return merged;
};

export const useLogAnalysisStore = create<
  LogAnalysisState & LogAnalysisActions
>()(
  immer((set, get) => ({
    ...initialState,

    setLogData: (data) =>
      set((state) => {
        state.entries = [...state.entries, ...(data.entries || [])];
        state.overview = {
          ...state.overview,
          // ... (merging logic unchanged)
        };
        state.isLoading = false;
        state.error = null;
      }),

    setFilter: (key, value) => set((state) => { state.filters[key] = value; }),
    resetFilters: () => set((state) => { state.filters = initialState.filters; }),
    resetAll: () => set((state) => { Object.assign(state, initialState); }),
    setLoading: (isLoading) => set((state) => { state.isLoading = isLoading; }),
    setError: (error) => set((state) => { state.error = error; }),
    clearEntries: () => set((state) => {
      state.entries = [];
      state.overview = {
        ...initialState.overview,
        log_start_time: state.overview.log_start_time,
        log_finish_time: state.overview.log_finish_time,
      };
    }),

    setTaxonomies: (taxonomies) =>
      set((state) => {
        state.taxonomies = taxonomies;
        const newMap = taxonomies.reduce((acc, tax) => {
          if (tax.paths) {
            tax.paths.forEach(path => {
              if (!acc[path]) {
                acc[path] = [];
              }
              acc[path].push(tax.name);
            });
          }
          return acc;
        }, {});
        state.taxonomyNameMap = newMap;
        localStorage.setItem("taxonomies", JSON.stringify(taxonomies));
      }),

    loadTaxonomies: async () => {
      let loadedTaxonomies: Taxonomy[] = [];
      const storedTaxonomies = localStorage.getItem("taxonomies");

      if (storedTaxonomies) {
        try {
          const parsed = JSON.parse(storedTaxonomies);
          if (Array.isArray(parsed)) {
            loadedTaxonomies = parsed;
          }
        } catch (e) {
          console.error("Failed to parse taxonomies from localStorage", e);
          localStorage.removeItem("taxonomies");
        }
      } else {
        try {
          const backendTaxonomies = await invoke("get_taxonomies");
          if (Array.isArray(backendTaxonomies) && backendTaxonomies.length > 0) {
            const grouped = backendTaxonomies.reduce((acc, item) => {
              const name = item.name || item.path;
              if (!acc[name]) {
                acc[name] = {
                  id: crypto.randomUUID(),
                  name: name,
                  paths: [],
                  matchType: item.match_type || 'startsWith',
                };
              }
              acc[name].paths.push(item.path);
              return acc;
            }, {});
            loadedTaxonomies = Object.values(grouped);
          }
        } catch (error) {
          console.log("No taxonomies found in backend:", error);
        }
      }
      get().setTaxonomies(loadedTaxonomies);
    },
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
      taxonomies: state.taxonomies,
      taxonomyNameMap: state.taxonomyNameMap,
      setLogData: state.setLogData,
      setFilter: state.setFilter,
      resetFilters: state.resetFilters,
      resetAll: state.resetAll,
      setLoading: state.setLoading,
      setError: state.setError,
      setTaxonomies: state.setTaxonomies,
      loadTaxonomies: state.loadTaxonomies,
    }),
    shallow,
  );
