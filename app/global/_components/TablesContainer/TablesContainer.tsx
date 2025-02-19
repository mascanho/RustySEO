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

const BottomTableContent = ({ children, height }) => (
  <div
    style={{
      height: `${height - 50}px`,
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
  const { crawlData, issuesView, setIssuesView } = useCrawlStore();
  const [activeTab, setActiveTab] = useState("crawledPages"); // Default to "crawledPages"

  // Sync `activeTab` with `issuesView` when `issuesView` changes
  useEffect(() => {
    if (issuesView) {
      setActiveTab(issuesView);
    }
  }, [issuesView]);

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
      className={`mx-0 mt-8 h-screen dark:bg-brand-darker ${visibility.sidebar ? "w-[calc(100vw-20.4rem)]" : ""}`}
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
            <TabsList className="w-full justify-start dark:bg-brand-darker dark:border-brand-dark border-t -mb-2 bg-gray-50 rounded-none">
              <TabsTrigger value="crawledPages">All</TabsTrigger>
              <TabsTrigger value="javascript">Javascript</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              {issuesView && (
                <TabsTrigger value={issuesView}>{issuesView}</TabsTrigger>
              )}
            </TabsList>
            <TabsContent
              value="crawledPages"
              className="flex-grow overflow-hidden"
            >
              <TableCrawl rows={crawlData} />
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

            {/* DYNAMIC TABS */}
            {issuesView && (
              <TabsContent
                value={issuesView}
                className="flex-grow overflow-hidden"
              >
                {renderIssuesViewContent()}
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
            </TabsList>
            <TabsContent value="details">
              <BottomTableContent height={bottomTableHeight}>
                <DetailsTable
                  data={selectedTableURL}
                  height={bottomTableHeight}
                />
              </BottomTableContent>
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
          </Tabs>
        </div>
      </div>
    </div>
  );
}
