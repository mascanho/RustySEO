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

export default function Home() {
  const [containerHeight, setContainerHeight] = useState(600);
  const [bottomTableHeight, setBottomTableHeight] = useState(200);
  const [selectedCellData, setSelectedCellData] = useState(null);
  const [activeTab, setActiveTab] = useState("crawledPages");
  const containerRef = useRef<HTMLDivElement>(null);

  const { visibility } = useVisibilityStore();
  const { crawlData } = useGlobalCrawlStore();

  const updateHeight = useCallback(() => {
    const windowHeight = window.innerHeight;
    const newContainerHeight = windowHeight - 300; // Adjust for padding and other elements
    if (newContainerHeight !== containerHeight) {
      setContainerHeight(newContainerHeight);
      setBottomTableHeight(Math.floor(newContainerHeight / 3));
    }
  }, [containerHeight]);

  const debouncedUpdateHeight = useMemo(
    () => debounce(updateHeight, 200),
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

  return (
    <div
      className={`mx-0 mt-8 h-screen dark:bg-brand-darker ${visibility.sidebar ? "w-[calc(100vw-18rem)]" : ""}`}
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
              <TabsTrigger value="seoAnalysis">SEO Analysis</TabsTrigger>
              <TabsTrigger value="technicalDetails">
                Technical Details
              </TabsTrigger>
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
              value="technicalDetails"
              className="flex-grow overflow-hidden"
            >
              {/* <TableCrawl rows={crawlData} /> */}
            </TabsContent>
          </Tabs>
        </div>
        <ResizableDivider onResize={handleResize} containerRef={containerRef} />
        <div
          className="overflow-scroll dark:bg-brand-darker h-auto"
          style={{ height: `${bottomTableHeight}px`, minHeight: "100px" }}
        >
          {/* <DetailTable data={selectedCellData} /> */}
        </div>
      </div>
    </div>
  );
}
