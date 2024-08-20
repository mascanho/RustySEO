import create from "zustand";

// Define TypeScript interface for the state
interface OnPageSeoState {
  favicon: string[] | null;
  seopagetitle: string | null;
  seodescription: string | null;
  seocanonical: string | null;
  seohreflangs: string[] | null;
  seoopengraph: Record<string, any> | null; // Adjust according to your Open Graph data structure
  seoschema: Record<string, any> | null; // Adjust according to your schema data structure

  setFavicon: (favicon: string[] | null) => void;
  setPagetitle: (title: string | null) => void;
  setDescription: (description: string | null) => void;
  setCanonical: (canonical: string | null) => void;
  setHreflangs: (hreflangs: string[] | null) => void;
  setOpengraph: (opengraph: Record<string, any> | null) => void;
  setSchema: (schema: Record<string, any> | null) => void;
}

// Create the Zustand store with the defined interface
const useOnPageSeo = create<OnPageSeoState>((set) => ({
  favicon: null,
  seopagetitle: null,
  seodescription: null,
  seocanonical: null,
  seohreflangs: null,
  seoopengraph: null,
  seoschema: null,

  setFavicon: (favicon) => set({ favicon }),
  setPagetitle: (title) => set({ seopagetitle: title }),
  setDescription: (description) => set({ seodescription: description }),
  setCanonical: (canonical) => set({ seocanonical: canonical }),
  setHreflangs: (hreflangs) => set({ seohreflangs: hreflangs }),
  setOpengraph: (opengraph) => set({ seoopengraph: opengraph }),
  setSchema: (schema) => set({ seoschema: schema }),
}));

export default useOnPageSeo;
