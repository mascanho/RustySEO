// @ts-nocheck
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { shallow } from "zustand/shallow";
import { invoke } from "@tauri-apps/api/core";

// New interfaces for enhanced backend
interface StatusCodeCounts {
  counts: Record<number, number>;
  success_count: number;
  redirect_count: number;
  client_error_count: number;
  server_error_count: number;
  other_count: number;
}

export interface TimelinePoint {
  date: string;
  human: number;
  crawler: number;
}

export interface StatusPoint {
  date: string;
  success: number;
  redirect: number;
  clientError: number;
  serverError: number;
}

export interface CrawlerPoint {
  date: string;
  google: number;
  bing: number;
  openai: number;
  claude: number;
  other: number;
}

interface BotStats {
  count: number;
  status_codes: StatusCodeCounts;
  pages: string[];
  page_frequencies: Record<string, BotPageDetails[]>;
  page_status_codes: Record<string, StatusCodeCounts>;
}

interface BotStatsMap {
  google: BotStats;
  bing: BotStats;
  semrush: BotStats;
  hrefs: BotStats;
  moz: BotStats;
  uptime: BotStats;
  openai: BotStats;
  claude: BotStats;
}

interface Segmentation {
  name: string;
  match_type: string;
  urls: string[];
  count: number;
  unique_ips: number;
  status_codes: StatusCodeCounts;
  bot_breakdown: Record<string, number>;
}

interface SegmentSummary {
  total_segments: number;
  total_segment_requests: number;
  average_requests_per_segment: number;
}

interface BotPageDetails {
  crawler_type: string;
  file_type: string;
  response_size: number;
  timestamp: string;
  ip: string;
  referer: string | null;
  browser: string;
  user_agent: string;
  frequency: number;
  method: string;
  verified: boolean;
  taxonomy: string | null;
  filename: string;
  status: number;
  status_codes: StatusCodeCounts;
}

interface CrawlerTotals {
  // Original fields for backward compatibility
  google: number;
  bing: number;
  semrush: number;
  hrefs: number;
  moz: number;
  uptime: number;
  openai: number;
  claude: number;

  // New fields for detailed bot stats
  bot_stats: BotStatsMap;
  status_codes: StatusCodeCounts;

  // Original page fields
  google_bot_pages: string[];
  google_bot_page_frequencies: Record<string, BotPageDetails[]>;
  bing_bot_pages: string[];
  bing_bot_page_frequencies: Record<string, BotPageDetails[]>;
  openai_bot_pages: string[];
  openai_bot_page_frequencies: Record<string, BotPageDetails[]>;
  claude_bot_pages: string[];
  claude_bot_page_frequencies: Record<string, BotPageDetails[]>;
}

interface LogEntry {
  ip: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  user_agent: string;
  referer: string | null;
  response_size: number;
  country?: string;
  is_crawler: boolean;
  crawler_type: string;
  browser: string;
  file_type: string;
  verified: boolean;
  segment: string;
  segment_match: string | null;
  taxonomy: string | null;
  filename: string;
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
  file_count: number;
  segmentations: Segmentation[];
  segment_summary: SegmentSummary;
}

interface Filters {
  status_code: string | null;
  method: string | null;
  is_crawler: boolean | null;
  search_term: string;
  segment: string | null;
}

interface LogAnalysisState {
  entries: LogEntry[];
  allFilteredLogs: LogEntry[];
  overview: LogAnalysisOverview;
  widgetAggs: WidgetAggregations | null;
  isLoading: boolean;
  error: string | null;
  filters: Filters;
  activeFilters: ActiveFilters;
  totalCount: number;
  currentPage: number;
  botPathsAggregated: BotPathDetail[];
  timelineData: TimelinePoint[];
  statusTimelineData: StatusPoint[];
  crawlerTimelineData: CrawlerPoint[];
  pathAggregations: PathAggregationsPage;
  botTypes: string[];
}

export interface BotPathDetail {
  ip: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  user_agent: string;
  referer: string;
  response_size: number;
  country: string;
  is_crawler: boolean;
  crawler_type: string;
  browser: string;
  file_type: string;
  frequency: number;
  verified: boolean;
}

interface ActiveFilters {
  search_term: string;
  status_filter: number[];
  method_filter: string[];
  file_type_filter: string[];
  bot_filter: string | null;
  bot_type_filter: string | null;
  crawler_type_filter: string | null;
  verified_filter: boolean | null;
  sort_key: string | null;
  sort_dir: string | null;
  taxonomy_filter: string | null;
  referer_filter: string | null;
  referer_categories: string[];
  referer_specific: string[];
  user_agent_filter: string | null;
  user_agent_categories: string[];
  user_agent_specific: string[];
}

interface FilteredLogsPage {
  entries: LogEntry[];
  total_count: number;
}

export interface PathAggregationsPage {
  entries: BotPathDetail[];
  total_unique_paths: number;
  total_hits: number;
}

export interface WidgetAggregations {
  file_types: Record<string, number>;
  content: Record<string, number>;
  status_codes: Record<number, number>;
  user_agents: Record<string, number>;
  referrers: Record<string, number>;
  user_agent_categories?: Record<string, number>;
  referrer_categories?: Record<string, number>;
  crawler_types?: Record<string, number>;
}


interface LogAnalysisActions {
  setLogData: (
    data: {
      entries?: LogEntry[];
      overview?: Partial<LogAnalysisOverview>;
    },
    mode?: "append" | "replace",
  ) => void;
  fetchLogsFromDb: (
    page: number,
    limit: number,
    filters: ActiveFilters,
  ) => Promise<void>;
  fetchAllFilteredLogs: (filters: ActiveFilters) => Promise<void>;
  fetchWidgetAggregations: (filters: ActiveFilters) => Promise<void>;
  setActiveFilters: (filters: ActiveFilters) => void;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  resetAll: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearEntries: () => void;
  setTotalCount: (count: number) => void;
  fetchBotPathsAggregated: (filters: ActiveFilters) => Promise<void>;
  fetchPathAggregationsPage: (page: number, limit: number, filters: ActiveFilters) => Promise<void>;
  fetchOverviewStats: () => Promise<void>;
  fetchTimelineAggregations: (viewMode: string, filters: ActiveFilters) => Promise<void>;
  fetchStatusAggregations: (viewMode: string, filters: ActiveFilters) => Promise<void>;
  fetchCrawlerAggregations: (viewMode: string, filters: ActiveFilters) => Promise<void>;
  fetchBotTypes: () => Promise<void>;
}

// Default values for new structures
const defaultStatusCodeCounts: StatusCodeCounts = {
  counts: {},
  success_count: 0,
  redirect_count: 0,
  client_error_count: 0,
  server_error_count: 0,
  other_count: 0,
};

const defaultBotStats: BotStats = {
  count: 0,
  status_codes: defaultStatusCodeCounts,
  pages: [],
  page_frequencies: {},
  page_status_codes: {},
};

const defaultBotStatsMap: BotStatsMap = {
  google: defaultBotStats,
  bing: defaultBotStats,
  semrush: defaultBotStats,
  hrefs: defaultBotStats,
  moz: defaultBotStats,
  uptime: defaultBotStats,
  openai: defaultBotStats,
  claude: defaultBotStats,
};

const defaultSegmentSummary: SegmentSummary = {
  total_segments: 0,
  total_segment_requests: 0,
  average_requests_per_segment: 0,
};

const defaultTotals: CrawlerTotals = {
  google: 0,
  bing: 0,
  semrush: 0,
  hrefs: 0,
  moz: 0,
  uptime: 0,
  openai: 0,
  claude: 0,
  bot_stats: defaultBotStatsMap,
  status_codes: defaultStatusCodeCounts,
  google_bot_pages: [],
  google_bot_page_frequencies: {},
  bing_bot_pages: [],
  bing_bot_page_frequencies: {},
  openai_bot_pages: [],
  openai_bot_page_frequencies: {},
  claude_bot_pages: [],
  claude_bot_page_frequencies: {},
};

const initialState: LogAnalysisState = {
  entries: [],
  allFilteredLogs: [],
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
    file_count: 0,
    segmentations: [],
    segment_summary: defaultSegmentSummary,
  },
  widgetAggs: {
    file_types: {},
    content: {},
    status_codes: {},
    user_agents: {},
    referrers: {},
    crawler_types: {},
  },
  pathAggregations: {
    entries: [],
    total_unique_paths: 0,
    total_hits: 0,
  },
  isLoading: false,
  error: null,
  filters: {
    status_code: null,
    method: null,
    is_crawler: null,
    search_term: "",
    segment: null,
  },
  activeFilters: {
    search_term: "",
    status_filter: [],
    method_filter: [],
    file_type_filter: [],
    bot_filter: null,
    bot_type_filter: null,
    verified_filter: null,
    sort_key: null,
    sort_dir: null,
    taxonomy_filter: null,
    referer_filter: null,
    referer_categories: [],
    referer_specific: [],
    user_agent_filter: null,
    user_agent_categories: [],
    user_agent_specific: [],
  },
  totalCount: 0,
  currentPage: 1,
  botPathsAggregated: [],
  timelineData: [],
  statusTimelineData: [],
  crawlerTimelineData: [],
  botTypes: [],
};

// Helper functions for merging complex objects
const mergeStatusCodeCounts = (
  existing: StatusCodeCounts,
  incoming: StatusCodeCounts,
): StatusCodeCounts => {
  const mergedCounts = { ...existing.counts };
  for (const [status, count] of Object.entries(incoming.counts)) {
    const statusCode = parseInt(status);
    mergedCounts[statusCode] = (mergedCounts[statusCode] || 0) + count;
  }

  return {
    counts: mergedCounts,
    success_count: existing.success_count + incoming.success_count,
    redirect_count: existing.redirect_count + incoming.redirect_count,
    client_error_count:
      existing.client_error_count + incoming.client_error_count,
    server_error_count:
      existing.server_error_count + incoming.server_error_count,
    other_count: existing.other_count + incoming.other_count,
  };
};

const mergeBotStats = (existing: BotStats, incoming: BotStats): BotStats => {
  // Merge page status codes
  const mergedPageStatusCodes = { ...existing.page_status_codes };
  for (const [page, statusCodes] of Object.entries(
    incoming.page_status_codes,
  )) {
    if (mergedPageStatusCodes[page]) {
      mergedPageStatusCodes[page] = mergeStatusCodeCounts(
        mergedPageStatusCodes[page],
        statusCodes,
      );
    } else {
      mergedPageStatusCodes[page] = statusCodes;
    }
  }

  return {
    count: existing.count + incoming.count,
    status_codes: mergeStatusCodeCounts(
      existing.status_codes,
      incoming.status_codes,
    ),
    pages: [...new Set([...existing.pages, ...incoming.pages])],
    page_frequencies: mergeFrequencyObjects(
      existing.page_frequencies,
      incoming.page_frequencies,
    ),
    page_status_codes: mergedPageStatusCodes,
  };
};

const mergeBotStatsMap = (
  existing: BotStatsMap,
  incoming: BotStatsMap,
): BotStatsMap => ({
  google: mergeBotStats(existing.google, incoming.google),
  bing: mergeBotStats(existing.bing, incoming.bing),
  semrush: mergeBotStats(existing.semrush, incoming.semrush),
  hrefs: mergeBotStats(existing.hrefs, incoming.hrefs),
  moz: mergeBotStats(existing.moz, incoming.moz),
  uptime: mergeBotStats(existing.uptime, incoming.uptime),
  openai: mergeBotStats(existing.openai, incoming.openai),
  claude: mergeBotStats(existing.claude, incoming.claude),
});

const mergeFrequencyObjects = (
  existing: Record<string, BotPageDetails[]> = {},
  incoming: Record<string, BotPageDetails[]> = {},
): Record<string, BotPageDetails[]> => {
  // We use the existing object as-is and just add/update entries.
  // With Zimmer (via state), we don't need to manually deep clone.
  // But this helper might be called on non-proxied data...
  // Let's assume it should return a merged object.
  const merged = { ...existing };

  for (const [url, incomingDetails] of Object.entries(incoming)) {
    if (!merged[url]) {
      merged[url] = [...incomingDetails];
      continue;
    }

    // We don't want to modify the original array, so we create a new one
    const updatedDetails = [...merged[url]];

    // Create a map for existing details for efficient lookup
    const existingDetailsMap = new Map<string, number>();
    updatedDetails.forEach((detail, index) => {
      const key = `${detail.timestamp}_${detail.ip}_${detail.user_agent}`;
      existingDetailsMap.set(key, index);
    });

    // Process incoming details
    for (const newDetail of incomingDetails) {
      const key = `${newDetail.timestamp}_${newDetail.ip}_${newDetail.user_agent}`;
      const existingIdx = existingDetailsMap.get(key);

      if (existingIdx !== undefined) {
        // Update existing entry in the array
        const existingDetail = { ...updatedDetails[existingIdx] };
        existingDetail.frequency += newDetail.frequency;
        existingDetail.response_size += newDetail.response_size;

        if (existingDetail.status_codes && newDetail.status_codes) {
          existingDetail.status_codes = mergeStatusCodeCounts(
            existingDetail.status_codes,
            newDetail.status_codes
          );
        }
        updatedDetails[existingIdx] = existingDetail;
      } else {
        // Add new detail
        updatedDetails.push({ ...newDetail });
      }
    }

    merged[url] = updatedDetails;
  }

  return merged;
};

const mergeSegmentations = (
  existing: Segmentation[],
  incoming: Segmentation[],
): Segmentation[] => {
  const segmentationMap = new Map<string, Segmentation>();

  // Add existing segmentations to map
  existing.forEach((seg) => {
    segmentationMap.set(seg.name, { ...seg });
  });

  // Merge incoming segmentations
  incoming.forEach((incomingSeg) => {
    if (segmentationMap.has(incomingSeg.name)) {
      const existingSeg = segmentationMap.get(incomingSeg.name)!;

      // Merge URLs
      const mergedUrls = [
        ...new Set([...existingSeg.urls, ...incomingSeg.urls]),
      ];

      // Merge status codes
      const mergedStatusCodes = mergeStatusCodeCounts(
        existingSeg.status_codes,
        incomingSeg.status_codes,
      );

      // Merge bot breakdown
      const mergedBotBreakdown = { ...existingSeg.bot_breakdown };
      for (const [bot, count] of Object.entries(incomingSeg.bot_breakdown)) {
        mergedBotBreakdown[bot] = (mergedBotBreakdown[bot] || 0) + count;
      }

      segmentationMap.set(incomingSeg.name, {
        ...existingSeg,
        count: existingSeg.count + incomingSeg.count,
        unique_ips: Math.max(existingSeg.unique_ips, incomingSeg.unique_ips), // Use max since IPs should be unique
        urls: mergedUrls,
        status_codes: mergedStatusCodes,
        bot_breakdown: mergedBotBreakdown,
      });
    } else {
      segmentationMap.set(incomingSeg.name, { ...incomingSeg });
    }
  });

  return Array.from(segmentationMap.values());
};

export const useLogAnalysisStore = create<
  LogAnalysisState & LogAnalysisActions
>()(
  immer((set, get) => ({
    ...initialState,

    setLogData: (data, mode = "append") =>
      set((state) => {
        // Append entries, but cap at 1,000 to prevent browser OOM/crashes
        // The full dataset is safely stored in the backend database
        if (data.entries?.length) {
          if (state.entries.length < 1000) {
            const remaining = 1000 - state.entries.length;
            state.entries.push(...data.entries.slice(0, remaining));
          }
        }

        const existingOverview = state.overview;
        const incomingOverview = data.overview || {};
        const incomingTotals = incomingOverview.totals || {};

        // 1. Handle cumulative counts and top-level overview
        if (mode === "replace") {
          // Replace with backend's cumulative truth
          state.overview = {
            ...existingOverview,
            ...incomingOverview,
            totals: {
              ...incomingTotals,
            },
          };
        } else {
          // Append/Increment counts
          state.overview.line_count += incomingOverview.line_count || 0;
          state.overview.unique_ips += incomingOverview.unique_ips || 0;
          state.overview.unique_user_agents += incomingOverview.unique_user_agents || 0;
          state.overview.crawler_count += incomingOverview.crawler_count || 0;
          state.overview.file_count += incomingOverview.file_count || 0;

          if (incomingOverview.success_rate) {
            state.overview.success_rate = incomingOverview.success_rate;
          }
          if (incomingOverview.log_start_time) {
            state.overview.log_start_time = incomingOverview.log_start_time;
          }
          if (incomingOverview.log_finish_time) {
            state.overview.log_finish_time = incomingOverview.log_finish_time;
          }

          // Increment totals
          state.overview.totals.google += incomingTotals.google || 0;
          state.overview.totals.bing += incomingTotals.bing || 0;
          state.overview.totals.semrush += incomingTotals.semrush || 0;
          state.overview.totals.hrefs += incomingTotals.hrefs || 0;
          state.overview.totals.moz += incomingTotals.moz || 0;
          state.overview.totals.uptime += incomingTotals.uptime || 0;
          state.overview.totals.openai += incomingTotals.openai || 0;
          state.overview.totals.claude += incomingTotals.claude || 0;

          // 2. MERGE additive structures ONLY when appending
          // These are partial in the backend response when appending

          // Merge Status Codes
          if (incomingTotals.status_codes) {
            state.overview.totals.status_codes = mergeStatusCodeCounts(
              state.overview.totals.status_codes,
              incomingTotals.status_codes
            );
          }

          // Merge Bot Stats
          if (incomingTotals.bot_stats) {
            state.overview.totals.bot_stats = mergeBotStatsMap(
              state.overview.totals.bot_stats,
              incomingTotals.bot_stats
            );
          }

          // Merge Segmentations
          if (incomingOverview.segmentations) {
            state.overview.segmentations = mergeSegmentations(
              state.overview.segmentations,
              incomingOverview.segmentations
            );
          }

          // Merge Page Arrays
          if (incomingTotals.google_bot_pages) {
            state.overview.totals.google_bot_pages = [
              ...new Set([
                ...state.overview.totals.google_bot_pages,
                ...incomingTotals.google_bot_pages,
              ]),
            ];
          }
          if (incomingTotals.bing_bot_pages) {
            state.overview.totals.bing_bot_pages = [
              ...new Set([
                ...state.overview.totals.bing_bot_pages,
                ...incomingTotals.bing_bot_pages,
              ]),
            ];
          }
          if (incomingTotals.openai_bot_pages) {
            state.overview.totals.openai_bot_pages = [
              ...new Set([
                ...state.overview.totals.openai_bot_pages,
                ...incomingTotals.openai_bot_pages,
              ]),
            ];
          }
          if (incomingTotals.claude_bot_pages) {
            state.overview.totals.claude_bot_pages = [
              ...new Set([
                ...state.overview.totals.claude_bot_pages,
                ...incomingTotals.claude_bot_pages,
              ]),
            ];
          }

          // Merge Frequencies
          if (incomingTotals.google_bot_page_frequencies) {
            state.overview.totals.google_bot_page_frequencies = mergeFrequencyObjects(
              state.overview.totals.google_bot_page_frequencies,
              incomingTotals.google_bot_page_frequencies
            );
          }
          if (incomingTotals.bing_bot_page_frequencies) {
            state.overview.totals.bing_bot_page_frequencies = mergeFrequencyObjects(
              state.overview.totals.bing_bot_page_frequencies,
              incomingTotals.bing_bot_page_frequencies
            );
          }
          if (incomingTotals.openai_bot_page_frequencies) {
            state.overview.totals.openai_bot_page_frequencies = mergeFrequencyObjects(
              state.overview.totals.openai_bot_page_frequencies,
              incomingTotals.openai_bot_page_frequencies
            );
          }
          if (incomingTotals.claude_bot_page_frequencies) {
            state.overview.totals.claude_bot_page_frequencies = mergeFrequencyObjects(
              state.overview.totals.claude_bot_page_frequencies,
              incomingTotals.claude_bot_page_frequencies
            );
          }
        }


        // Merge Segment Summary
        if (incomingOverview.segment_summary) {
          state.overview.segment_summary = {
            total_segments: Math.max(
              state.overview.segment_summary.total_segments,
              incomingOverview.segment_summary.total_segments
            ),
            total_segment_requests:
              state.overview.segment_summary.total_segment_requests +
              (incomingOverview.segment_summary.total_segment_requests || 0),
            average_requests_per_segment:
              incomingOverview.segment_summary.average_requests_per_segment ||
              state.overview.segment_summary.average_requests_per_segment,
          };
        }

        // Update totalCount to trigger initial loads
        state.totalCount = state.overview.line_count;

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

    fetchLogsFromDb: async (page, limit, filters) => {
      set((state) => {
        state.isLoading = true;
      });
      try {
        const activeFilters = {
          search_term: filters.search_term || "",
          status_filter: filters.status_filter || [],
          method_filter: filters.method_filter || [],
          file_type_filter: filters.file_type_filter || [],
          bot_filter: filters.bot_filter,
          bot_type_filter: filters.bot_type_filter,
          crawler_type_filter: filters.crawler_type_filter,
          verified_filter: filters.verified_filter,
          sort_key: filters.sort_key,
          sort_dir: filters.sort_dir,
          taxonomy_filter: filters.taxonomy_filter,
          referer_filter: filters.referer_filter || null,
          referer_categories: filters.referer_categories || [],
          referer_specific: filters.referer_specific || [],
          user_agent_filter: filters.user_agent_filter || null,
          user_agent_categories: filters.user_agent_categories || [],
          user_agent_specific: filters.user_agent_specific || [],
        };

        const result = await invoke<FilteredLogsPage>("get_active_logs_page", {
          page,
          limit,
          filters: activeFilters,
        });

        set((state) => {
          state.entries = result.entries || [];
          state.totalCount = result.total_count || 0;
          state.currentPage = page;
          state.isLoading = false;
          state.error = null;
        });
      } catch (error) {
        console.error("Failed to fetch logs from DB:", error);
        set((state) => {
          state.isLoading = false;
          state.error = String(error);
        });
      }
    },

    fetchAllFilteredLogs: async (filters) => {
      try {
        set({ isLoading: true, error: null });

        const activeFilters = {
          search_term: filters.search_term || "",
          status_filter: filters.status_filter || [],
          method_filter: filters.method_filter || [],
          file_type_filter: filters.file_type_filter || [],
          bot_filter: filters.bot_filter ?? null,
          bot_type_filter: filters.bot_type_filter ?? null,
          crawler_type_filter: filters.crawler_type_filter ?? null,
          verified_filter: filters.verified_filter ?? null,
          sort_key: filters.sort_key || "timestamp",
          sort_dir: filters.sort_dir || "ascending",
          taxonomy_filter: filters.taxonomy_filter || null,
          referer_filter: filters.referer_filter || null,
          referer_categories: filters.referer_categories || [],
          referer_specific: filters.referer_specific || [],
          user_agent_filter: filters.user_agent_filter || null,
          user_agent_categories: filters.user_agent_categories || [],
          user_agent_specific: filters.user_agent_specific || [],
        };

        const result = await invoke<FilteredLogsPage>(
          "get_all_logs_with_filters",
          { filters: activeFilters }
        );

        set({
          allFilteredLogs: result.entries || [],
          totalCount: result.total_count || 0,
          isLoading: false,
        });

        // Trigger widget aggregations
        get().fetchWidgetAggregations(activeFilters);
      } catch (error) {
        console.error("Failed to fetch all filtered logs:", error);
        set({ error: String(error), isLoading: false });
      }
    },

    fetchWidgetAggregations: async (filters) => {
      try {
        const activeFilters = {
          search_term: filters.search_term || "",
          status_filter: filters.status_filter || [],
          method_filter: filters.method_filter || [],
          file_type_filter: filters.file_type_filter || [],
          bot_filter: filters.bot_filter ?? null,
          bot_type_filter: filters.bot_type_filter ?? null,
          crawler_type_filter: filters.crawler_type_filter ?? null,
          verified_filter: filters.verified_filter ?? null,
          sort_key: filters.sort_key || "timestamp",
          sort_dir: filters.sort_dir || "ascending",
          taxonomy_filter: filters.taxonomy_filter || null,
          referer_filter: filters.referer_filter || null,
          referer_categories: filters.referer_categories || [],
          referer_specific: filters.referer_specific || [],
          user_agent_filter: filters.user_agent_filter || null,
          user_agent_categories: filters.user_agent_categories || [],
          user_agent_specific: filters.user_agent_specific || [],
        };
        const widgetAggs = await invoke<WidgetAggregations>("get_widget_aggregations", {
          filters: activeFilters,
        });
        set({ widgetAggs });
      } catch (error) {
        console.error("Failed to fetch widget aggregations:", error);
      }
    },

    fetchOverviewStats: async () => {
      try {
        const filters = get().activeFilters;
        const overview = await invoke<LogAnalysisOverview>("get_active_logs_stats", { filters });
        set({ overview, totalCount: overview.line_count });
      } catch (error) {
        console.error("Failed to fetch overview stats:", error);
      }
    },

    fetchBotPathsAggregated: async (filters: ActiveFilters) => {
      try {
        const botPathsAggregated = await invoke<BotPathDetail[]>(
          "get_bot_paths_aggregated",
          { filters }
        );
        set({ botPathsAggregated });
      } catch (error) {
        console.error("Failed to fetch bot paths aggregated:", error);
      }
    },

    fetchPathAggregationsPage: async (page, limit, filters) => {
      set({ isLoading: true });
      try {
        const pathAggregations = await invoke<PathAggregationsPage>(
          "get_path_aggregations_page",
          { page, limit, filters }
        );
        set({ pathAggregations, isLoading: false });
      } catch (error) {
        console.error("Failed to fetch path aggregations page:", error);
        set({ isLoading: false });
      }
    },

    fetchTimelineAggregations: async (viewMode, filters) => {
      try {
        const timelineData = await invoke<TimelinePoint[]>(
          "get_timeline_aggregations",
          { viewMode, filters }
        );
        set({ timelineData });
      } catch (error) {
        console.error("Failed to fetch timeline aggregations:", error);
      }
    },

    fetchStatusAggregations: async (viewMode, filters) => {
      try {
        const statusTimelineData = await invoke<StatusPoint[]>(
          "get_status_aggregations",
          { viewMode, filters }
        );
        set({ statusTimelineData });
      } catch (error) {
        console.error("Failed to fetch status aggregations:", error);
      }
    },

    fetchCrawlerAggregations: async (viewMode, filters) => {
      try {
        const crawlerTimelineData = await invoke<CrawlerPoint[]>(
          "get_crawler_aggregations",
          { viewMode, filters }
        );
        set({ crawlerTimelineData });
      } catch (error) {
        console.error("Failed to fetch crawler aggregations:", error);
      }
    },

    fetchBotTypes: async () => {
      try {
        const botTypes = await invoke<string[]>("get_distinct_bot_types");
        set((state) => {
          state.botTypes = botTypes;
        });
      } catch (error) {
        console.error("Failed to fetch bot types:", error);
      }
    },

    setActiveFilters: (filters) =>
      set((state) => {
        state.activeFilters = filters;
      }),

    setTotalCount: (count) =>
      set((state) => {
        state.totalCount = count;
      }),
  })),
);

export const useLogAnalysis = () =>
  useLogAnalysisStore(
    (state) => ({
      entries: state.entries,
      allFilteredLogs: state.allFilteredLogs,
      overview: state.overview,
      widgetAggs: state.widgetAggs,
      isLoading: state.isLoading,
      error: state.error,
      filters: state.filters,
      activeFilters: state.activeFilters,
      totalCount: state.totalCount,
      currentPage: state.currentPage,
      botTypes: state.botTypes,
      setLogData: state.setLogData,
      fetchLogsFromDb: state.fetchLogsFromDb,
      fetchAllFilteredLogs: state.fetchAllFilteredLogs,
      fetchBotTypes: state.fetchBotTypes,
      fetchWidgetAggregations: state.fetchWidgetAggregations,
      setActiveFilters: state.setActiveFilters,
      setFilter: state.setFilter,
      resetFilters: state.resetFilters,
      resetAll: state.resetAll,
      setLoading: state.setLoading,
      setError: state.setError,
      clearEntries: state.clearEntries,
      setTotalCount: state.setTotalCount,
      botPathsAggregated: state.botPathsAggregated,
      fetchBotPathsAggregated: state.fetchBotPathsAggregated,
      pathAggregations: state.pathAggregations,
      fetchPathAggregationsPage: state.fetchPathAggregationsPage,
      fetchOverviewStats: state.fetchOverviewStats,
      timelineData: state.timelineData,
      fetchTimelineAggregations: state.fetchTimelineAggregations,
      statusTimelineData: state.statusTimelineData,
      fetchStatusAggregations: state.fetchStatusAggregations,
      crawlerTimelineData: state.crawlerTimelineData,
      fetchCrawlerAggregations: state.fetchCrawlerAggregations,
    }),
    shallow,
  );
