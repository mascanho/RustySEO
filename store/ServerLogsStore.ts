// @ts-nocheck
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { shallow } from "zustand/shallow";

// New interfaces for enhanced backend
interface StatusCodeCounts {
  counts: Record<number, number>;
  success_count: number;
  redirect_count: number;
  client_error_count: number;
  server_error_count: number;
  other_count: number;
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
  isLoading: false,
  error: null,
  filters: {
    status_code: null,
    method: null,
    is_crawler: null,
    search_term: "",
    segment: null,
  },
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
  const merged = JSON.parse(JSON.stringify(existing));

  for (const [url, incomingDetails] of Object.entries(incoming)) {
    if (!merged[url]) {
      merged[url] = [...incomingDetails];
      continue;
    }

    // Create a map for existing details for efficient lookup
    const existingDetailsMap = new Map<string, BotPageDetails>();
    merged[url].forEach((detail) => {
      const key = `${detail.timestamp}_${detail.ip}_${detail.user_agent}`;
      existingDetailsMap.set(key, detail);
    });

    // Process incoming details
    for (const newDetail of incomingDetails) {
      const key = `${newDetail.timestamp}_${newDetail.ip}_${newDetail.user_agent}`;

      if (existingDetailsMap.has(key)) {
        // Merge frequencies and response sizes for matching details
        const existingDetail = existingDetailsMap.get(key)!;
        existingDetail.frequency += newDetail.frequency;
        existingDetail.response_size += newDetail.response_size;

        // Merge status codes if they exist
        if (existingDetail.status_codes && newDetail.status_codes) {
          existingDetail.status_codes = mergeStatusCodeCounts(
            existingDetail.status_codes,
            newDetail.status_codes,
          );
        }
      } else {
        // Add new detail
        existingDetailsMap.set(key, { ...newDetail });
      }
    }

    // Update the merged result with the combined details
    merged[url] = Array.from(existingDetailsMap.values());
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
  immer((set) => ({
    ...initialState,

    setLogData: (data) =>
      set((state) => {
        // Append entries
        state.entries = [...state.entries, ...(data.entries || [])];

        // Merge overview
        const existingOverview = state.overview;
        const incomingOverview = data.overview || {};

        state.overview = {
          ...existingOverview,
          message: incomingOverview.message || existingOverview.message,
          line_count:
            existingOverview.line_count + (incomingOverview.line_count || 0),
          unique_ips:
            existingOverview.unique_ips + (incomingOverview.unique_ips || 0),
          unique_user_agents:
            existingOverview.unique_user_agents +
            (incomingOverview.unique_user_agents || 0),
          crawler_count:
            existingOverview.crawler_count +
            (incomingOverview.crawler_count || 0),
          success_rate:
            incomingOverview.success_rate || existingOverview.success_rate,
          file_count:
            existingOverview.file_count + (incomingOverview.file_count || 0),
          log_start_time:
            incomingOverview.log_start_time || existingOverview.log_start_time,
          log_finish_time:
            incomingOverview.log_finish_time ||
            existingOverview.log_finish_time,

          // Merge totals
          totals: {
            ...existingOverview.totals,
            google:
              existingOverview.totals.google +
              (incomingOverview.totals?.google || 0),
            bing:
              existingOverview.totals.bing +
              (incomingOverview.totals?.bing || 0),
            semrush:
              existingOverview.totals.semrush +
              (incomingOverview.totals?.semrush || 0),
            hrefs:
              existingOverview.totals.hrefs +
              (incomingOverview.totals?.hrefs || 0),
            moz:
              existingOverview.totals.moz + (incomingOverview.totals?.moz || 0),
            uptime:
              existingOverview.totals.uptime +
              (incomingOverview.totals?.uptime || 0),
            openai:
              existingOverview.totals.openai +
              (incomingOverview.totals?.openai || 0),
            claude:
              existingOverview.totals.claude +
              (incomingOverview.totals?.claude || 0),

            // Merge bot stats
            bot_stats: incomingOverview.totals?.bot_stats
              ? mergeBotStatsMap(
                  existingOverview.totals.bot_stats,
                  incomingOverview.totals.bot_stats,
                )
              : existingOverview.totals.bot_stats,

            // Merge status codes
            status_codes: incomingOverview.totals?.status_codes
              ? mergeStatusCodeCounts(
                  existingOverview.totals.status_codes,
                  incomingOverview.totals.status_codes,
                )
              : existingOverview.totals.status_codes,

            // Merge page arrays
            google_bot_pages: [
              ...new Set([
                ...existingOverview.totals.google_bot_pages,
                ...(incomingOverview.totals?.google_bot_pages || []),
              ]),
            ],
            bing_bot_pages: [
              ...new Set([
                ...existingOverview.totals.bing_bot_pages,
                ...(incomingOverview.totals?.bing_bot_pages || []),
              ]),
            ],
            openai_bot_pages: [
              ...new Set([
                ...existingOverview.totals.openai_bot_pages,
                ...(incomingOverview.totals?.openai_bot_pages || []),
              ]),
            ],
            claude_bot_pages: [
              ...new Set([
                ...existingOverview.totals.claude_bot_pages,
                ...(incomingOverview.totals?.claude_bot_pages || []),
              ]),
            ],

            // Merge frequency objects
            google_bot_page_frequencies: mergeFrequencyObjects(
              existingOverview.totals.google_bot_page_frequencies,
              incomingOverview.totals?.google_bot_page_frequencies || {},
            ),
            bing_bot_page_frequencies: mergeFrequencyObjects(
              existingOverview.totals.bing_bot_page_frequencies,
              incomingOverview.totals?.bing_bot_page_frequencies || {},
            ),
            openai_bot_page_frequencies: mergeFrequencyObjects(
              existingOverview.totals.openai_bot_page_frequencies,
              incomingOverview.totals?.openai_bot_page_frequencies || {},
            ),
            claude_bot_page_frequencies: mergeFrequencyObjects(
              existingOverview.totals.claude_bot_page_frequencies,
              incomingOverview.totals?.claude_bot_page_frequencies || {},
            ),
          },

          // Merge segmentations
          segmentations: incomingOverview.segmentations
            ? mergeSegmentations(
                existingOverview.segmentations,
                incomingOverview.segmentations,
              )
            : existingOverview.segmentations,

          // Merge segment summary
          segment_summary: incomingOverview.segment_summary
            ? {
                total_segments: Math.max(
                  existingOverview.segment_summary.total_segments,
                  incomingOverview.segment_summary.total_segments,
                ),
                total_segment_requests:
                  existingOverview.segment_summary.total_segment_requests +
                  (incomingOverview.segment_summary.total_segment_requests ||
                    0),
                average_requests_per_segment:
                  incomingOverview.segment_summary
                    .average_requests_per_segment ||
                  existingOverview.segment_summary.average_requests_per_segment,
              }
            : existingOverview.segment_summary,
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
