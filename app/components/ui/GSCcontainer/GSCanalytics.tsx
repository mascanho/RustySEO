// @ts-nocheck
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { RefreshCw, LogIn, Plus, LayoutGrid, Calendar as CalendarIcon } from "lucide-react";
import { UniversalKeywordTable } from "../Shared/UniversalKeywordTable";
import { ColumnDef } from "@tanstack/react-table";
import DeepCrawlQueryContextMenu from "@/app/global/_components/Sidebar/GSCRankingInfo/DeepCrawlQueryContextMenu";
import useGSCStatusStore from "@/store/GSCStatusStore";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import GSCConnectionWizard from "./GSCConnectionWizard";
import { Button } from "@/components/ui/button";
import { format, subDays, isValid } from "date-fns";

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
  const { credentials, isConfigured, refresh: refreshStatus } = useGSCStatusStore();
  const [openedWizard, { open: openWizard, close: closeWizard }] = useDisclosure(false);

  // Date filtering state - Init with last 28 days
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const date = subDays(new Date(), 28);
    return isValid(date) ? date : null;
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const date = new Date();
    return isValid(date) ? date : null;
  });

  // Helper to format date for input value (yyyy-MM-dd)
  const formatDateForInput = (date: Date | null) => {
    if (!date || !isValid(date)) return "";
    try {
      return format(date, "yyyy-MM-dd");
    } catch (e) {
      return "";
    }
  };

  // Handle manual date change
  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (!value) return;
    const date = new Date(value);

    // Validate date
    if (!isValid(date)) return;

    // Adjust for timezone offset
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

    if (type === 'start') {
      setStartDate(adjustedDate);
    } else {
      setEndDate(adjustedDate);
    }
  };

  const handleFetchGSCdataFromDB = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await invoke("read_gsc_data_from_db_command");

      // Ensure response is an array
      if (Array.isArray(response)) {
        setGscData(response);
      } else {
        console.warn("GSC data from DB is not an array:", response);
        setGscData([]);
      }
    } catch (error) {
      console.error("Failed to fetch GSC URLs from DB:", error);
      toast.error("Failed to fetch GSC data");
      setGscData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefreshGSC = useCallback(async () => {
    console.log("Refreshing GSC data...");
    try {
      setIsLoading(true);
      toast.info("Fetching latest data from Google Search Console...");

      console.log("Invoking call_google_search_console...");
      await invoke("call_google_search_console");

      console.log("GSC API call completed, refreshing status...");
      await refreshStatus();

      console.log("Fetching fresh data from DB...");
      await handleFetchGSCdataFromDB();

      console.log("GSC refresh cycle completed");
      toast.success("Search Console data updated");
    } catch (error) {
      console.error("Failed to refresh GSC data:", error);
      // Determine if error is an object with message or string
      const updateError = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to refresh Search Console data: ${updateError}`);
    } finally {
      setIsLoading(false);
    }
  }, [handleFetchGSCdataFromDB, refreshStatus]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    console.log("GSC Status updated:", { isConfigured, credentials });
  }, [isConfigured, credentials]);

  useEffect(() => {
    if (isConfigured) {
      handleFetchGSCdataFromDB();
    }
  }, [handleFetchGSCdataFromDB, isConfigured]);

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
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-gray-500 text-xs">
            {row.original.date}
          </span>
        ),
      }
    ],
    [credentials]
  );

  // Filter data based on date range
  const filteredData = useMemo(() => {
    // Ensure gscData is an array
    if (!Array.isArray(gscData) || !gscData.length) return [];
    if (!startDate && !endDate) return gscData;

    return gscData.filter((item) => {
      // Robust null check for item
      if (!item || !item.date) return true;

      const itemDate = new Date(item.date);

      // Robust date validity check
      if (!isValid(itemDate)) return false;

      // Normalize times for comparison
      itemDate.setHours(0, 0, 0, 0);

      let afterStart = true;
      let beforeEnd = true;

      if (startDate && isValid(startDate)) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        afterStart = itemDate >= start;
      }

      if (endDate && isValid(endDate)) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        beforeEnd = itemDate <= end;
      }

      return afterStart && beforeEnd;
    });
  }, [gscData, startDate, endDate]);

  return (
    <div className="px-2 h-[calc(100vh-10rem)] flex flex-col dark:text-white/50">
      <Modal
        opened={openedWizard}
        onClose={closeWizard}
        withCloseButton={false}
        centered
        size="lg"
        padding={0}
        radius="xl"
        styles={{
          content: {
            backgroundColor: "transparent",
            boxShadow: "none",
            border: "none",
          },
          body: {
            padding: 0,
            backgroundColor: "transparent",
          },
          inner: {
            padding: 0,
          }
        }}
      >
        <GSCConnectionWizard
          onComplete={() => {
            closeWizard();
            handleRefreshGSC();
          }}
          onClose={closeWizard}
        />
      </Modal>

      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
            <LayoutGrid className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Search Console</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isConfigured ? `Connected to ${credentials?.url}` : "Not connected"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Picker Group */}
          {isConfigured && (
            <div className="flex items-center gap-1.5 h-9 px-2.5 border border-gray-200 dark:border-brand-dark rounded-xl bg-white dark:bg-brand-darker shadow-sm mr-2">
              <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0 mr-1" />
              <input
                type="date"
                value={formatDateForInput(startDate)}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="h-full w-[110px] text-xs bg-transparent border-none p-0 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-0 dark:[color-scheme:dark] font-medium"
              />
              <span className="text-gray-300 dark:text-gray-600 select-none">-</span>
              <input
                type="date"
                value={formatDateForInput(endDate)}
                onChange={(e) => handleDateChange('end', e.target.value)}
                min={formatDateForInput(startDate)}
                className="h-full w-[110px] text-xs bg-transparent border-none p-0 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-0 dark:[color-scheme:dark] font-medium text-right"
              />
            </div>
          )}

          {isConfigured ? (
            <button
              onClick={handleRefreshGSC}
              className="p-2 hover:bg-gray-100 dark:hover:bg-brand-dark rounded-xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-brand-dark"
              title="Refresh data"
            >
              <RefreshCw className={`h-5 w-5 text-gray-600 dark:text-gray-300 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          ) : null}
          <Button
            onClick={openWizard}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            {isConfigured ? "Reconnect" : "Connect GSC"}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {!isConfigured ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 bg-gray-50/50 dark:bg-brand-darker/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-brand-dark">
            <div className="p-6 bg-white dark:bg-brand-dark rounded-full shadow-xl">
              <LogIn className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="max-w-xs space-y-2">
              <h2 className="text-xl font-bold dark:text-white">Connect your data</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Integrate Google Search Console to see your website's performance directly in RustySEO.
              </p>
            </div>
            <Button
              onClick={openWizard}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 py-6 text-lg font-bold shadow-xl shadow-blue-500/30 transition-all active:scale-95"
            >
              Get Started
            </Button>
          </div>
        ) : (
          <UniversalKeywordTable
            data={filteredData}
            columns={columns}
            searchPlaceholder="Search keywords or URL..."
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default GSCanalytics;
