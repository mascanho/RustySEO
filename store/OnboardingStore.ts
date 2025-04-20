// stores/onboarding.store.ts
import { create } from "zustand";

interface OnboardingStore {
  completed: boolean;
  toggle: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  completed: localStorage.getItem("onboarding") === "true",
  toggle: () =>
    set((state) => {
      const newValue = !state.completed;
      localStorage.setItem("onboarding", String(newValue));
      return { completed: newValue };
    }),
}));
