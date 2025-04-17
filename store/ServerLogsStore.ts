// @ts-nocheck
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
    is_crawler: boolean;
    crawler_type: string;
    browser: string;
    file_type: string;
}

interface GoogleBotPagesFrequency {
    [key: string]: number;
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
    google_bot_pages_frequency: GoogleBotPagesFrequency;
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
    google_bot_pages_frequency: {},
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
                    line_count: data.overview.line_count || 0,
                    unique_ips: data.overview.unique_ips || 0,
                    unique_user_agents: data.overview.unique_user_agents || 0,
                    crawler_count: data.overview.crawler_count || 0,
                    success_rate: data.overview.success_rate || 0,
                    totals: {
                        ...defaultTotals,
                        ...(data.overview.totals || {}),
                    },
                    log_start_time: data.overview.log_start_time || "",
                    log_finish_time: data.overview.log_finish_time || "",
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
