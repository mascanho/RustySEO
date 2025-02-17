// @ts-nocheck
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
  isGeneratingExcel: boolean;
}

// Define the Zustand store
interface CrawlStore {
  crawlData: PageDetails[];
  setDomainCrawlData: (data: PageDetails[]) => void;
  addDomainCrawlResult: (result: PageDetails) => void;
  clearDomainCrawlData: () => void;
  domainCrawlLoading: boolean;
  setDomainCrawlLoading: (loading: boolean) => void;
  crawlerType: string;
  setCrawlerType: (type: string) => void;
  issues: string[];
  setIssues: (issues: string[]) => void;
  statusCodes: string[];
  setStatusCodes: (codes: string[]) => void;
  headingsH1: string[];
  setHeadingsH1: (headings: string[]) => void;
  headingsH2: string[];
  setHeadingsH2: (headings: string[]) => void;
  issueRow: string[];
  setIssueRow: (row: string[]) => void;
  selectedTableURL: string[];
  setSelectedTableURL: (row: string[]) => void;
  javascript: string[];
  setJavascript: (row: string[]) => void;
  css: string[];
  setCss: (row: string[]) => void;
  robots: string[];
  setRobots: (row: string[]) => void;
  sitemaps: string[];
  setSitemaps: (row: string[]) => void;
  isGeneratingExcel: boolean;
  setIsGeneratingExcel: (isGenerating: boolean) => void;
}

const useGlobalCrawlStore = create<CrawlStore>((set) => ({
  crawlData: [],
  setDomainCrawlData: (data) => set({ crawlData: data }),
  addDomainCrawlResult: (result) =>
    set((state) => ({ crawlData: [...state.crawlData, result] })),
  clearDomainCrawlData: () => set({ crawlData: [] }),
  domainCrawlLoading: false,
  setDomainCrawlLoading: (loading) => set({ domainCrawlLoading: loading }),
  crawlerType: "spider",
  setCrawlerType: (type) => set({ crawlerType: type }),
  issues: [],
  setIssues: (issues) => set({ issues }),
  statusCodes: [],
  setStatusCodes: (codes) => set({ statusCodes: codes }),
  headingsH1: [],
  setHeadingsH1: (headings) => set({ headingsH1: headings }),
  headingsH2: [],
  setHeadingsH2: (headings) => set({ headingsH2: headings }),
  issueRow: [],
  setIssueRow: (row) => set({ issueRow: row }),
  selectedTableURL: [],
  setSelectedTableURL: (row) => set({ selectedTableURL: row }),
  javascript: [],
  setJavascript: (row) => set({ javascript: row }),
  css: [],
  setCss: (row) => set({ css: row }),
  robots: [],
  setRobots: (row) => set({ robots: row }),
  sitemaps: [],
  setSitemaps: (row) => set({ sitemaps: row }),
  isGeneratingExcel: false,
  setIsGeneratingExcel: (isGenerating) =>
    set({ isGeneratingExcel: isGenerating }),
}));

// Custom hook to use selectors
const useCrawlStore = () => {
  const {
    crawlData,
    setDomainCrawlData,
    addDomainCrawlResult,
    clearDomainCrawlData,
    domainCrawlLoading,
    setDomainCrawlLoading,
    crawlerType,
    setCrawlerType,
    issues,
    setIssues,
    statusCodes,
    setStatusCodes,
    headingsH1,
    setHeadingsH1,
    headingsH2,
    setHeadingsH2,
    issueRow,
    setIssueRow,
    selectedTableURL,
    setSelectedTableURL,
    javascript,
    setJavascript,
    css,
    setCss,
    robots,
    setRobots,
    sitemaps,
    setSitemaps,
    isGeneratingExcel,
    setIsGeneratingExcel,
  } = useGlobalCrawlStore(
    (state) => ({
      crawlData: state.crawlData,
      setDomainCrawlData: state.setDomainCrawlData,
      addDomainCrawlResult: state.addDomainCrawlResult,
      clearDomainCrawlData: state.clearDomainCrawlData,
      domainCrawlLoading: state.domainCrawlLoading,
      setDomainCrawlLoading: state.setDomainCrawlLoading,
      crawlerType: state.crawlerType,
      setCrawlerType: state.setCrawlerType,
      issues: state.issues,
      setIssues: state.setIssues,
      statusCodes: state.statusCodes,
      setStatusCodes: state.setStatusCodes,
      headingsH1: state.headingsH1,
      setHeadingsH1: state.setHeadingsH1,
      headingsH2: state.headingsH2,
      setHeadingsH2: state.setHeadingsH2,
      issueRow: state.issueRow,
      setIssueRow: state.setIssueRow,
      selectedTableURL: state.selectedTableURL,
      setSelectedTableURL: state.setSelectedTableURL,
      javascript: state.javascript,
      setJavascript: state.setJavascript,
      css: state.css,
      setCss: state.setCss,
      robots: state.robots,
      setRobots: state.setRobots,
      sitemaps: state.sitemaps,
      setSitemaps: state.setSitemaps,
      isGeneratingExcel: state.isGeneratingExcel,
      setIsGeneratingExcel: state.setIsGeneratingExcel,
    }),
    shallow,
  );

  return {
    crawlData,
    setDomainCrawlData,
    addDomainCrawlResult,
    clearDomainCrawlData,
    domainCrawlLoading,
    setDomainCrawlLoading,
    crawlerType,
    setCrawlerType,
    issues,
    setIssues,
    statusCodes,
    setStatusCodes,
    headingsH1,
    setHeadingsH1,
    headingsH2,
    setHeadingsH2,
    issueRow,
    setIssueRow,
    selectedTableURL,
    setSelectedTableURL,
    javascript,
    setJavascript,
    css,
    setCss,
    robots,
    setRobots,
    sitemaps,
    setSitemaps,
    isGeneratingExcel,
    setIsGeneratingExcel,
  };
};

export default useCrawlStore;
