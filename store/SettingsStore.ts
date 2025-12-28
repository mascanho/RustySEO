// @ts-nocheck
import { create } from "zustand";
import { api } from "@/lib/api";

export interface SettingsState {
  // PSI Settings
  pageSpeedKey: string | null;
  pageSpeedBulk: boolean;

  // GA4 Settings
  ga4Id: string | null;

  // Clarity Settings
  clarityApi: string;

  // AI Model Settings
  aiModel: string;

  // Last updated timestamp
  lastUpdated: number;

  // Actions
  setPageSpeedKey: (key: string | null) => void;
  setPageSpeedBulk: (enabled: boolean) => void;
  setGa4Id: (id: string | null) => void;
  setClarityApi: (api: string) => void;
  setAiModel: (model: string) => void;
  refreshSettings: () => Promise<void>;
  triggerRefresh: () => void;
}

const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial state
  pageSpeedKey: null,
  pageSpeedBulk: false,
  ga4Id: null,
  clarityApi: "",
  aiModel: "none",
  lastUpdated: 0,

  // Setters
  setPageSpeedKey: (key) => set({ pageSpeedKey: key, lastUpdated: Date.now() }),
  setPageSpeedBulk: (enabled) => set({ pageSpeedBulk: enabled, lastUpdated: Date.now() }),
  setGa4Id: (id) => set({ ga4Id: id, lastUpdated: Date.now() }),
  setClarityApi: (api) => set({ clarityApi: api, lastUpdated: Date.now() }),
  setAiModel: (model) => set({ aiModel: model, lastUpdated: Date.now() }),

  // Refresh from backend
  refreshSettings: async () => {
    try {
      const settings = await api.getSettings().catch(() => null);

      if (settings) {
        set({
          aiModel: settings.ai_model_check || settings.ai_model || "none",
          pageSpeedKey: settings.page_speed_key || null,
          pageSpeedBulk: settings.page_speed_bulk || false,
          ga4Id: settings.ga4_id,
          clarityApi: settings.clarity_command || "",
          lastUpdated: Date.now(),
        });
      }
    } catch (error) {
      console.error("[SettingsStore] Failed to refresh settings:", error);
    }
  },

  // Trigger a refresh (useful for components to force update)
  triggerRefresh: () => {
    get().refreshSettings();
  },
}));

export default useSettingsStore;
