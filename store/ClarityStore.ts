import { create } from "zustand";

interface ClarityState {
    data: any[];
    lastRefreshed: Date | null;
    setData: (data: any[]) => void;
    setLastRefreshed: (date: Date) => void;
}

export const useClarityStore = create<ClarityState>((set) => ({
    data: [],
    lastRefreshed: null,
    setData: (data) => set({ data }),
    setLastRefreshed: (date) => set({ lastRefreshed: date }),
}));
