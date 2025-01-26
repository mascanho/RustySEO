"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Table from "./components/Table";
import DetailTable from "./components/DetailTable";
import ResizableDivider from "./components/ResizableDivider";
import { columns, data, cellDetails, tabData } from "./data/sampleData";
import type { CellData } from "./types/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVisibilityStore } from "@/store/VisibilityStore";

export default function Home() {
  const [containerHeight, setContainerHeight] = useState(600);
  const [bottomTableHeight, setBottomTableHeight] = useState(200);
  const [selectedCellData, setSelectedCellData] = useState<CellData | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("employees");
  const containerRef = useRef<HTMLDivElement>(null);

  const { visibility, showSidebar, hideSidebar } = useVisibilityStore();

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
            className="h-full flex flex-col"
          >
            <TabsList className="w-full justify-start -mb-2 bg-gray-50 rounded-none">
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
        <div style={{ height: `${bottomTableHeight}px`, minHeight: "100px" }}>
          <DetailTable data={selectedCellData} />
        </div>
      </div>
    </div>
  );
}
