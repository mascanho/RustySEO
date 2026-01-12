import { create } from "zustand";

interface GSCCredentials {
  client_id?: string;
  project_id?: string;
  auth_uri?: string;
  token_uri?: string;
  client_secret?: string;
  redirect_uris?: string[];
  [key: string]: any;
}

interface GSCStatusState {
  credentials: GSCCredentials | null;
  isConfigured: boolean;
  isLoading: boolean;
  lastChecked: Date | null;
  error: string | null;
  showInTable: boolean;
  data: any;
  selectedURLDetails: GscQueryMatch | null;
  startDate: Date | null;
  endDate: Date | null;

  // Actions
  setCredentials: (credentials: GSCCredentials | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateStatus: (credentials: GSCCredentials | null, error?: string) => void;
  clearStatus: () => void;
  refresh: () => Promise<void>;
  setShowInTable: (showInTable: boolean) => void;
  setGSCStoreData: (data: any) => void;
  setSelectedURLDetails: (data: any) => void;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;

  // Getters
  getIsConfigured: () => boolean;
}

interface GscMatch {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  similarity_score: number;
  source_url: string;
}

interface GscQueryMatch {
  url: string;
  matches: GscMatch[];
  total_matches: number;
  confidence_score: number;
  top_queries: string[];
  total_clicks: number;
  total_impressions: number;
  avg_ctr: number;
  avg_position: number;
}

const useGSCStatusStore = create<GSCStatusState>((set, get) => ({
  credentials: null,
  isConfigured: false,
  isLoading: false,
  lastChecked: null,
  error: null,
  showInTable: false,
  data: [],
  selectedURLDetails: null,
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  endDate: new Date(),

  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),

  setSelectedURLDetails: (data: GscQueryMatch | null) =>
    set({ selectedURLDetails: data }),

  setGSCStoreData: (data) => set({ data }),

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
      showInTable: false,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) =>
    set((state) => ({
      error,
      isLoading: false,
      lastChecked: new Date(),
    })),

  setShowInTable: (showInTable) => set({ showInTable }),

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
    }),

  refresh: async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    set({ isLoading: true });
    try {
      const credentials = await invoke<GSCCredentials>("read_credentials_file");
      console.log("Raw GSC credentials from backend:", credentials);
      get().updateStatus(credentials);
    } catch (error) {
      console.error("Failed to refresh GSC status:", error);
      get().updateStatus(
        null,
        error instanceof Error ? error.message : String(error),
      );
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

export default useGSCStatusStore;
export type { GSCCredentials, GSCStatusState };
