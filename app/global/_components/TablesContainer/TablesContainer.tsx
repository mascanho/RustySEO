import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import Table from "./components/Table";
import DetailTable from "./components/DetailTable";
import ResizableDivider from "./components/ResizableDivider";
import type { CellData, TabData } from "./types/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVisibilityStore } from "@/store/VisibilityStore";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { debounce } from "lodash"; // Import debounce from lodash or implement your own
import TableCrawl from "./components/TableCrawl";

export default function Home() {
  const [containerHeight, setContainerHeight] = useState(600);
  const [bottomTableHeight, setBottomTableHeight] = useState(200);
  const [selectedCellData, setSelectedCellData] = useState<CellData | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("crawledPages");
  const containerRef = useRef<HTMLDivElement>(null);

  const { visibility } = useVisibilityStore();
  const { crawlData } = useGlobalCrawlStore();

  // Memoize table structure
  const tableStructure = useMemo(
    () => [
      {
        Header: "URL",
        accessor: "url",
        width: 280,
        getValue: (result: Result) => result.url || "",
      },
    ],
    [],
  );

  // Memoize data transformation
  const data = useMemo(() => {
    try {
      const safeData = Array.isArray(crawlData) ? crawlData : [];
      return safeData.map((result: Result) => {
        return tableStructure.reduce(
          (acc, column) => {
            try {
              acc[column.accessor] = column.getValue(result) ?? null;
            } catch (error) {
              acc[column.accessor] = null;
            }
            return acc;
          },
          {} as Record<string, any>,
        );
      });
    } catch (error) {
      return [];
    }
  }, [crawlData, tableStructure]);

  // Memoize columns
  const columns = useMemo(() => tableStructure, [tableStructure]);

  // Memoize cell details
  const cellDetails = useMemo(
    () => ({
      "0-url": {
        details: {
          url: "https://www.algarvewonders.com",
          protocol: "https",
          domain: "algarvewonders.com",
          subdomain: "www",
          path: "/",
          queryParams: null,
          fragment: null,
        },
        history: [
          { date: "2023-01-01", event: "Domain Registered", user: "Admin" },
          {
            date: "2023-01-15",
            event: "SSL Certificate Installed",
            user: "IT Team",
          },
          { date: "2023-02-01", event: "Website Launched", user: "Admin" },
          {
            date: "2023-03-15",
            event: "URL Structure Updated",
            user: "SEO Specialist",
          },
          {
            date: "2023-04-10",
            event: "Canonical Tag Added",
            user: "Developer",
          },
        ],
        related: [
          { id: 101, name: "Homepage Analytics", relation: "Primary URL" },
          { id: 201, name: "SEO Audit", relation: "Target URL" },
          { id: 301, name: "Performance Report", relation: "Main URL" },
          { id: 401, name: "Sitemap", relation: "Included URL" },
          { id: 501, name: "Robots.txt", relation: "Allowed URL" },
        ],
      },
    }),
    [],
  );

  // Memoize tab data
  const tabData = useMemo(
    () => ({
      crawledPages: { columns, data },
      seoAnalysis: {
        columns: [
          { Header: "ID", accessor: "id", width: 60 },
          { Header: "Page Title", accessor: "pageTitle", width: 250 },
          {
            Header: "Meta Description",
            accessor: "metaDescription",
            width: 300,
          },
          { Header: "H1", accessor: "h1", width: 200 },
          { Header: "Word Count", accessor: "wordCount", width: 120 },
          { Header: "Internal Links", accessor: "internalLinks", width: 120 },
          { Header: "External Links", accessor: "externalLinks", width: 120 },
          { Header: "Images", accessor: "images", width: 100 },
          {
            Header: "Alt Tags Missing",
            accessor: "altTagsMissing",
            width: 140,
          },
          { Header: "Mobile Friendly", accessor: "mobileFriendly", width: 130 },
        ],
        data: data.map(({ id }) => ({ id })),
      },
      technicalDetails: {
        columns: [
          { Header: "ID", accessor: "id", width: 60 },
          { Header: "URL", accessor: "url", width: 200 },
          { Header: "Status Code", accessor: "statusCode", width: 120 },
          {
            Header: "Response Time (ms)",
            accessor: "responseTime",
            width: 150,
          },
          { Header: "Canonical URL", accessor: "canonicalUrl", width: 200 },
          { Header: "Indexable", accessor: "indexable", width: 100 },
          { Header: "SSL", accessor: "ssl", width: 80 },
          { Header: "Mobile Friendly", accessor: "mobileFriendly", width: 130 },
          { Header: "Load Time (s)", accessor: "loadTime", width: 120 },
        ],
        data: data.map(
          ({
            id,
            url,
            statusCode,
            responseTime,
            canonicalUrl,
            indexable,
            ssl,
            mobileFriendly,
            loadTime,
          }) => ({
            id,
            url,
            statusCode,
            responseTime,
            canonicalUrl,
            indexable,
            ssl,
            mobileFriendly,
            loadTime,
          }),
        ),
      },
    }),
    [columns, data],
  );

  // Debounced updateHeight function
  const updateHeight = useCallback(() => {
    const windowHeight = window.innerHeight;
    const newContainerHeight = windowHeight - 144; // Adjust for padding and other elements
    if (newContainerHeight !== containerHeight) {
      setContainerHeight(newContainerHeight);
      setBottomTableHeight(Math.floor(newContainerHeight / 3));
    }
  }, [containerHeight]);

  // Debounced resize handler
  const debouncedUpdateHeight = useMemo(
    () => debounce(updateHeight, 100),
    [updateHeight],
  );

  // Add resize event listener
  useEffect(() => {
    debouncedUpdateHeight();
    window.addEventListener("resize", debouncedUpdateHeight);
    return () => {
      window.removeEventListener("resize", debouncedUpdateHeight);
      debouncedUpdateHeight.cancel(); // Cancel any pending debounced calls
    };
  }, [debouncedUpdateHeight]);

  // Memoize resize handler
  const handleResize = useCallback((newBottomHeight: number) => {
    setBottomTableHeight(newBottomHeight);
  }, []);

  // Memoize cell click handlers
  const handleCellClick = useCallback(
    (rowIndex: number, columnId: string) => {
      const cellKey = `${rowIndex}-${columnId}`;
      setSelectedCellData(cellDetails[cellKey] || null);
    },
    [cellDetails],
  );

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
            <TabsList className="w-full justify-start dark:bg-brand-darker dark:border-brand-dark border-t border-b -mb-2 bg-gray-50 rounded-none">
              <TabsTrigger value="crawledPages">Crawled Pages</TabsTrigger>
              <TabsTrigger value="seoAnalysis">SEO Analysis</TabsTrigger>
              <TabsTrigger value="technicalDetails">
                Technical Details
              </TabsTrigger>
            </TabsList>
            {(Object.keys(tabData) as Array<keyof typeof tabData>).map(
              (tab) => (
                <TabsContent
                  key={tab}
                  value={tab}
                  className="flex-grow overflow-hidden"
                >
                  <TableCrawl rows={crawlData} />

                  {/* <Table */}
                  {/*   columns={tabData[tab].columns} */}
                  {/*   data={tabData[tab].data} */}
                  {/*   onCellClick={handleCellClick} */}
                  {/*   onCellRightClick={handleCellRightClick} */}
                  {/* /> */}
                </TabsContent>
              ),
            )}
          </Tabs>
        </div>
        <ResizableDivider onResize={handleResize} containerRef={containerRef} />
        <div
          className="overflow-scroll dark:bg-brand-darker h-auto"
          style={{ height: `${bottomTableHeight}px`, minHeight: "100px" }}
        >
          <DetailTable data={selectedCellData} />
        </div>
      </div>
    </div>
  );
}
