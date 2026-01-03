// @ts-nocheck
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Trash2,
  Database,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import { useKeywordsStore } from "@/store/KWTrackingStore";
import { UniversalKeywordTable } from "@/app/components/ui/Shared/UniversalKeywordTable";
import { ColumnDef } from "@tanstack/react-table";

interface KeywordData {
  id: string;
  keyword: string;
  url: string;
  current_impressions: number;
  initial_impressions: number;
  current_clicks: number;
  initial_clicks: number;
  current_position: number;
  initial_position: number;
  date_added: string;
}

export function KeywordsTableDeep() {
  const [data, setData] = useState<KeywordData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchKeywordsData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await invoke("fetch_tracked_keywords_command");
      const summaryResponse = await invoke("fetch_keywords_summarized_matched_command");

      const transformedData = response.map((item) => {
        const summaryMatch = summaryResponse.find((s) => s.query === item.query);
        return {
          id: item.id,
          keyword: item.query,
          url: item.url,
          current_impressions: summaryMatch ? summaryMatch.current_impressions : item.impressions,
          initial_impressions: summaryMatch ? summaryMatch.initial_impressions : item.impressions,
          current_clicks: summaryMatch ? summaryMatch.current_clicks : item.clicks,
          initial_clicks: summaryMatch ? summaryMatch.initial_clicks : item.clicks,
          current_position: summaryMatch ? summaryMatch.current_position : item.position,
          initial_position: summaryMatch ? summaryMatch.initial_position : item.position,
          date_added: item.date,
        };
      });

      setData(transformedData);
      useKeywordsStore.getState().setKeywords(transformedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await invoke("match_tracked_with_gsc_command");
      await fetchKeywordsData();
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchKeywordsData]);

  useEffect(() => {
    fetchKeywordsData();
  }, [fetchKeywordsData]);

  useEffect(() => {
    const unlistenKeywordTracked = listen("keyword-tracked", () => fetchKeywordsData());
    const unlistenTrackingUpdated = listen("tracking-data-updated", () => fetchKeywordsData());

    return () => {
      unlistenKeywordTracked.then((fn) => fn());
      unlistenTrackingUpdated.then((fn) => fn());
    };
  }, [fetchKeywordsData]);

  const handleDelete = async (id: string) => {
    try {
      await invoke("delete_keyword_command", { id: String(id) });
      await emit("keyword-tracked", { action: "delete", id });
      await fetchKeywordsData();
      toast.success("Keyword deleted successfully");
    } catch (error) {
      toast.error("Failed to delete keyword");
      console.error("Delete error:", error);
    }
  };

  const renderChange = (current: number, initial: number, inverse = false) => {
    const change = current - initial;
    if (change === 0) return null;
    const isPositive = inverse ? change < 0 : change > 0;
    const color = isPositive ? "text-green-500" : "text-red-500";
    return (
      <span className={`inline-flex items-center ml-1 text-[10px] ${color}`}>
        {isPositive ? <ArrowUp className="h-2 w-2" /> : <ArrowDown className="h-2 w-2" />}
        {Math.abs(((change) / (initial || 1)) * 100).toFixed(1)}%
      </span>
    );
  };

  const columns = useMemo<ColumnDef<KeywordData>[]>(
    () => [
      {
        accessorKey: "keyword",
        header: "Keyword",
        cell: ({ row }) => (
          <span className="font-medium truncate block max-w-[150px]">
            {row.original.keyword}
          </span>
        ),
      },
      {
        accessorKey: "current_impressions",
        header: "Impressions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            {row.original.current_impressions.toLocaleString()}
            {renderChange(row.original.current_impressions, row.original.initial_impressions)}
          </div>
        ),
      },
      {
        accessorKey: "current_clicks",
        header: "Clicks",
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            {row.original.current_clicks.toLocaleString()}
            {renderChange(row.original.current_clicks, row.original.initial_clicks)}
          </div>
        ),
      },
      {
        accessorKey: "url",
        header: "URL",
        cell: ({ row }) => (
          <a
            href={row.original.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline truncate block max-w-[300px]"
          >
            {row.original.url}
          </a>
        ),
      },
      {
        accessorKey: "current_position",
        header: "Position",
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <span className={row.original.current_position <= 10 ? "text-green-500" : "text-red-500"}>
              {row.original.current_position.toFixed(1)}
            </span>
            {renderChange(row.original.current_position, row.original.initial_position, true)}
          </div>
        ),
      },
      {
        accessorKey: "date_added",
        header: "Updated",
        cell: ({ row }) => new Date(row.original.date_added).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        }),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        ),
        size: 40,
      },
    ],
    []
  );

  return (
    <div className="flex flex-col h-full dark:bg-brand-darker">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isRefreshing}
                className="h-8 text-xs"
              >
                <RefreshCw className={`mr-2 h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white dark:bg-brand-darker border-brand-dark">
              <DropdownMenuItem onClick={refreshData}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh & Match GSC
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => invoke("match_tracked_with_gsc_command")}>
                <Database className="mr-2 h-4 w-4" /> Force Match GSC
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <UniversalKeywordTable
          data={data}
          columns={columns}
          searchPlaceholder="Search by keyword or URL..."
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
