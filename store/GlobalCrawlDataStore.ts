import { create } from "zustand";
import { shallow } from "zustand/shallow";

// Define the structure of a single page's details
export interface PageDetails {
  url: string;
  title: { title: string; title_len: number }[];
  description: string;
  headings: Record<string, string[]>;
  javascript: { external: string[]; inline: string[] };
  status_code: { response: { statusCode: number; statusText: string } }[];
  indexability: { indexability: number; indexability_reason: string };
  mobile: { mobile: boolean; mobile_score: number };
  loading_time: { loadingTime: number; loadingTimeScore: number };
  images: string[];
  robots: string[];
}

// Define the Zustand store
interface CrawlStore {
  crawlData: PageDetails[];
  domainCrawlLoading: boolean;
  crawlerType: string;
  issues: string[];
  statusCodes: string[];
  headingsH1: string[];
  headingsH2: string[];
  issueRow: string[];
  selectedTableURL: string[];
  javascript: string[];
  css: string[];
  robots: string[];
  sitemaps: string[];
  isGeneratingExcel: boolean;
  summary: string[];
  isFinishedDeepCrawl: boolean;
  genericChart: string;
  issuesView: string;
  issuesData: string[];
  crawlSessionTotalArray: string[];
  isExtracting: boolean;
  totalUrlsCrawled: number;
  streamedCrawledPages: number;
  streamedTotalPages: number;
  deepCrawlTab: string;

  // Actions
  setDomainCrawlData: (data: PageDetails[]) => void;
  addDomainCrawlResult: (result: PageDetails) => void;
  clearDomainCrawlData: () => void;
  setDomainCrawlLoading: (loading: boolean) => void;
  setCrawlerType: (type: string) => void;
  setIssues: (issues: string[]) => void;
  setStatusCodes: (codes: string[]) => void;
  setHeadingsH1: (headings: string[]) => void;
  setHeadingsH2: (headings: string[]) => void;
  setIssueRow: (row: string[]) => void;
  setSelectedTableURL: (row: string[]) => void;
  setJavascript: (row: string[]) => void;
  setCss: (row: string[]) => void;
  setRobots: (row: string[]) => void;
  setSitemaps: (row: string[]) => void;
  setIsGeneratingExcel: (isGenerating: boolean) => void;
  setSummary: (summary: string[]) => void;
  setFinishedDeepCrawl: (isFinished: boolean) => void;
  setGenericChart: (chart: string) => void;
  setIssuesView: (view: string) => void;
  setIssuesData: (data: string[]) => void;
  setCrawlSessionTotalArray: (data: string[]) => void;
  setIsExtracting: (isExtracting: boolean) => void;
  setTotalUrlsCrawled: (total: number) => void;
  setStreamedCrawledPages: (pages: number) => void;
  setStreamedTotalPages: (pages: number) => void;
  setDeepCrawlTab: (tab: string) => void;
}

// Utility function to create setters dynamically
const createSetter =
  <T>(key: keyof CrawlStore) =>
  (value: T) =>
    useGlobalCrawlStore.setState({ [key]: value });

const useGlobalCrawlStore = create<CrawlStore>((set) => ({
  // State
  crawlData: [],
  domainCrawlLoading: false,
  crawlerType: "spider",
  issues: [],
  statusCodes: [],
  headingsH1: [],
  headingsH2: [],
  issueRow: [],
  selectedTableURL: [],
  javascript: [],
  css: [],
  robots: [],
  sitemaps: [],
  isGeneratingExcel: false,
  summary: [],
  isFinishedDeepCrawl: false,
  genericChart: "",
  issuesView: "",
  issuesData: [],
  crawlSessionTotalArray: [],
  isExtracting: false,
  totalUrlsCrawled: 0,
  streamedCrawledPages: 0,
  streamedTotalPages: 0,
  deepCrawlTab: "",

  // Actions
  setDomainCrawlData: createSetter<PageDetails[]>("crawlData"),
  addDomainCrawlResult: (result) =>
    set((state) => ({ crawlData: [...state.crawlData, result] })),
  clearDomainCrawlData: () => set({ crawlData: [] }),
  setDomainCrawlLoading: createSetter<boolean>("domainCrawlLoading"),
  setCrawlerType: createSetter<string>("crawlerType"),
  setIssues: createSetter<string[]>("issues"),
  setStatusCodes: createSetter<string[]>("statusCodes"),
  setHeadingsH1: createSetter<string[]>("headingsH1"),
  setHeadingsH2: createSetter<string[]>("headingsH2"),
  setIssueRow: createSetter<string[]>("issueRow"),
  setSelectedTableURL: createSetter<string[]>("selectedTableURL"),
  setJavascript: createSetter<string[]>("javascript"),
  setCss: createSetter<string[]>("css"),
  setRobots: createSetter<string[]>("robots"),
  setSitemaps: createSetter<string[]>("sitemaps"),
  setIsGeneratingExcel: createSetter<boolean>("isGeneratingExcel"),
  setSummary: createSetter<string[]>("summary"),
  setFinishedDeepCrawl: createSetter<boolean>("isFinishedDeepCrawl"),
  setGenericChart: createSetter<string>("genericChart"),
  setIssuesView: createSetter<string>("issuesView"),
  setIssuesData: createSetter<string[]>("issuesData"),
  setCrawlSessionTotalArray: createSetter<string[]>("crawlSessionTotalArray"),
  setIsExtracting: createSetter<boolean>("isExtracting"),
  setTotalUrlsCrawled: createSetter<number>("totalUrlsCrawled"),
  setStreamedCrawledPages: createSetter<number>("streamedCrawledPages"),
  setStreamedTotalPages: createSetter<number>("streamedTotalPages"),
  setDeepCrawlTab: createSetter<string>("deepCrawlTab"),
}));

// Custom hook to access the store with shallow comparison
const useCrawlStore = () => {
  return useGlobalCrawlStore((state) => state, shallow);
};

export default useCrawlStore;
