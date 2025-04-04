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
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import useCrawlStore from "@/store/GlobalCrawlDataStore";
import ResponseHeaders from "./SubTables/Headers/ResponseHeaders";
import TableCrawlCSS from "../Sidebar/CSSTable/TableCrawlCSS";
import LinksTable from "./LinksTable/LinksTable";
import KeywordsTable from "./KeywordsTable/KeywordsTable";

const BottomTableContent = ({ children, height }) => (
  <div
    style={{
      height: `${height - 40}px`,
      minHeight: "100px",
      overflowY: "auto",
      marginBottom: "80px",
    }}
  >
    {children}
  </div>
);

export default function Home() {
  const [containerHeight, setContainerHeight] = useState(600);
  const [bottomTableHeight, setBottomTableHeight] = useState(200);
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

  // Filteres all the JS
  const filteredJsArr = useMemo(() => {
    const jsSet = new Set<string>();
    debouncedCrawlData.forEach((item) => {
      if (item.javascript?.external) {
        item.javascript.external.forEach((link) => jsSet.add(link));
      }
    });
    return Array.from(jsSet).map((url, index) => ({ index: index + 1, url }));
  }, [debouncedCrawlData]);

  // Filters all the CSS
  const filteredCssArr = useMemo(() => {
    const cssSet = new Set<string>();
    debouncedCrawlData?.forEach((item) => {
      item?.css?.external?.forEach((link) => cssSet.add(link));
    });
    return Array.from(cssSet).map((url, index) => ({ index: index + 1, url }));
  }, [debouncedCrawlData]);

  // Filters all the images
  const filteredImagesArr = useMemo(() => {
    const imagesArr = crawlData.map((page) => page?.images?.Ok).flat();
    return imagesArr.filter(
      (image, index) => imagesArr.indexOf(image) === index,
    );
  }, [debouncedCrawlData]);

  // Filters all the links
  const filteredLinks = useMemo(() => {
    const linksWithAnchors = [];
    const uniqueLinks = new Set();

    debouncedCrawlData.forEach((item) => {
      // Process external links with status codes
      item?.anchor_links?.external?.links?.forEach((link, index) => {
        if (link && !uniqueLinks.has(link)) {
          uniqueLinks.add(link);

          // Find matching status code
          const statusInfo = item?.inoutlinks_status_codes?.[1]?.find(
            (status) => status.url === link,
          );

          linksWithAnchors.push({
            link: link,
            anchor: item?.anchor_links?.external?.anchors?.[index] || "",
            status: statusInfo?.status || null,
            error: statusInfo?.error || null,
          });
        }
      });

      // Process internal links with status codes
      item?.anchor_links?.internal?.links?.forEach((link, index) => {
        if (link && !uniqueLinks.has(link)) {
          uniqueLinks.add(link);

          // Find matching status code
          const statusInfo = item?.inoutlinks_status_codes?.[0]?.find(
            (status) => status.url === link,
          );

          linksWithAnchors.push({
            link: link,
            anchor: item?.anchor_links?.internal?.anchors?.[index] || "",
            status: statusInfo?.status || null,
            error: statusInfo?.error || null,
          });
        }
      });
    });

    return linksWithAnchors;
  }, [debouncedCrawlData]);

  // FILTER THE KEYWORDS, make them as value and the url as key
  const filteredKeywords = useMemo(() => {
    const urlKeywordsArray = []; // Array to store objects with URLs and keywords

    debouncedCrawlData?.forEach((url) => {
      const urlString = url?.url; // Extract the URL
      const keywords = url?.keywords || []; // Extract keywords for the current URL

      // Add an object with the URL and its keywords to the array
      urlKeywordsArray.push({
        url: urlString,
        keywords: keywords,
      });
    });

    return urlKeywordsArray; // Return the array
  }, [debouncedCrawlData]);

  const filteredCustomSearch = useMemo(() => {
    // Early return if no crawlData
    if (!crawlData) {
      return [];
    }

    const customSearch = crawlData.filter(
      (search) => search.extractor.html === true,
    );
    return customSearch;
  }, [debouncedCrawlData]);

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
      className={`mx-0 mt-[2rem] h-screen dark:bg-brand-darker ${visibility.sidebar ? "w-[calc(100vw-20.4rem)]" : ""}`}
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
              <TabsTrigger value="links" className="rounded-t-md">
                Links
              </TabsTrigger>
              <TabsTrigger value="images" className="rounded-t-md">
                Images
              </TabsTrigger>
              <TabsTrigger value="keywords" className="rounded-t-md">
                Keywords
              </TabsTrigger>
              <TabsTrigger value="search" className="rounded-t-md">
                Custom Search
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
              <TableCrawl tabName={"AllData"} rows={crawlData} />
            </TabsContent>

            <TabsContent value="css">
              <TableCrawlCSS rows={filteredCssArr} tabName={"All CSS "} />
            </TabsContent>

            <TabsContent
              value="javascript"
              className="flex-grow overflow-hidden"
            >
              <TableCrawlJs tabName={"Javascript"} rows={filteredJsArr} />
            </TabsContent>

            <TabsContent value="links" className="flex-grow overflow-hidden">
              <LinksTable tabName={"All Links"} rows={filteredLinks} />
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

            {/* CUSTOM SEARCH */}
            <TabsContent value="search" className="flex-grow overflow-hidden">
              <TableCrawl
                rows={filteredCustomSearch}
                tabName={"Custom Search"}
              />
            </TabsContent>

            {/* DYNAMIC TABS */}
            {issuesView && (
              <TabsContent
                value={issuesView}
                className="flex-grow overflow-hidden"
              >
                {/* {renderIssuesViewContent()} */}
                <TableCrawl tabName={issuesView} rows={issuesData} />
              </TabsContent>
            )}
          </Tabs>
        </div>
        <ResizableDivider onResize={handleResize} containerRef={containerRef} />
        <div
          className="overflow-hidden dark:bg-brand-darker h-auto relative"
          style={{ height: `${bottomTableHeight}px`, minHeight: "100px" }}
        >
          <Tabs value={activeBottomTab} onValueChange={setActiveBottomTab}>
            <TabsList className="w-full justify-start dark:bg-brand-darker dark:border-brand-dark border-t -mb-2 bg-gray-50 rounded-none sticky top-0">
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
            </TabsList>
            <TabsContent value="details">
              <DetailsTable
                data={selectedTableURL}
                height={bottomTableHeight}
              />
            </TabsContent>
            <TabsContent value="inlinks">
              <BottomTableContent height={bottomTableHeight}>
                <InlinksSubTable data={selectedTableURL} />
              </BottomTableContent>
            </TabsContent>
            <TabsContent value="outlinks">
              <BottomTableContent height={bottomTableHeight}>
                <OutlinksSubTable data={selectedTableURL} />
              </BottomTableContent>
            </TabsContent>
            <TabsContent value="images">
              <BottomTableContent height={bottomTableHeight}>
                <ImagesTable />
              </BottomTableContent>
            </TabsContent>
            <TabsContent value="schema">
              <SchemaSubTable height={bottomTableHeight - 50} />
            </TabsContent>

            <TabsContent
              value="headers"
              style={{
                height: `${bottomTableHeight - 35}px`,
                overflowY: "auto",
              }}
            >
              <ResponseHeaders
                data={selectedTableURL}
                height={bottomTableHeight}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
