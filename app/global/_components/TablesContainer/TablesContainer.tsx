// @ts-nocheck
import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import TableCrawl from "./components/TableCrawl";
import DetailTable from "./components/DetailTable";
import ResizableDivider from "./components/ResizableDivider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVisibilityStore } from "@/store/VisibilityStore";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { debounce } from "lodash";
import Table404 from "./SubTables/404Table";
import LinksSubTable from "./SubTables/LinksSubtable/InlinksSubTable";
import InlinksSubTable from "./SubTables/LinksSubtable/InlinksSubTable";
import OutlinksSubTable from "./SubTables/LinksSubtable/OutlinksSubTable";
import DetailsTable from "./SubTables/DetailsTable/DetailsTable";
import JsTableCrawl from "./JavascriptTable/JsTableCrawl";
import { Filter } from "lucide-react";
import TableCrawlJs from "./JavascriptTable/TableCrawlJs";
import ImagesCrawlTable from "./ImagesTable/ImagesCrawlTable";
import ImagesTable from "./SubTables/ImagesTable/ImagesTable";
import SchemaSubTable from "./SubTables/SchemaSubTable/SchemaSubTable";

export default function Home() {
  const [containerHeight, setContainerHeight] = useState(600);
  const [bottomTableHeight, setBottomTableHeight] = useState(200);
  const [selectedCellData, setSelectedCellData] = useState(null);
  const [activeTab, setActiveTab] = useState("crawledPages");
  const [activeBottomTab, setActiveBottomTab] = useState("details");
  const containerRef = useRef<HTMLDivElement>(null);

  const { visibility } = useVisibilityStore();
  const { crawlData, statusCodes, issues, issueRow, selectedTableURL } =
    useGlobalCrawlStore();

  const updateHeight = useCallback(() => {
    const windowHeight = window.innerHeight;
    const newContainerHeight = windowHeight - 144; // Adjust for padding and other elements
    if (newContainerHeight !== containerHeight) {
      setContainerHeight(newContainerHeight);
      setBottomTableHeight(Math.floor(newContainerHeight / 3));
    }
  }, [containerHeight]);

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

  const handleCellClick = useCallback((rowIndex: number, columnId: string) => {
    const cellKey = `${rowIndex}-${columnId}`;
    setSelectedCellData(cellDetails[cellKey] || null);
  }, []);

  const handleCellRightClick = useCallback(
    (rowIndex: number, columnId: string) => {
      handleCellClick(rowIndex, columnId);
    },
    [handleCellClick],
  );

  // FILTER THE JAVASCRIPT LINKS
  const filteredJavascript = (arr) => {
    const jsSet = new Set();

    arr.forEach((item) => {
      // Add external JavaScript links to the Set
      if (item.javascript?.external) {
        item.javascript.external.forEach((link, index) => jsSet.add(link));
      }
    });

    // Convert the Set to an array
    const jsArr = Array.from(jsSet);

    // MAP the array into an array of objects with the URL and title
    const mappedJsArr = jsArr.map((url, index) => ({ index: index + 1, url }));

    // Return the mapped array
    return mappedJsArr;
  };

  const filteredJsArr = filteredJavascript(crawlData);

  // FILTER THE IMAGES ARR FROM EACH PAGE AND MAP IT TO A NEW ARRAY
  const filteredImages = (arr) => {
    const imagesArr = arr.map((page) => page?.images?.Ok).flat();

    const uniqueImages = imagesArr.filter(
      (image, index) => imagesArr.indexOf(image) === index,
    );

    return uniqueImages;
  };

  const filteredImagesArr = filteredImages(crawlData);

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
            onValueChange={setActiveTab}
            className="h-full flex dark:bg-brand-darker flex-col"
          >
            <TabsList className="w-full justify-start dark:bg-brand-darker dark:border-brand-dark border-t  -mb-2 bg-gray-50 rounded-none ">
              <TabsTrigger value="crawledPages">All</TabsTrigger>
              <TabsTrigger value="javascript">Javascript</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>
            <TabsContent
              value="crawledPages"
              className="flex-grow overflow-hidden"
            >
              <TableCrawl rows={crawlData} />
            </TabsContent>
            <TabsContent
              value="seoAnalysis"
              className="flex-grow overflow-hidden"
            >
              {/* <TableCrawl rows={crawlData} /> */}
            </TabsContent>
            <TabsContent
              value="javascript"
              className="flex-grow overflow-hidden"
            >
              {/* <JsTableCrawl rows={filteredJsArr} /> */}
              <TableCrawlJs rows={filteredJsArr} />
            </TabsContent>
            <TabsContent value="images" className="flex-grow overflow-hidden">
              <ImagesCrawlTable rows={filteredImagesArr} />
            </TabsContent>
          </Tabs>
        </div>
        <ResizableDivider onResize={handleResize} containerRef={containerRef} />
        <div
          className="overflow-hidden dark:bg-brand-darker h-auto relative"
          style={{ height: `${bottomTableHeight}px`, minHeight: "100px" }}
        >
          <Tabs value={activeBottomTab} onValueChange={setActiveBottomTab}>
            <TabsList className="w-full justify-start dark:bg-brand-darker dark:border-brand-dark border-t  -mb-2 bg-gray-50 rounded-none sticky top-0 ">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="inlinks">Inlinks</TabsTrigger>
              <TabsTrigger value="outlinks">Outlinks</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="schema">Schema</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              {/* {issueRow === "404 Response" && <Table404 rows={issues[2]} />} */}
              <div
                style={{
                  height: `${bottomTableHeight - 50}px`,
                  minHeight: "100px",
                  overflowY: "auto",
                  marginBottom: "80px",
                }}
              >
                <DetailsTable
                  data={selectedTableURL}
                  height={bottomTableHeight}
                />
              </div>
            </TabsContent>
            <TabsContent value="inlinks">
              <div
                style={{
                  height: `${bottomTableHeight - 50}px`,
                  minHeight: "100px",
                  overflowY: "auto",
                  marginBottom: "80px",
                }}
              >
                <InlinksSubTable data={selectedTableURL} />
              </div>
            </TabsContent>{" "}
            <TabsContent value="outlinks">
              <div
                style={{
                  height: `${bottomTableHeight - 50}px`,
                  minHeight: "100px",
                  overflowY: "auto",
                  marginBottom: "80px",
                }}
              >
                <OutlinksSubTable data={selectedTableURL} />
              </div>
            </TabsContent>{" "}
            {/* IMAGES SUBTABLE */}
            <TabsContent value="images" className="dark:bg-brand-darker">
              <div
                style={{
                  height: `${bottomTableHeight - 50}px`,
                  minHeight: "100px",
                  overflowY: "auto",
                  marginBottom: "80px",
                }}
              >
                <ImagesTable />
              </div>
            </TabsContent>{" "}
            <TabsContent value="schema">
              <SchemaSubTable height={bottomTableHeight - 50} />
            </TabsContent>{" "}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
