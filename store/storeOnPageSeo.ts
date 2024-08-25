import create from "zustand";

// Define TypeScript interface for the state
interface OnPageSeoState {
  seoLoading: boolean;
  favicon: string[] | null;
  seopagetitle: string | null;
  seodescription: string | null;
  seocanonical: string | null;
  seohreflangs: string[] | null;
  seoopengraph: Record<string, any> | null; // Adjust according to your Open Graph data structure
  seoschema: Record<string, any> | null; // Adjust according to your schema data structure
  seocharset: string | null;
  seoindexability: string | null;
  seoalttags: string[] | null;
  seostatusCodes: number[] | null;
  seoheadings: number[] | null;
  seoImages: string[] | null;
  seoOpenGraph: Record<string, any> | null;
  seoRenderBlocking: Record<string, any> | null;

  setSeoLoading: (loading: boolean) => void;
  setFavicon: (favicon: string[] | null) => void;
  setPagetitle: (title: string | null) => void;
  setDescription: (description: string | null) => void;
  setCanonical: (canonical: string | null) => void;
  setHreflangs: (hreflangs: string[] | null) => void;
  setOpengraph: (opengraph: Record<string, any> | null) => void;
  setSchema: (schema: Record<string, any> | null) => void;
  setSeoCharset: (seocharset: string | null) => void;
  setSeoIndexability: (seoindexability: string | null) => void;
  setAltTags: (seoalttags: string[] | null) => void;
  setSeoStatusCodes: (seostatusCodes: number[] | null) => void;
  setHeadings: (seoheadings: number[] | null) => void;
  setSeoImages: (seoImages: string[] | null) => void;
  setSeoOpenGraph: (seoOpenGraph: Record<string, any> | null) => void;
  setSeoRenderBlocking: (seoRenderBlocking: Record<string, any> | null) => void;
}

// Create the Zustand store with the defined interface
const useOnPageSeo = create<OnPageSeoState>((set) => ({
  seoLoading: false,
  favicon: null,
  seopagetitle: null,
  seodescription: null,
  seocanonical: null,
  seohreflangs: null,
  seoopengraph: null,
  seoschema: null,
  seocharset: null,
  seoindexability: null,
  seoalttags: null,
  seostatusCodes: null,
  seoheadings: null,
  seoImages: null,
  seoOpenGraph: null,
  seoRenderBlocking: null,

  setSeoLoading: (loading) => set(() => ({ seoLoading: loading })),
  setFavicon: (favicon) => set(() => ({ favicon })),
  setPagetitle: (title) => set(() => ({ seopagetitle: title })),
  setDescription: (description) => set(() => ({ seodescription: description })),
  setCanonical: (canonical) => set(() => ({ seocanonical: canonical })),
  setHreflangs: (hreflangs) => set(() => ({ seohreflangs: hreflangs })),
  setOpengraph: (opengraph) => set(() => ({ seoopengraph: opengraph })),
  setSchema: (schema) => set(() => ({ seoschema: schema })),
  setSeoCharset: (seocharset) => set(() => ({ seocharset })),
  setSeoIndexability: (seoindexability) => set(() => ({ seoindexability })),
  setAltTags: (seoalttags) => set(() => ({ seoalttags })),
  setSeoStatusCodes: (seostatusCodes) => set(() => ({ seostatusCodes })),
  setHeadings: (headings) => set(() => ({ seoheadings: headings })),
  setSeoImages: (seoImages) => set(() => ({ seoImages })),
  setSeoOpenGraph: (seoOpenGraph) => set(() => ({ seoOpenGraph })),
  setSeoRenderBlocking: (seoRenderBlocking) =>
    set(() => ({ seoRenderBlocking })),
}));

export default useOnPageSeo;
