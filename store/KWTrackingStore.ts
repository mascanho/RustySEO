// store/keywordsStore.ts
import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { toast } from "sonner";

interface KeywordData {
  id: string;
  keyword: string;
  url: string;
  current_impressions: number;
  initial_impressions: number;
  current_clicks: number;
  initial_clicks: number;
  current_position: number;
  initial_position: number;
  date_added: string;
}

interface KeywordsStore {
  data: KeywordData[];
  isLoading: boolean;
  isRefreshing: boolean;
  searchTerm: string;
  currentPage: number;
  itemsPerPage: number;
  fetchKeywordsData: () => Promise<void>;
  refreshData: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (count: number) => void;
  handleDelete: (id: string) => Promise<void>;
  filteredData: KeywordData[];
  currentData: KeywordData[];
  totalPages: number;
}

export const useKeywordsStore = create<KeywordsStore>((set, get) => ({
  data: [],
  isLoading: true,
  isRefreshing: false,
  searchTerm: "",
  currentPage: 1,
  itemsPerPage: 10,

  fetchKeywordsData: async () => {
    try {
      set({ isLoading: true });
      const response = await invoke<KeywordData[]>(
        "fetch_keywords_summarized_matched_command",
      );
      set({ data: response });
    } catch (error) {
      toast.error("Failed to fetch data");
      console.error("Error fetching data:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  refreshData: async () => {
    try {
      set({ isRefreshing: true });
      await invoke("refresh_keywords_data");
      await get().fetchKeywordsData();
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
      console.error("Error refreshing data:", error);
    } finally {
      set({ isRefreshing: false });
    }
  },

  setSearchTerm: (term: string) => set({ searchTerm: term, currentPage: 1 }),

  setCurrentPage: (page: number) => set({ currentPage: page }),

  setItemsPerPage: (count: number) =>
    set({ itemsPerPage: count, currentPage: 1 }),

  handleDelete: async (id: string) => {
    if (!id) {
      toast.error("No keyword ID provided");
      return;
    }

    try {
      await invoke("delete_keyword_command", { id: String(id) });
      await emit("keyword-tracked", { action: "delete", id });

      set((state) => ({
        data: state.data.filter((item) => item.id !== id),
        currentPage:
          state.currentData.length <= 1 && state.currentPage > 1
            ? state.currentPage - 1
            : state.currentPage,
      }));

      toast.success("Keyword deleted successfully");
    } catch (error) {
      toast.error("Failed to delete keyword");
      console.error("Delete error:", error);
    }
  },

  get filteredData() {
    const { data, searchTerm } = get();
    if (!data || data.length === 0) return [];

    const term = searchTerm.toLowerCase();
    return data.filter((item) => {
      const keyword = item.keyword?.toLowerCase() || "";
      const url = item.url?.toLowerCase() || "";
      return keyword.includes(term) || url.includes(term);
    });
  },

  get totalPages() {
    return Math.ceil(get().filteredData.length / get().itemsPerPage);
  },

  get currentData() {
    const { filteredData, currentPage, itemsPerPage } = get();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  },
}));

// Utility functions (can be moved to a separate file)
export const calculateChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};
