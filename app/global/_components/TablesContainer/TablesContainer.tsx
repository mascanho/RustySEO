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
  const { crawlData, issuesView, setIssuesView, issuesData, setGenericChart } =
    useCrawlStore();
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

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      setDebouncedCrawlData(crawlData);
    }, 1000); // Adjust the debounce delay as needed

    return () => clearTimeout(debounceTimeout);
  }, [crawlData]);

  const filteredJsArr = useMemo(() => {
    const jsSet = new Set<string>();
    debouncedCrawlData.forEach((item) => {
      if (item.javascript?.external) {
        item.javascript.external.forEach((link) => jsSet.add(link));
      }
    });
    return Array.from(jsSet).map((url, index) => ({ index: index + 1, url }));
  }, [debouncedCrawlData]);

  const filteredImagesArr = useMemo(() => {
    const imagesArr = crawlData.map((page) => page?.images?.Ok).flat();
    return imagesArr.filter(
      (image, index) => imagesArr.indexOf(image) === index,
    );
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
              <TabsTrigger value="crawledPages">HTML</TabsTrigger>
              <TabsTrigger value="javascript">Javascript</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="search">Custom Search</TabsTrigger>
              {issuesView && (
                <TabsTrigger value={issuesView}>{issuesView}</TabsTrigger>
              )}
            </TabsList>
            <TabsContent
              value="crawledPages"
              className="flex-grow overflow-hidden"
            >
              <TableCrawl tabName={"AllData"} rows={crawlData} />
            </TabsContent>
            <TabsContent
              value="javascript"
              className="flex-grow overflow-hidden"
            >
              <TableCrawlJs rows={filteredJsArr} />
            </TabsContent>
            <TabsContent value="images" className="flex-grow overflow-hidden">
              <ImagesCrawlTable rows={filteredImagesArr} />
            </TabsContent>

            {/* CUSTOM SEARCH */}
            <TabsContent value="search" className="h-screen overflow-auto">
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
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="inlinks">Inlinks</TabsTrigger>
              <TabsTrigger value="outlinks">Outlinks</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="schema">Schema</TabsTrigger>
              <TabsTrigger value="headers">Headers</TabsTrigger>
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
