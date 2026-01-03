// @ts-nocheck
"use client";

// Import necessary dependencies
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { UniversalKeywordTable } from "../Shared/UniversalKeywordTable";
import { ColumnDef } from "@tanstack/react-table";
import DeepCrawlQueryContextMenu from "@/app/global/_components/Sidebar/GSCRankingInfo/DeepCrawlQueryContextMenu";
import useGSCStatusStore from "@/store/GSCStatusStore";

// Interface defining the structure of a Keyword object
interface GscUrl {
  id: number;
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  url: string;
  position: number;
  date: string;
}

const GSCanalytics = () => {
  const [gscData, setGscData] = useState<GscUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { credentials } = useGSCStatusStore();

  const handleFetchGSCdataFromDB = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await invoke("read_gsc_data_from_db_command");
      setGscData(response);
    } catch (error) {
      console.error("Failed to fetch GSC URLs from DB:", error);
      toast.error("Failed to fetch GSC data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    handleFetchGSCdataFromDB();
  }, [handleFetchGSCdataFromDB]);

  const columns = useMemo<ColumnDef<GscUrl>[]>(
    () => [
      {
        accessorKey: "query",
        header: "Keyword",
        cell: ({ row }) => (
          <DeepCrawlQueryContextMenu
            url={row.original.url}
            query={row.original.query}
            credentials={credentials}
            position={row.original.position}
            impressions={row.original.impressions}
            clicks={row.original.clicks}
          >
            <span className="text-blue-600 font-semibold cursor-pointer hover:underline truncate block max-w-[200px]">
              {row.original.query}
            </span>
          </DeepCrawlQueryContextMenu>
        ),
      },
      {
        accessorKey: "impressions",
        header: "Impressions",
        cell: ({ row }) => row.original.impressions.toLocaleString(),
      },
      {
        accessorKey: "clicks",
        header: "Clicks",
        cell: ({ row }) => row.original.clicks.toLocaleString(),
      },
      {
        accessorKey: "ctr",
        header: "CTR",
        cell: ({ row }) => `${(row.original.ctr * 100).toFixed(2)}%`,
      },
      {
        accessorKey: "position",
        header: "Position",
        cell: ({ row }) => {
          const position = Math.max(1, row.original.position);
          let colorClass = "";
          if (position <= 1.9) colorClass = "text-green-500";
          else if (position <= 10) colorClass = "text-blue-500";
          else colorClass = "text-red-500";
          return <span className={colorClass}>{position.toFixed(1)}</span>;
        },
      },
      {
        accessorKey: "url",
        header: "URL",
        cell: ({ row }) => (
          <div className="max-w-[400px] truncate text-gray-500" title={row.original.url}>
            {row.original.url}
          </div>
        ),
      },
    ],
    [credentials]
  );

  return (
    <div className="px-2 h-[calc(100vh-90px)] flex flex-col dark:text-white/50">
      <div className="flex items-center gap-2 mb-2 flex-shrink-0">
        <h1 className="text-2xl font-bold">Google Search Console</h1>
        <button
          onClick={handleFetchGSCdataFromDB}
          className="hover:bg-gray-100 dark:hover:bg-brand-dark p-1 rounded-md transition-colors"
          title="Refresh search console data"
        >
          <RefreshCw className={`h-5 w-5 text-black dark:text-white ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <UniversalKeywordTable
          data={gscData}
          columns={columns}
          searchPlaceholder="Search keywords or URL..."
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default GSCanalytics;
