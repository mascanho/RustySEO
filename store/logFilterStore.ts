import { create } from "zustand";

interface LogFiltersState {
  searchTerm: string;
  statusFilter: number[];
  methodFilter: string[];
  fileTypeFilter: string[];
  botFilter: string | null;
  sortConfig: {
    key: string;
    direction: "ascending" | "descending";
  } | null;

  // Actions
  setSearchTerm: (term: string) => void;
  setStatusFilter: (filters: number[]) => void;
  setMethodFilter: (filters: string[]) => void;
  setFileTypeFilter: (filters: string[]) => void;
  setBotFilter: (filter: string | null) => void;
  setSortConfig: (
    config: { key: string; direction: "ascending" | "descending" } | null,
  ) => void;
  resetAllFilters: () => void;
  hasActiveFilters: () => boolean;
}

export const useLogFiltersStore = create<LogFiltersState>((set, get) => ({
  // Initial state
  searchTerm: "",
  statusFilter: [],
  methodFilter: [],
  fileTypeFilter: [],
  botFilter: "all",
  sortConfig: null,

  // Actions
  setSearchTerm: (term) => set({ searchTerm: term }),
  setStatusFilter: (filters) => set({ statusFilter: filters }),
  setMethodFilter: (filters) => set({ methodFilter: filters }),
  setFileTypeFilter: (filters) => set({ fileTypeFilter: filters }),
  setBotFilter: (filter) =>
    set({ botFilter: filter === "all" ? null : filter }),
  setSortConfig: (config) => set({ sortConfig: config }),
  resetAllFilters: () =>
    set({
      searchTerm: "",
      statusFilter: [],
      methodFilter: [],
      fileTypeFilter: [],
      botFilter: "all",
      sortConfig: null,
    }),
  hasActiveFilters: () => {
    const {
      searchTerm,
      statusFilter,
      methodFilter,
      fileTypeFilter,
      botFilter,
    } = get();
    return (
      searchTerm !== "" ||
      statusFilter.length > 0 ||
      methodFilter.length > 0 ||
      fileTypeFilter.length > 0 ||
      botFilter !== "all"
    );
  },
}));
