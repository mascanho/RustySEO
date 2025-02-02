// @ts-nocheck
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Table from "./components/Table";
import DetailTable from "./components/DetailTable";
import ResizableDivider from "./components/ResizableDivider";
import type { CellData } from "./types/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVisibilityStore } from "@/store/VisibilityStore";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";

export default function Home() {
  const [containerHeight, setContainerHeight] = useState(600);
  const [bottomTableHeight, setBottomTableHeight] = useState(200);
  const [selectedCellData, setSelectedCellData] = useState<CellData | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("crawledPages");
  const containerRef = useRef<HTMLDivElement>(null);

  const { visibility, showSidebar, hideSidebar } = useVisibilityStore();

  const { crawlData } = useGlobalCrawlStore();

  const tableStructure = [
    // {
    //   Header: "ID",
    //   accessor: "id",
    //   width: 40,
    //   getValue: (result: Result, index: number) => index + 1 || 0,
    // },
    {
      Header: "URL",
      accessor: "url",
      width: 280,
      getValue: (result: Result, index: number) => result.url || "",
    },
    // {
    //   Header: "Response Time",
    //   accessor: "responseTime",
    //   width: 105,
    //   getValue: (result: Result) =>
    //     result?.response_time ? result.response_time.toFixed(4) : "0",
    // },
    // {
    //   Header: "Javascript",
    //   accessor: "javascript",
    //   width: 70,
    //   getValue: (result: Result) => {
    //     const external = result?.javascript?.external?.length || 0;
    //     const inline = result?.javascript?.inline?.length || 0;
    //     return external + inline;
    //   },
    // },
    // Add other columns as needed...
  ];

  const data = useMemo(() => {
    try {
      const safeData = Array.isArray(crawlData) ? crawlData : [];
      return safeData.map((result: Result, index: number) => {
        try {
          return tableStructure.reduce(
            (acc, column) => {
              try {
                acc[column.accessor] = column.getValue(result, index) ?? null;
              } catch (error) {
                acc[column.accessor] = null;
              }
              return acc;
            },
            {} as Record<string, any>,
          );
        } catch (error) {
          // If a single row fails, return an empty row object with all columns set to null
          return tableStructure.reduce(
            (acc, column) => {
              acc[column.accessor] = null;
              return acc;
            },
            {} as Record<string, any>,
          );
        }
      });
    } catch (error) {
      // If everything fails, return an empty array
      return [];
    }
  }, [crawlData]);

  const columns = tableStructure;
  const cellDetails: { [key: string]: CellData } = {
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
        { date: "2023-04-10", event: "Canonical Tag Added", user: "Developer" },
      ],
      related: [
        { id: 101, name: "Homepage Analytics", relation: "Primary URL" },
        { id: 201, name: "SEO Audit", relation: "Target URL" },
        { id: 301, name: "Performance Report", relation: "Main URL" },
        { id: 401, name: "Sitemap", relation: "Included URL" },
        { id: 501, name: "Robots.txt", relation: "Allowed URL" },
      ],
    },
    "0-ssl": {
      details: {
        enabled: true,
        provider: "Let's Encrypt",
        validFrom: "2023-01-15",
        validTo: "2023-04-15",
        issuer: "Let's Encrypt Authority X3",
        bitStrength: 2048,
        signatureAlgorithm: "SHA256withRSA",
      },
      history: [
        {
          date: "2023-01-15",
          event: "SSL Certificate Installed",
          user: "IT Team",
        },
        { date: "2023-01-15", event: "HTTPS Enforced", user: "Developer" },
        {
          date: "2023-02-01",
          event: "Mixed Content Issues Resolved",
          user: "Developer",
        },
        {
          date: "2023-03-01",
          event: "SSL Configuration Optimized",
          user: "Security Specialist",
        },
      ],
      related: [
        { id: 601, name: "Security Audit", relation: "SSL Check" },
        { id: 701, name: "Performance Optimization", relation: "HTTPS Impact" },
        { id: 801, name: "SEO Report", relation: "HTTPS as Ranking Factor" },
      ],
    },
    "0-mobileFriendly": {
      details: {
        isMobileFriendly: true,
        viewport: "width=device-width, initial-scale=1",
        textReadability: "Passed",
        tapTargetSpacing: "Passed",
        contentSizing: "Passed",
      },
      history: [
        {
          date: "2023-02-01",
          event: "Mobile-First Design Implemented",
          user: "UX Designer",
        },
        {
          date: "2023-02-15",
          event: "Responsive Images Added",
          user: "Developer",
        },
        {
          date: "2023-03-01",
          event: "Mobile Page Speed Optimized",
          user: "Performance Specialist",
        },
        {
          date: "2023-03-15",
          event: "Mobile Usability Test Conducted",
          user: "QA Team",
        },
      ],
      related: [
        {
          id: 901,
          name: "Mobile SEO Report",
          relation: "Mobile-Friendliness Factor",
        },
        {
          id: 1001,
          name: "User Experience Analysis",
          relation: "Mobile Usability",
        },
        {
          id: 1101,
          name: "Google Search Console",
          relation: "Mobile Usability Report",
        },
      ],
    },
  };

  const tabData: { [key: string]: TabData } = {
    crawledPages: { columns, data },
    seoAnalysis: {
      columns: [
        { Header: "ID", accessor: "id", width: 60 },
        { Header: "Page Title", accessor: "pageTitle", width: 250 },
        { Header: "Meta Description", accessor: "metaDescription", width: 300 },
        { Header: "H1", accessor: "h1", width: 200 },
        { Header: "Word Count", accessor: "wordCount", width: 120 },
        { Header: "Internal Links", accessor: "internalLinks", width: 120 },
        { Header: "External Links", accessor: "externalLinks", width: 120 },
        { Header: "Images", accessor: "images", width: 100 },
        { Header: "Alt Tags Missing", accessor: "altTagsMissing", width: 140 },
        { Header: "Mobile Friendly", accessor: "mobileFriendly", width: 130 },
      ],
      data: data.map(
        ({
          id,
          // pageTitle,
          // metaDescription,
          // h1,
          // wordCount,
          // internalLinks,
          // externalLinks,
          // images,
          // altTagsMissing,
          // ssl,
          // mobileFriendly,
        }) => ({
          id,
          // pageTitle,
          // metaDescription,
          // h1,
          // wordCount,
          // internalLinks,
          // externalLinks,
          // images,
          // altTagsMissing,
          // ssl,
          // mobileFriendly,
        }),
      ),
    },
    technicalDetails: {
      columns: [
        { Header: "ID", accessor: "id", width: 60 },
        { Header: "URL", accessor: "url", width: 200 },
        { Header: "Status Code", accessor: "statusCode", width: 120 },
        { Header: "Response Time (ms)", accessor: "responseTime", width: 150 },
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
  };

  useEffect(() => {
    const updateHeight = () => {
      const windowHeight = window.innerHeight;
      const newContainerHeight = windowHeight - 144; // Adjust for padding and other elements
      setContainerHeight(newContainerHeight);
      setBottomTableHeight(Math.floor(newContainerHeight / 3));
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

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
      className={`mx-0 mt-8 h-screen ${visibility.sidebar ? "w-[calc(100vw-18rem)]" : ""}`}
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
            <TabsList className="w-full justify-start dark:bg-brand-dark -mb-2 bg-gray-50 rounded-none">
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
                  <Table
                    columns={tabData[tab].columns}
                    data={tabData[tab].data}
                    onCellClick={handleCellClick}
                    onCellRightClick={handleCellRightClick}
                  />
                </TabsContent>
              ),
            )}
          </Tabs>
        </div>
        <ResizableDivider onResize={handleResize} containerRef={containerRef} />
        <div
          className="overflow-scroll h-auto"
          style={{ height: `${bottomTableHeight}px`, minHeight: "100px" }}
        >
          <DetailTable data={selectedCellData} />
        </div>
      </div>
    </div>
  );
}
