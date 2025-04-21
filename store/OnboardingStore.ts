// stores/onboarding.store.ts
import { create } from "zustand";

interface OnboardingStore {
  completed: boolean;
  toggle: () => void;
  setCompleted: (value: boolean) => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  completed:
    typeof window !== "undefined"
      ? localStorage.getItem("onboarding") === "true"
      : false,
  toggle: () =>
    set((state) => {
      const newValue = !state.completed;
      localStorage.setItem("onboarding", String(newValue));
      return { completed: newValue };
    }),
  setCompleted: (value) => {
    localStorage.setItem("onboarding", String(value));
    set({ completed: value });
  },
}));
