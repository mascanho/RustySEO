// @ts-nocheck
import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { debounce } from "lodash";
import TableCrawl from "./components/TableCrawl";
import TableCrawlJs from "./JavascriptTable/TableCrawlJs";
import ImagesCrawlTable from "./ImagesTable/ImagesCrawlTable";
import DetailsTable from "./SubTables/DetailsTable/DetailsTable";
import InlinksSubTable from "./SubTables/LinksSubtable/InlinksSubTable";
import OutlinksSubTable from "./SubTables/LinksSubtable/OutlinksSubTable";
import ImagesTable from "./SubTables/ImagesTable/ImagesTable";
import SchemaSubTable from "./SubTables/SchemaSubTable/SchemaSubTable";
import ResizableDivider from "./components/ResizableDivider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVisibilityStore } from "@/store/VisibilityStore";
import useGlobalCrawlStore, { useDataActions } from "@/store/GlobalCrawlDataStore";
import useCrawlStore from "@/store/GlobalCrawlDataStore";
import ResponseHeaders from "./SubTables/Headers/ResponseHeaders";
import TableCrawlCSS from "../Sidebar/CSSTable/TableCrawlCSS";
import LinksTable from "./LinksTable/LinksTable";
import KeywordsTable from "./KeywordsTable/KeywordsTable";
import CoreWebVitalsTable from "./CoreWebVitalsTable/CoreWebVitalsTable";
import InnerLinksDetailsTable from "./SubTables/InnerLinksTable/InnerLinksDetailsTable";

import { shallow } from "zustand/shallow";
import OuterLinksSubTable from "./SubTables/OuterLinksSubTable/OuterLinksSubTable";
import RedirectsTable from "./RedirectsTable/RedirectsTable";
import FilesTable from "./FilesTable/FilesTable";
import OpenGraphPreview from "./SubTables/OpenGraphPreview/OpenGraphPreview";

const BottomTableContent = ({ children, height }) => (
  <div
    style={{
      height: `${height - 34}px`,
      minHeight: "100px",
      overflowY: "auto",
      marginBottom: "0px", // Reduced from 60px
    }}
  >
    {children}
  </div>
);

export default function Home() {
  const [containerHeight, setContainerHeight] = useState(770);
  const [bottomTableHeight, setBottomTableHeight] = useState(218);
  const inlinksTableRef = useRef(null);
  const outlinksTableRef = useRef(null);
  const [activeBottomTab, setActiveBottomTab] = useState("details");
  const containerRef = useRef<HTMLDivElement>(null);

  const { visibility } = useVisibilityStore();
  const { selectedTableURL } = useGlobalCrawlStore();
  const {
    crawlData,
    issuesView,
    setIssuesView,
    issuesData,
    setGenericChart,
    setDeepCrawlTab,
  } = useCrawlStore();
  const [activeTab, setActiveTab] = useState("crawledPages"); // Default to "crawledPages"

  const { inlinks, outlinks } = useGlobalCrawlStore(
    (state) => ({
      inlinks: state.inlinks,
      outlinks: state.outlinks,
    }),
    shallow,
  );

  // Sync `activeTab` with `deepCrawlTab` when it changes from outside
  const { deepCrawlTab: storeDeepCrawlTab } = useGlobalCrawlStore();
  useEffect(() => {
    if (storeDeepCrawlTab && storeDeepCrawlTab !== activeTab) {
      setActiveTab(storeDeepCrawlTab);
    }
  }, [storeDeepCrawlTab]);

  // Sync `activeTab` with `issuesView` when `issuesView` changes
  useEffect(() => {
    if (issuesView) {
      setActiveTab(issuesView);
    }
  }, [issuesView]);

  useEffect(() => {
    if (activeTab === "crawledPages") {
      setGenericChart("general");
    }

    if (activeTab === "Duplicated Titles") {
      setGenericChart("");
    }

    if (activeTab === "404 Response") {
      setGenericChart("");
    }
  }, [activeTab, issuesView]);

  const updateHeight = useCallback(() => {
    const windowHeight = window.innerHeight;
    const newContainerHeight = windowHeight - 144;
    setContainerHeight(newContainerHeight);
    setBottomTableHeight(Math.floor(newContainerHeight / 3));
  }, []);

  const debouncedUpdateHeight = useMemo(
    () => debounce(updateHeight, 100),
    [updateHeight],
  );

  useEffect(() => {
    debouncedUpdateHeight();
    window.addEventListener("resize", debouncedUpdateHeight);
    return () => {
      window.removeEventListener("resize", debouncedUpdateHeight);
      debouncedUpdateHeight.cancel();
    };
  }, [debouncedUpdateHeight]);

  const handleResize = useCallback((newBottomHeight: number) => {
    setBottomTableHeight(newBottomHeight);
  }, []);
  const [debouncedCrawlData, setDebouncedCrawlData] = useState(crawlData);

  const debouncedUpdate = useMemo(() => {
    const baseDelay = crawlData.length > 5000 ? 2000 : 500;
    return debounce(setDebouncedCrawlData, baseDelay);
  }, [crawlData.length]); // Recreate only when length changes

  useEffect(() => {
    debouncedUpdate(crawlData);
    return () => debouncedUpdate.cancel();
  }, [crawlData, debouncedUpdate]);

  // Fetch aggregated data when tab changes
  const { setAggregatedData } = useDataActions();
  const aggregatedData = useGlobalCrawlStore((state) => state.aggregatedData);
  const isFinishedDeepCrawl = useGlobalCrawlStore((state) => state.isFinishedDeepCrawl);

  useEffect(() => {
    const fetchData = async () => {
      const fetchForTab = async () => {
        try {
          if (activeTab === "images") {
            const { invoke } = await import("@tauri-apps/api/core");
            const res = await invoke("get_aggregated_crawl_data_command", { dataType: "images" });
            setAggregatedData({ images: res });
          } else if (activeTab === "javascript") {
            const { invoke } = await import("@tauri-apps/api/core");
            const res = await invoke("get_aggregated_crawl_data_command", { dataType: "scripts" });
            setAggregatedData({ scripts: res });
          } else if (activeTab === "css") {
            const { invoke } = await import("@tauri-apps/api/core");
            const res = await invoke("get_aggregated_crawl_data_command", { dataType: "stylesheets" });
            setAggregatedData({ css: res });
          } else if (activeTab === "internalLinks") {
            const { invoke } = await import("@tauri-apps/api/core");
            const res = await invoke("get_aggregated_crawl_data_command", { dataType: "internal_links" });
            setAggregatedData({ internalLinks: res });
          } else if (activeTab === "externalLinks") {
            const { invoke } = await import("@tauri-apps/api/core");
            const res = await invoke("get_aggregated_crawl_data_command", { dataType: "external_links" });
            setAggregatedData({ externalLinks: res });
          } else if (activeTab === "keywords") {
            const { invoke } = await import("@tauri-apps/api/core");
            const res = await invoke("get_aggregated_crawl_data_command", { dataType: "keywords" });
            setAggregatedData({ keywords: res });
          } else if (activeTab === "redirects") {
            const { invoke } = await import("@tauri-apps/api/core");
            const res = await invoke("get_aggregated_crawl_data_command", { dataType: "redirects" });
            setAggregatedData({ redirects: res });
          } else if (activeTab === "files") {
            const { invoke } = await import("@tauri-apps/api/core");
            const res = await invoke("get_aggregated_crawl_data_command", { dataType: "files" });
            setAggregatedData({ files: res });
          }
        } catch (e) {
          console.error("Error fetching aggregated data:", e);
        }
      };

      // Immediate fetch check
      let shouldFetchImmediate = false;
      if (activeTab === "images" && aggregatedData.images.length === 0) shouldFetchImmediate = true;
      else if (activeTab === "javascript" && aggregatedData.scripts.length === 0) shouldFetchImmediate = true;
      else if (activeTab === "css" && aggregatedData.css.length === 0) shouldFetchImmediate = true;
      else if (activeTab === "internalLinks" && aggregatedData.internalLinks.length === 0) shouldFetchImmediate = true;
      else if (activeTab === "externalLinks" && aggregatedData.externalLinks.length === 0) shouldFetchImmediate = true;
      else if (activeTab === "keywords" && aggregatedData.keywords.length === 0) shouldFetchImmediate = true;
      else if (activeTab === "redirects" && aggregatedData.redirects.length === 0) shouldFetchImmediate = true;
      else if (activeTab === "files" && aggregatedData.files.length === 0) shouldFetchImmediate = true;

      if (shouldFetchImmediate || !isFinishedDeepCrawl) {
        await fetchForTab();
      }
    };

    fetchData();

    // Set up polling if crawl is active
    let intervalId = null;
    if (!isFinishedDeepCrawl) {
      intervalId = setInterval(fetchData, 5000); // Poll every 5 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isFinishedDeepCrawl, setAggregatedData, aggregatedData.images, aggregatedData.scripts, aggregatedData.css, aggregatedData.internalLinks, aggregatedData.externalLinks, aggregatedData.keywords, aggregatedData.redirects, aggregatedData.files]);

  // Filteres all the JS
  const filteredJsArr = useMemo(() => {
    if (activeTab !== "javascript") return [];
    // Use fetched data
    return aggregatedData.scripts.map((url, index) => ({ index: index + 1, url }));
  }, [aggregatedData.scripts, activeTab]);

  // Filters all the CSS
  const filteredCssArr = useMemo(() => {
    if (activeTab !== "css") return [];
    return aggregatedData.css.map((url, index) => ({ index: index + 1, url }));
  }, [aggregatedData.css, activeTab]);

  // Filters all the images
  const filteredImagesArr = useMemo(() => {
    if (activeTab !== "images") return [];
    return aggregatedData.images;
  }, [aggregatedData.images, activeTab]);

  // Filters all the Internal links
  const filteredInternalLinks = useMemo(() => {
    if (activeTab !== "internalLinks") return [];
    // The structure returned by backend is generic JSON link objects, map to what Table expects
    // { link, anchor, status, error, page }
    return aggregatedData.internalLinks.map(link => ({
      link: link.url,
      anchor: link.anchor_text || "",
      status: link.status || null,
      error: link.error || null,
      page: link.page || ""
    }));
  }, [aggregatedData.internalLinks, activeTab]);

  // Filters all the External links
  const filteredExternalLinks = useMemo(() => {
    if (activeTab !== "externalLinks") return [];
    return aggregatedData.externalLinks.map(link => ({
      link: link.url,
      anchor: link.anchor_text || "",
      status: link.status || null,
      error: link.error || null,
      page: link.page || ""
    }));
  }, [aggregatedData.externalLinks, activeTab]);

  // FILTER THE KEYWORDS, make them as value and the url as key
  const filteredKeywords = useMemo(() => {
    if (activeTab !== "keywords") return [];
    // The structure returned by backend is { url, keywords: [] }
    return aggregatedData.keywords;
  }, [aggregatedData.keywords, activeTab]);

  const filteredCustomSearch = useMemo(() => {
    if (activeTab !== "search") return [];
    if (!crawlData) {
      return [];
    }

    const customSearch = crawlData.filter(
      (search) => search?.extractor?.html === true,
    );
    return customSearch;
  }, [debouncedCrawlData, activeTab]);

  // Filters all files
  const filteredFilesArr = useMemo(() => {
    if (activeTab !== "files") return [];
    // Structure: { url, found_at: page }
    // We need to derive 'filetype' from url
    return aggregatedData.files.map((f, index) => {
      const ext = f.url.split('.').pop()?.split(/[?#]/)[0]?.toUpperCase() || "UNKNOWN";
      return {
        id: index + 1,
        url: f.url,
        filetype: ext,
        found_at: f.found_at || f.page || ""
      };
    });
  }, [aggregatedData.files, activeTab]);

  // Redirects logic - new 
  const filteredRedirects = useMemo(() => {
    if (activeTab !== "redirects") return [];
    return aggregatedData.redirects;
  }, [aggregatedData.redirects, activeTab]);

  const renderIssuesViewContent = () => {
    switch (issuesView) {
      case "Duplicated Titles":
        return <div>Content for Duplicated Titles</div>;
      case "404 response":
        return <div>Content for 404 response</div>;
      // Add more cases as needed
      default:
        return <div>Default Content</div>;
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    setDeepCrawlTab(value);
    if (value === issuesView) {
      // If the tab is the issuesView tab, ensure issuesView is updated
      setIssuesView(value);
    }
  };

  return (
    <div
      className={`mx-0 mt-[2rem] h-screen dark:bg-brand-darker ${visibility.sidebar ? "w-[calc(100vw-26rem)]" : ""}`}
    >
      <div
        ref={containerRef}
        className="bg-white rounded-md"
        style={{ height: `${containerHeight}px` }}
      >
        <div
          style={{
            height: `${containerHeight - bottomTableHeight}px`,
            minHeight: "100px",
          }}
        >
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="h-full flex dark:bg-brand-darker flex-col"
          >
            <TabsList className="w-full justify-start dark:bg-brand-darker dark:border-brand-dark border-t-0 -mb-2 bg-gray-50 rounded-none">
              <TabsTrigger value="crawledPages" className="rounded-t-md">
                HTML
              </TabsTrigger>
              <TabsTrigger value="css" className="rounded-t-md">
                CSS
              </TabsTrigger>
              <TabsTrigger value="javascript" className="rounded-t-md">
                Javascript
              </TabsTrigger>
              <TabsTrigger value="internalLinks" className="rounded-t-md">
                Internal
              </TabsTrigger>
              <TabsTrigger value="externalLinks" className="rounded-t-md">
                External
              </TabsTrigger>
              <TabsTrigger value="images" className="rounded-t-md">
                Images
              </TabsTrigger>
              <TabsTrigger value="keywords" className="rounded-t-md">
                Keywords
              </TabsTrigger>
              <TabsTrigger value="cwv" className="rounded-t-md">
                Core Web Vitals
              </TabsTrigger>{" "}
              <TabsTrigger value="search" className="rounded-t-md">
                Custom Search
              </TabsTrigger>
              <TabsTrigger value="redirects" className="rounded-t-md">
                Redirects
              </TabsTrigger>
              <TabsTrigger value="files" className="rounded-t-md">
                Files
              </TabsTrigger>
              {issuesView && (
                <TabsTrigger value={issuesView} className="rounded-t-md">
                  {issuesView}
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent
              value="crawledPages"
              className="flex-grow overflow-hidden"
            >
              <TableCrawl tabName={"AllData"} rows={debouncedCrawlData} />
            </TabsContent>

            <TabsContent className="flex-grow overflow-hidden" value="css">
              <TableCrawlCSS rows={filteredCssArr} tabName={"All CSS "} />
            </TabsContent>

            <TabsContent
              value="javascript"
              className="flex-grow overflow-hidden"
            >
              <TableCrawlJs tabName={"Javascript"} rows={filteredJsArr} />
            </TabsContent>

            <TabsContent
              value="internalLinks"
              className="flex-grow overflow-hidden"
            >
              <LinksTable tabName={"All Links"} rows={filteredInternalLinks} />
            </TabsContent>

            <TabsContent
              value="externalLinks"
              className="flex-grow overflow-hidden"
            >
              <LinksTable tabName={"All Links"} rows={filteredExternalLinks} />
            </TabsContent>
            <TabsContent value="images" className="flex-grow overflow-hidden">
              <ImagesCrawlTable
                tabName={"All Images"}
                rows={filteredImagesArr}
              />
            </TabsContent>

            <TabsContent value="keywords" className="flex-grow overflow-hidden">
              <KeywordsTable rows={filteredKeywords} tabName="All Keywords" />
            </TabsContent>

            {/* CORE WEB VITALS TABLe */}
            <TabsContent value="cwv" className="flex-grow overflow-hidden">
              <CoreWebVitalsTable tabName={"AllData"} rows={crawlData} />
            </TabsContent>

            {/* CUSTOM SEARCH */}
            <TabsContent value="search" className="flex-grow overflow-hidden">
              <TableCrawl
                rows={filteredCustomSearch}
                tabName={"Custom Search"}
              />
            </TabsContent>

            <TabsContent
              value="redirects"
              className="flex-grow overflow-hidden"
            >
              <RedirectsTable tabName={"AllData"} rows={filteredRedirects} />
            </TabsContent>
            <TabsContent value="files" className="flex-grow overflow-hidden">
              <FilesTable tabName={"All Files"} rows={filteredFilesArr} />
            </TabsContent>
            {/* DYNAMIC TABS */}
            {issuesView && (
              <TabsContent
                value={issuesView}
                className="flex-grow overflow-hidden"
              >
                {/* {renderIssuesViewContent()} */}
                <TableCrawl tabName={issuesView} rows={issuesData || []} />
              </TabsContent>
            )}
          </Tabs>
        </div>
        <ResizableDivider onResize={handleResize} containerRef={containerRef} />
        <div
          className="dark:bg-brand-darker h-auto relative"
          style={{ height: `${bottomTableHeight}px`, minHeight: "100px", overflow: "hidden" }}
        >
          <Tabs
            value={activeBottomTab}
            onValueChange={setActiveBottomTab}
            className="h-full flex flex-col"
          >
            <div className="relative">
              <TabsList className="w-full justify-start dark:bg-brand-darker dark:border-brand-dark border-t bg-slate-50 rounded-none">
                <TabsTrigger value="details" className="rounded-t-md">
                  Details
                </TabsTrigger>
                <TabsTrigger value="inlinks" className="rounded-t-md">
                  Inlinks
                </TabsTrigger>
                <TabsTrigger value="outlinks" className="rounded-t-md">
                  Outlinks
                </TabsTrigger>
                <TabsTrigger value="images" className="rounded-t-md">
                  Images
                </TabsTrigger>
                <TabsTrigger value="schema" className="rounded-t-md">
                  Schema
                </TabsTrigger>
                <TabsTrigger value="headers" className="rounded-t-md">
                  Headers
                </TabsTrigger>
                <TabsTrigger value="opengraph" className="rounded-t-md">
                  OpenGraph
                </TabsTrigger>

                {/* Export button for Inlinks tab */}
                {activeBottomTab === "inlinks" && (
                  <button
                    onClick={() => inlinksTableRef.current?.exportCSV?.()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs border border-brand-bright dark:border-brand-bright px-2 py-0.5 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors dark:text-white/80 bg-white dark:bg-brand-dark shadow-sm"
                  >
                    Export
                  </button>
                )}

                {/* Export button for Outlinks tab */}
                {activeBottomTab === "outlinks" && (
                  <button
                    onClick={() => outlinksTableRef.current?.exportCSV?.()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs border border-brand-bright dark:border-brand-bright px-2 py-0.5 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors dark:text-white/80 bg-white dark:bg-brand-dark shadow-sm"
                  >
                    Export
                  </button>
                )}
              </TabsList>
            </div>

            <TabsContent
              value="details"
              className="flex-1 min-h-0 mt-0 overflow-hidden"
            >
              <DetailsTable
                data={selectedTableURL}
                height={bottomTableHeight}
              />
            </TabsContent>
            <TabsContent
              value="inlinks"
              className="flex-1 min-h-0 mt-0 overflow-hidden"
            >
              <InnerLinksDetailsTable
                ref={inlinksTableRef}
                data={inlinks}
                height={bottomTableHeight}
              />
            </TabsContent>
            <TabsContent
              value="outlinks"
              className="flex-1 min-h-0 mt-0 overflow-hidden"
            >
              <OuterLinksSubTable
                ref={outlinksTableRef}
                data={outlinks}
                height={bottomTableHeight}
              />
            </TabsContent>
            <TabsContent
              value="images"
              className="flex-1 min-h-0 mt-0 overflow-hidden"
            >
              <ImagesTable height={bottomTableHeight} />
            </TabsContent>
            <TabsContent
              value="schema"
              className="flex-1 min-h-0 mt-0 overflow-hidden"
            >
              <SchemaSubTable height={bottomTableHeight} />
            </TabsContent>

            <TabsContent
              value="headers"
              className="flex-1 min-h-0 mt-0 overflow-hidden"
            >
              <ResponseHeaders
                data={selectedTableURL}
                height={bottomTableHeight}
              />
            </TabsContent>

            <TabsContent
              value="opengraph"
              className="flex-1 min-h-0 mt-0 overflow-hidden"
            >
              <OpenGraphPreview height={bottomTableHeight} />
            </TabsContent>

            {/* <TabsContent */}
            {/*   value="innerLinks" */}
            {/*   className="relative z-0" */}
            {/* ></TabsContent> */}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
