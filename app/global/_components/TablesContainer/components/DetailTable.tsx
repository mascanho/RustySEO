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
    <div className="w-full h-full flex flex-col text-sm">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-grow flex flex-col"
      >
        <TabsContent
          value="details"
          className="flex-grow overflow-scrollh-full h-2 "
        >
          <Table columns={detailsColumns} data={detailsData} />
        </TabsContent>
        <TabsContent value="history" className="flex-grow overflow-hidden">
          <Table columns={historyColumns} data={historyData} />
        </TabsContent>
        <TabsContent value="related" className="flex-grow overflow-hidden">
          <Table columns={relatedColumns} data={relatedData} />
        </TabsContent>
        <TabsList className="mt-2">
          <TabsTrigger value="details" className="text-xs">
            Details
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            History
          </TabsTrigger>
          <TabsTrigger value="related" className="text-xs">
            Related
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default DetailTable;
