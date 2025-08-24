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

  // Actions
  setCredentials: (credentials: GSCCredentials | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateStatus: (credentials: GSCCredentials | null, error?: string) => void;
  clearStatus: () => void;

  // Getters
  getIsConfigured: () => boolean;
}

const useGSCStatusStore = create<GSCStatusState>((set, get) => ({
  credentials: null,
  isConfigured: false,
  isLoading: false,
  lastChecked: null,
  error: null,

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
    }),

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
