import { create } from "zustand";

interface GA4Credentials {
    client_id?: string;
    project_id?: string;
    auth_uri?: string;
    token_uri?: string;
    client_secret?: string;
    redirect_uris?: string[];
    [key: string]: any;
}

interface GA4StatusState {
    credentials: GA4Credentials | null;
    isConfigured: boolean;
    isLoading: boolean;
    lastChecked: Date | null;
    error: string | null;

    // Actions
    setCredentials: (credentials: GA4Credentials | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    updateStatus: (credentials: GA4Credentials | null, error?: string) => void;
    clearStatus: () => void;
    refresh: () => Promise<void>;

    // Data persistence
    analyticsData: any;
    startDate: Date | null;
    endDate: Date | null;
    selectedDimension: string;

    // Data Actions
    setAnalyticsData: (data: any) => void;
    setStartDate: (date: Date | null) => void;
    setEndDate: (date: Date | null) => void;
    setSelectedDimension: (dimension: string) => void;

    // Getters
    getIsConfigured: () => boolean;
}

const useGA4StatusStore = create<GA4StatusState>((set, get) => ({
    credentials: null,
    isConfigured: false,
    isLoading: false,
    lastChecked: null,
    error: null,

    // Initial data state
    analyticsData: [],
    startDate: new Date(2022, 0, 1),
    endDate: new Date(),
    selectedDimension: "general",

    setAnalyticsData: (analyticsData) => set({ analyticsData }),
    setStartDate: (startDate) => set({ startDate }),
    setEndDate: (endDate) => set({ endDate }),
    setSelectedDimension: (selectedDimension) => set({ selectedDimension }),

    setCredentials: (credentials) =>
        set((state) => ({
            credentials,
            isConfigured: !!(
                credentials?.client_id &&
                credentials?.project_id &&
                credentials?.client_secret
            ),
            lastChecked: new Date(),
            error: null,
        })),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) =>
        set((state) => ({
            error,
            isLoading: false,
            lastChecked: new Date(),
        })),

    updateStatus: (credentials, error) =>
        set((state) => ({
            credentials,
            isConfigured: !!(
                credentials?.client_id &&
                credentials?.project_id &&
                credentials?.client_secret
            ),
            error: error || null,
            isLoading: false,
            lastChecked: new Date(),
        })),

    clearStatus: () =>
        set({
            credentials: null,
            isConfigured: false,
            isLoading: false,
            lastChecked: null,
            error: null,
            analyticsData: [],
            selectedDimension: "general",
        }),

    refresh: async () => {
        const { invoke } = await import("@tauri-apps/api/core");
        set({ isLoading: true });
        try {
            const credentials = await invoke<GA4Credentials>("read_ga4_credentials_file");
            console.log("Raw GA4 credentials from backend:", credentials);
            get().updateStatus(credentials);
        } catch (error) {
            console.error("Failed to refresh GA4 status:", error);
            get().updateStatus(null, error instanceof Error ? error.message : String(error));
        } finally {
            set({ isLoading: false });
        }
    },

    getIsConfigured: () => {
        const state = get();
        return !!(
            state.credentials?.client_id &&
            state.credentials?.project_id &&
            state.credentials?.client_secret
        );
    },
}));

export default useGA4StatusStore;
export type { GA4Credentials, GA4StatusState };
