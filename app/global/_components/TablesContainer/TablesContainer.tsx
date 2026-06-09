// @ts-nocheck
import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { debounce, throttle } from "lodash";
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
import useGlobalCrawlStore, {
  useDataActions,
} from "@/store/GlobalCrawlDataStore";
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
import PageInternalSubTable from "./SubTables/PageLinksSubTable/PageInternalSubTable";
import PageExternalSubTable from "./SubTables/PageLinksSubTable/PageExternalSubTable";
import { invoke } from "@tauri-apps/api/core";

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
  const pageInternalTableRef = useRef(null);
  const pageExternalTableRef = useRef(null);
  const [activeBottomTab, setActiveBottomTab] = useState("details");
  const containerRef = useRef<HTMLDivElement>(null);

  const { visibility } = useVisibilityStore();

  // Consolidated selector: subscribe to all needed data slices in one call.
  // This means only ONE subscription fires per store update, and `shallow`
  // prevents re-renders when unrelated slices change.
  const {
    selectedTableURL,
    issuesView,
    issuesData,
    inlinks,
    outlinks,
    storeDeepCrawlTab,
    isFinishedDeepCrawl,
  } = useGlobalCrawlStore(
    (state) => ({
      selectedTableURL: state.selectedTableURL,
      issuesView: state.issuesView,
      issuesData: state.issuesData,
      inlinks: state.inlinks,
      outlinks: state.outlinks,
      storeDeepCrawlTab: state.deepCrawlTab,
      isFinishedDeepCrawl: state.isFinishedDeepCrawl,
    }),
    shallow,
  );

  // Consolidated selector for actions — these are stable function references
  // so this selector effectively never triggers a re-render.
  const { setIssuesView, setGenericChart, setDeepCrawlTab } =
    useGlobalCrawlStore(
      (state) => ({
        setIssuesView: state.setIssuesView,
        setGenericChart: state.setGenericChart,
        setDeepCrawlTab: state.setDeepCrawlTab,
      }),
      shallow,
    );
  const [activeTab, setActiveTab] = useState("crawledPages"); // Default to "crawledPages"

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

  const handleResize = useMemo(
    () =>
      throttle((newBottomHeight: number) => {
        setBottomTableHeight(newBottomHeight);
      }, 16),
    [],
  );

  // Read crawlData directly from the store so the HTML table updates in
  // real-time as the backend streams results.
  const crawlData = useGlobalCrawlStore((state) => state.crawlData);

  // Fetch aggregated data when tab changes
  const { setAggregatedData } = useDataActions();
  const aggregatedData = useGlobalCrawlStore(
    (state) => state.aggregatedData,
    shallow,
  );

  // THIS HANDLES THE DATA FETCHING FROM THE DATABSE TO NO OVERWHELM THE MEMORY.
  // ON TAB CLICK IT SHOULD LOAD THE DATA INTO THE RESPECTIVE TAB.
  // TODO: Make this better in the future as it might still be too when crawling is on.
  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      const fetchForTab = async () => {
        try {
          if (activeTab === "images") {
            const res = await invoke("get_aggregated_crawl_data_command", {
              dataType: "images",
            });
            if (isSubscribed) setAggregatedData({ images: res || [] });
          } else if (activeTab === "javascript") {
            const res = await invoke("get_aggregated_crawl_data_command", {
              dataType: "scripts",
            });
            if (isSubscribed) setAggregatedData({ scripts: res || [] });
          } else if (activeTab === "css") {
            const res = await invoke("get_aggregated_crawl_data_command", {
              dataType: "stylesheets",
            });
            if (isSubscribed) setAggregatedData({ css: res || [] });
          } else if (activeTab === "internalLinks") {
            const res = await invoke("get_aggregated_crawl_data_command", {
              dataType: "internal_links",
            });
            if (isSubscribed) setAggregatedData({ internalLinks: res || [] });
          } else if (activeTab === "externalLinks") {
            const res = await invoke("get_aggregated_crawl_data_command", {
              dataType: "external_links",
            });
            if (isSubscribed) setAggregatedData({ externalLinks: res || [] });
          } else if (activeTab === "keywords") {
            const res = await invoke("get_aggregated_crawl_data_command", {
              dataType: "keywords",
            });
            if (isSubscribed) setAggregatedData({ keywords: res || [] });
          } else if (activeTab === "redirects") {
            const res = await invoke("get_aggregated_crawl_data_command", {
              dataType: "redirects",
            });
            if (isSubscribed) setAggregatedData({ redirects: res || [] });
          } else if (activeTab === "cwv") {
            const res = await invoke("get_aggregated_crawl_data_command", {
              dataType: "cwv",
            });
            if (isSubscribed) setAggregatedData({ cwv: res || [] });
          } else if (activeTab === "files") {
            const res = await invoke("get_aggregated_crawl_data_command", {
              dataType: "files",
            });
            if (isSubscribed) setAggregatedData({ files: res || [] });
          }
        } catch (e) {
          console.error("Error fetching aggregated data:", e);
        }
      };

      // Immediate fetch check This is important to avoid unnecessary re-renders
      let shouldFetchImmediate = false;
      const currentData = useGlobalCrawlStore.getState().aggregatedData;

      if (
        activeTab === "images" &&
        (!currentData.images || currentData.images.length === 0)
      )
        shouldFetchImmediate = true;
      else if (
        activeTab === "javascript" &&
        (!currentData.scripts || currentData.scripts.length === 0)
      )
        shouldFetchImmediate = true;
      else if (
        activeTab === "css" &&
        (!currentData.css || currentData.css.length === 0)
      )
        shouldFetchImmediate = true;
      else if (
        activeTab === "internalLinks" &&
        (!currentData.internalLinks || currentData.internalLinks.length === 0)
      )
        shouldFetchImmediate = true;
      else if (
        activeTab === "externalLinks" &&
        (!currentData.externalLinks || currentData.externalLinks.length === 0)
      )
        shouldFetchImmediate = true;
      else if (
        activeTab === "keywords" &&
        (!currentData.keywords || currentData.keywords.length === 0)
      )
        shouldFetchImmediate = true;
      else if (
        activeTab === "redirects" &&
        (!currentData.redirects || currentData.redirects.length === 0)
      )
        shouldFetchImmediate = true;
      else if (
        activeTab === "files" &&
        (!currentData.files || currentData.files.length === 0)
      )
        shouldFetchImmediate = true;
      else if (
        activeTab === "cwv" &&
        (!currentData.cwv || currentData.cwv.length === 0)
      )
        shouldFetchImmediate = true;

      const totalUrlsCrawled =
        useGlobalCrawlStore.getState().streamedCrawledPages;
      // Prevent massive JSON payloads crossing the IPC bridge during large crawls
      const isScaleTooLargeForLive = totalUrlsCrawled > 2000;

      if (
        shouldFetchImmediate ||
        (!isFinishedDeepCrawl && !isScaleTooLargeForLive)
      ) {
        await fetchForTab();
      }
    };

    fetchData();

    // Set up polling if crawl is active
    let intervalId = null;
    if (!isFinishedDeepCrawl) {
      intervalId = setInterval(fetchData, 10000); // Poll every 10 seconds to reduce IPC bottleneck
    }

    return () => {
      isSubscribed = false;
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isFinishedDeepCrawl, setAggregatedData]);

  // Filteres all the JS
  const filteredJsArr = useMemo(() => {
    if (activeTab !== "javascript") return [];
    // Use fetched data
    return (aggregatedData.scripts || []).map((url, index) => ({
      index: index + 1,
      url,
    }));
  }, [aggregatedData.scripts, activeTab]);

  // Filters all the CSS
  const filteredCssArr = useMemo(() => {
    if (activeTab !== "css") return [];
    return (aggregatedData.css || []).map((url, index) => ({
      index: index + 1,
      url,
    }));
  }, [aggregatedData.css, activeTab]);

  // Filters all the images
  const filteredImagesArr = useMemo(() => {
    if (activeTab !== "images") return [];
    return aggregatedData.images || [];
  }, [aggregatedData.images, activeTab]);

  // Filters all the Internal links
  const filteredInternalLinks = useMemo(() => {
    if (activeTab !== "internalLinks") return [];
    // The structure returned by backend is generic JSON link objects, map to what Table expects
    // { link, anchor, status, error, page }
    return (aggregatedData.internalLinks || []).map((link) => ({
      link: link.url,
      anchor: link.anchor_text || "",
      rel: link.rel || "",
      title: link.title || "",
      target: link.target || "",
      status: link.status || null,
      error: link.error || null,
      page: link.page || "",
    }));
  }, [aggregatedData.internalLinks, activeTab]);

  // Filters all the External links
  const filteredExternalLinks = useMemo(() => {
    if (activeTab !== "externalLinks") return [];
    return (aggregatedData.externalLinks || []).map((link) => ({
      link: link.url,
      anchor: link.anchor_text || "",
      rel: link.rel || "",
      title: link.title || "",
      target: link.target || "",
      status: link.status || null,
      error: link.error || null,
      page: link.page || "",
    }));
  }, [aggregatedData.externalLinks, activeTab]);

  // FILTER THE KEYWORDS, make them as value and the url as key
  const filteredKeywords = useMemo(() => {
    if (activeTab !== "keywords") return [];
    // The structure returned by backend is { url, keywords: [] }
    return aggregatedData.keywords || [];
  }, [aggregatedData.keywords, activeTab]);

  const filteredCustomSearch = useMemo(() => {
    if (activeTab !== "search") return [];
    if (!crawlData || !Array.isArray(crawlData)) {
      return [];
    }

    const customSearch = crawlData.filter(
      (search) => search?.extractor?.html === true,
    );
    return customSearch;
  }, [crawlData, activeTab]);

  // Filters all files
  const filteredFilesArr = useMemo(() => {
    if (activeTab !== "files") return [];
    // Structure: { url, found_at: page }
    // We need to derive 'filetype' from url
    return (aggregatedData.files || [])
      .map((f, index) => {
        const ext =
          f.url.split(".").pop()?.split(/[?#]/)[0]?.toUpperCase() || "UNKNOWN";

        // Only include PDF files
        if (ext !== "PDF") {
          return null;
        }

        return {
          id: index + 1,
          url: f.url,
          filetype: ext,
          found_at: f.found_at || f.page || "",
        };
      })
      .filter(Boolean);
  }, [aggregatedData.files, activeTab]);

  // Redirects logic - new
  const filteredRedirects = useMemo(() => {
    if (activeTab !== "redirects") return [];
    return aggregatedData.redirects || [];
  }, [aggregatedData.redirects, activeTab]);

  const renderIssuesViewContent = () => {
    switch (issuesView) {
      case "Duplicated Titles":
        return;
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
            <TabsList className="w-full justify-start dark:bg-brand-darker dark:border-brand-dark border-t-0 -mb-1.5 bg-gray-50 rounded-none">
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
            {activeTab === "crawledPages" && (
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                <TableCrawl tabName={"AllData"} rows={crawlData} />
              </div>
            )}
            {activeTab === "css" && (
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                <TableCrawlCSS rows={filteredCssArr} tabName={"All CSS "} />
              </div>
            )}
            {activeTab === "javascript" && (
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                <TableCrawlJs tabName={"Javascript"} rows={filteredJsArr} />
              </div>
            )}
            {activeTab === "internalLinks" && (
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                <LinksTable
                  tabName={"Internal Links"}
                  rows={filteredInternalLinks}
                />
              </div>
            )}
            {activeTab === "externalLinks" && (
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                <LinksTable
                  tabName={"External Links"}
                  rows={filteredExternalLinks}
                />
              </div>
            )}
            {activeTab === "images" && (
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                <ImagesCrawlTable
                  tabName={"All Images"}
                  rows={filteredImagesArr}
                />
              </div>
            )}
            {activeTab === "keywords" && (
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                <KeywordsTable rows={filteredKeywords} tabName="All Keywords" />
              </div>
            )}
            {activeTab === "cwv" && (
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                <CoreWebVitalsTable
                  tabName={"CoreWebVitals"}
                  rows={
                    aggregatedData?.cwv?.length > 0
                      ? aggregatedData.cwv
                      : crawlData
                  }
                />
              </div>
            )}
            {activeTab === "search" && (
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                <TableCrawl
                  rows={filteredCustomSearch}
                  tabName={"Custom Search"}
                />
              </div>
            )}
            {activeTab === "redirects" && (
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                <RedirectsTable
                  tabName={"Redirects"}
                  rows={filteredRedirects}
                />
              </div>
            )}
            {activeTab === "files" && (
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                <FilesTable tabName={"All Files"} rows={filteredFilesArr} />
              </div>
            )}
            {activeTab === issuesView && issuesView && (
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                {/* <TableCrawl tabName={issuesView} rows={issuesData || []} /> */}
              </div>
            )}
          </Tabs>
        </div>
        <ResizableDivider onResize={handleResize} containerRef={containerRef} />
        <div
          className="dark:bg-brand-darker h-auto relative"
          style={{
            height: `${bottomTableHeight}px`,
            minHeight: "100px",
            overflow: "hidden",
          }}
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

                <TabsTrigger value="pageInternal" className="rounded-t-md">
                  Page Internal
                </TabsTrigger>
                <TabsTrigger value="pageExternal" className="rounded-t-md">
                  Page External
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

                {/* Export button for Page Internal tab */}
                {activeBottomTab === "pageInternal" && (
                  <button
                    onClick={() => pageInternalTableRef.current?.exportCSV?.()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs border border-brand-bright dark:border-brand-bright px-2 py-0.5 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors dark:text-white/80 bg-white dark:bg-brand-dark shadow-sm"
                  >
                    Export
                  </button>
                )}

                {/* Export button for Page External tab */}
                {activeBottomTab === "pageExternal" && (
                  <button
                    onClick={() => pageExternalTableRef.current?.exportCSV?.()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs border border-brand-bright dark:border-brand-bright px-2 py-0.5 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors dark:text-white/80 bg-white dark:bg-brand-dark shadow-sm"
                  >
                    Export
                  </button>
                )}
              </TabsList>
            </div>

            {activeBottomTab === "details" && (
              <div className="flex-1 min-h-0 mt-0 overflow-hidden">
                <DetailsTable
                  data={selectedTableURL}
                  height={bottomTableHeight}
                />
              </div>
            )}
            {activeBottomTab === "inlinks" && (
              <div className="flex-1 min-h-0 mt-0 overflow-hidden">
                <InnerLinksDetailsTable
                  ref={inlinksTableRef}
                  data={inlinks}
                  height={bottomTableHeight}
                />
              </div>
            )}
            {activeBottomTab === "outlinks" && (
              <div className="flex-1 min-h-0 mt-0 overflow-hidden">
                <OuterLinksSubTable
                  ref={outlinksTableRef}
                  data={outlinks}
                  height={bottomTableHeight}
                />
              </div>
            )}
            {activeBottomTab === "images" && (
              <div className="flex-1 min-h-0 mt-0 overflow-hidden">
                <ImagesTable height={bottomTableHeight} />
              </div>
            )}
            {activeBottomTab === "schema" && (
              <div className="flex-1 min-h-0 mt-0 overflow-hidden">
                <SchemaSubTable height={bottomTableHeight} />
              </div>
            )}
            {activeBottomTab === "headers" && (
              <div className="flex-1 min-h-0 mt-0 overflow-hidden">
                <ResponseHeaders
                  data={selectedTableURL}
                  height={bottomTableHeight}
                />
              </div>
            )}
            {activeBottomTab === "opengraph" && (
              <div className="flex-1 min-h-0 mt-0 overflow-hidden">
                <OpenGraphPreview height={bottomTableHeight} />
              </div>
            )}
            {activeBottomTab === "pageInternal" && (
              <div className="flex-1 min-h-0 mt-0 overflow-hidden">
                <PageInternalSubTable
                  ref={pageInternalTableRef}
                  data={selectedTableURL}
                  height={bottomTableHeight}
                />
              </div>
            )}
            {activeBottomTab === "pageExternal" && (
              <div className="flex-1 min-h-0 mt-0 overflow-hidden">
                <PageExternalSubTable
                  ref={pageExternalTableRef}
                  data={selectedTableURL}
                  height={bottomTableHeight}
                />
              </div>
            )}

            <TabsContent
              value="innerLinks"
              className="relative z-0"
            ></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
