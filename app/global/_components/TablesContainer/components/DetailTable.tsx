// @ts-nocheck
import type React from "react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Table from "./Table";
import type { CellData, Column } from "../types/table";

interface DetailTableProps {
  data: CellData | null;
}

const DetailTable: React.FC<DetailTableProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState("details");

  const detailsColumns: Column[] = [
    { Header: "Field", accessor: "field" },
    { Header: "Value", accessor: "value" },
  ];

  const historyColumns: Column[] = [
    { Header: "Date", accessor: "date" },
    { Header: "Event", accessor: "event" },
    { Header: "User", accessor: "user" },
  ];

  const relatedColumns: Column[] = [
    { Header: "ID", accessor: "id" },
    { Header: "Name", accessor: "name" },
    { Header: "Relation", accessor: "relation" },
  ];

  const detailsData = data
    ? Object.entries(data.details).map(([key, value]) => ({
        field: key,
        value:
          typeof value === "object" ? JSON.stringify(value) : String(value),
      }))
    : [];

  const historyData = data?.history || [];
  const relatedData = data?.related || [];

  return (
    <div className="w-full">
      <div className="mb-4">
        <Table
          columns={
            activeTab === "details"
              ? detailsColumns
              : activeTab === "history"
                ? historyColumns
                : relatedColumns
          }
          data={
            activeTab === "details"
              ? detailsData
              : activeTab === "history"
                ? historyData
                : relatedData
          }
        />
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="related">Related</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default DetailTable;
