"use client";

import React, { useState } from "react";
import Table from "./components/Table";
import DetailTable from "./components/DetailTable";
import ResizableDivider from "./components/ResizableDivider";
import { columns, data, cellDetails } from "./data/SampleData";
import type { CellData } from "./types/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVisibilityStore } from "@/store/VisibilityStore";

export default function TablesContainer() {
  const [topTableHeight, setTopTableHeight] = useState(35);
  const [selectedCellData, setSelectedCellData] = useState<CellData | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("details");
  const { visibility, showSidebar, hideSidebar } = useVisibilityStore();

  const handleResize = (newHeight: number) => {
    setTopTableHeight(newHeight);
  };

  const handleCellClick = (rowIndex: number, columnId: string) => {
    const cellKey = `${rowIndex}-${columnId}`;
    setSelectedCellData(cellDetails[cellKey] || null);
  };

  const handleCellRightClick = (rowIndex: number, columnId: string) => {
    handleCellClick(rowIndex, columnId);
  };

  return (
    <div
      className={`mx-auto pt-8 flex flex-col h-screen bg-white -mr-4 flex-grow-0 ${visibility.sidebar ? "w-[calc(96.6vw-15rem)]" : "w-full"}`}
    >
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full bg-gray-200"
      >
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="related">Related</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className=" rounded-md h-full min-h[calc(100vh-100px)] overflow-hidden">
        <div style={{ height: `${topTableHeight}rem`, overflow: "auto" }}>
          <Table
            columns={columns}
            data={data}
            onCellClick={handleCellClick}
            onCellRightClick={handleCellRightClick}
          />
        </div>
        <ResizableDivider onResize={handleResize} />
        <div
          style={{
            height: `calc(100vh - ${topTableHeight}px - 100px)`,
            overflow: "auto",
          }}
        >
          <DetailTable data={selectedCellData} />
        </div>
      </div>
    </div>
  );
}
