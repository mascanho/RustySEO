import create from "zustand";

interface FixesStore {
  missingMetaDescription: boolean;
  missingPagetitle: boolean;
  setMissingMetaDescription: (status: boolean) => void;
  setMissingPagetitle: (status: boolean) => void;
  // Optional: Add a function to update both states together
  setBothStates: (
    metaDescriptionStatus: boolean,
    pageTitleStatus: boolean,
  ) => void;

  fix: string;
  setFix: (fix: string) => void;
}

export const useFixesStore = create<FixesStore>((set) => ({
  // SET THE GLOBAL FIX BEING SELECTED
  fix: "",
  setFix: (fix) => set({ fix }),

  missingMetaDescription: false,
  missingPagetitle: false,

  // Setter for missingMetaDescription
  setMissingMetaDescription: (status) =>
    set((state) => {
      // Example: If missingMetaDescription is set to true, also set missingPagetitle to true
      return { missingMetaDescription: status, missingPagetitle: status };
    }),

  // Setter for missingPagetitle
  setMissingPagetitle: (status) =>
    set((state) => {
      // Example: If missingPagetitle is set to true, also set missingMetaDescription to true
      return { missingPagetitle: status, missingMetaDescription: status };
    }),

  // Optional: Function to update both states together
  setBothStates: (metaDescriptionStatus, pageTitleStatus) =>
    set({
      missingMetaDescription: metaDescriptionStatus,
      missingPagetitle: pageTitleStatus,
    }),
}));
