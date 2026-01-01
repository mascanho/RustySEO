import { create } from "zustand";

// Define TypeScript interface for the state
interface OnPageSeoState {
  readingTime: number | null;
  wordCount: number | null;
  readingLevel: string | null;
  textRatio: number | null;
  keywords: any;
  video: any | null;

  setReadingTime: (time: number | null) => void;
  setWordCount: (count: number | null) => void;
  setReadingLevel: (level: string | null) => void;
  setTextRatio: (ratio: number | null) => void;
  setKeywords: (keywords: any) => void;
  setVideo: (video: any | null) => void;
}

// Create the Zustand store with the defined interface
const useContentStore = create<OnPageSeoState>((set) => ({
  readingTime: null,
  wordCount: null,
  readingLevel: null,
  textRatio: null,
  keywords: null,
  video: null,

  setReadingTime: (time) => set(() => ({ readingTime: time })),
  setWordCount: (count) => set(() => ({ wordCount: count })),
  setReadingLevel: (level) => set(() => ({ readingLevel: level })),
  setTextRatio: (ratio) => set(() => ({ textRatio: ratio })),
  setKeywords: (keywords) => set(() => ({ keywords: keywords })),
  setVideo: (video) => set(() => ({ video: video })),
}));

export default useContentStore;
