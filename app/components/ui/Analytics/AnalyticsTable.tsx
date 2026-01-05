// @ts-nocheck
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format, addDays, isValid } from "date-fns";
import { Search, Calendar as CalendarIcon, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { UniversalKeywordTable } from "../Shared/UniversalKeywordTable";
import { ColumnDef } from "@tanstack/react-table";

export default function AnalyticsTable() {
  const [analyticsData, setAnalyticsData] = useState<any>([]);
  // Initialize dates
  const [startDate, setStartDate] = useState<Date | null>(new Date(2022, 0, 1));
  const [endDate, setEndDate] = useState<Date | null>(addDays(new Date(), 0)); // Default to today

  const [selectedDimension, setSelectedDimension] = useState("general");
  const [isLoading, setIsLoading] = useState(false);

  // Helper to format date for input value (yyyy-MM-dd)
  const formatDateForInput = (date: Date | null) => {
    if (!date || !isValid(date)) return "";
    return format(date, "yyyy-MM-dd");
  };

  // Handle manual date change
  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (!value) return;
    const date = new Date(value);
    // Adjust for timezone offset to ensure the date is correct
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

    if (type === 'start') {
      setStartDate(adjustedDate);
    } else {
      setEndDate(adjustedDate);
    }
  };

  // Handle the fetching of analytics data
  const handleFilteredAnalytics = useCallback(async (dimensionVal: string = selectedDimension) => {
    if (!startDate || !endDate) return;

    setIsLoading(true);
    toast.info("Fetching latest data from Google Analytics 4...");

    // Update selected dimension if passed (e.g. from select change)
    if (dimensionVal !== selectedDimension) {
      setSelectedDimension(dimensionVal);
    }

    const analyticsDateRange = [
      {
        start_date: startDate,
        end_date: endDate.toISOString(),
      },
    ];

    let type = [];

    let params = {
      landings: {
        dateRanges: [
          {
            startDate: startDate?.toISOString()?.split("T")[0],
            endDate: endDate?.toISOString()?.split("T")[0],
          },
        ],
        dimensions: [
          { name: "landingPagePlusQueryString" },
          { name: "country" },
        ],
        metrics: [
          { name: "sessions" },
          { name: "organicGoogleSearchAveragePosition" },
          { name: "engagementRate" },
          { name: "sessionsPerUser" },
        ],
      },

      general: {
        dateRanges: [
          {
            startDate: startDate?.toISOString()?.split("T")[0],
            endDate: endDate?.toISOString()?.split("T")[0],
          },
        ],
        dimensions: [{ name: "fullPageUrl" }],
        metrics: [
          { name: "sessions" },
          { name: "newUsers" },
          { name: "totalUsers" },
          { name: "bounceRate" },
          { name: "scrolledUsers" },
        ],
      },
      country: {
        dateRanges: [
          {
            startDate: startDate?.toISOString()?.split("T")[0],
            endDate: endDate?.toISOString()?.split("T")[0],
          },
        ],
        dimensions: [{ name: "country" }],
        metrics: [
          { name: "sessions" },
          { name: "newUsers" },
          { name: "totalUsers" },
          { name: "bounceRate" },
          { name: "scrolledUsers" },
          { name: "sessionsPerUser" },
        ],
      },
      city: {
        dateRanges: [
          {
            startDate: startDate?.toISOString()?.split("T")[0],
            endDate: endDate?.toISOString()?.split("T")[0],
          },
        ],
        dimensions: [{ name: "city" }],
        metrics: [
          { name: "sessions" },
          { name: "newUsers" },
          { name: "totalUsers" },
          { name: "sessionsPerUser" },
          { name: "scrolledUsers" },
          { name: "bounceRate" },
        ],
      },
      device: {
        dateRanges: [
          {
            startDate: startDate?.toISOString()?.split("T")[0],
            endDate: endDate?.toISOString()?.split("T")[0],
          },
        ],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [
          { name: "sessions" },
          { name: "newUsers" },
          { name: "totalUsers" },
          { name: "bounceRate" },
          { name: "scrolledUsers" },
          { name: "sessionsPerUser" },
        ],
      },
    };

    switch (dimensionVal) {
      case "general":
        type.push(params.general);
        break;
      case "landings":
        type.push(params.landings);
        break;
      case "country":
        type.push(params.country);
        break;
      case "city":
        type.push(params.city);
        break;
      case "device":
        type.push(params.device);
        break;
      default:
        type.push(params.general);
        break;
    }

    try {
      const result: any = await invoke("get_google_analytics_command", {
        searchType: type,
        dateRanges: analyticsDateRange,
      });

      if (result.response[0]?.error) {
        toast(result.response[0]?.error.message);
      }

      console.log("Result: ", result);
      setAnalyticsData(result);
      toast.success("Google Analytics 4 data updated");
      return result;
    } catch (error) {
      console.error("Error fetching Google Analytics data:", error);
      const updateError = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to refresh Google Analytics data: ${updateError}`);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, selectedDimension]);

  // Initial fetch
  useEffect(() => {
    const fetchData = async () => {
      // Avoid fetching if dates are invalid
      if (startDate && endDate) {
        await handleFilteredAnalytics("general");
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Refetch when dates change (debounce could be added but explicit for now)
  useEffect(() => {
    // NOTE: GSC uses a refresh button, GA4 was auto-fetching. 
    // To match GSC behavior exactly, we could remove this and rely on the refresh button.
    // However, the original code auto-fetched. Let's keep auto-fetch for date changes 
    // but the UI controls will look like GSC.
    if (startDate && endDate) {
      handleFilteredAnalytics(selectedDimension);
    }
  }, [startDate, endDate, selectedDimension, handleFilteredAnalytics]);


  // --- Data Transformation ---

  const flattenData = useMemo(() => {
    if (!analyticsData?.response?.[0]?.rows) return [];

    const dimHeaders = analyticsData.response[0].dimensionHeaders || [];
    const metHeaders = analyticsData.response[0].metricHeaders || [];

    return analyticsData.response[0].rows.map((row: any) => {
      const flatRow: any = {};

      // Map dimensions
      row.dimensionValues?.forEach((dim: any, index: number) => {
        const headerName = dimHeaders[index]?.name || `dim_${index}`;
        flatRow[headerName] = dim.value;
      });

      // Map metrics
      row.metricValues?.forEach((met: any, index: number) => {
        const headerName = metHeaders[index]?.name || `met_${index}`;
        flatRow[headerName] = met.value;
      });

      return flatRow;
    });
  }, [analyticsData]);

  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (!analyticsData?.response?.[0]) return [];

    const dimHeaders = analyticsData.response[0].dimensionHeaders || [];
    const metHeaders = analyticsData.response[0].metricHeaders || [];

    const cols: ColumnDef<any>[] = [];

    // Dimensions Columns
    dimHeaders.forEach((header: any) => {
      cols.push({
        accessorKey: header.name,
        header: header.name.charAt(0).toUpperCase() + header.name.slice(1).replace(/([A-Z])/g, " $1").trim(),
        cell: ({ row }) => (
          <div className="truncate max-w-[400px]" title={row.getValue(header.name)}>
            {row.getValue(header.name) || "N/A"}
          </div>
        )
      });
    });

    // Metrics Columns
    metHeaders.forEach((header: any) => {
      cols.push({
        accessorKey: header.name,
        header: header.name.charAt(0).toUpperCase() + header.name.slice(1).replace(/([A-Z])/g, " $1").trim(),
        cell: ({ row }) => {
          const value: any = row.getValue(header.name);
          const numValue = parseFloat(value || "0");

          if (header.name === "bounceRate" || header.name === "engagementRate") {
            return `${(numValue * 100).toFixed(2)}%`;
          }
          return numValue.toLocaleString(undefined, { maximumFractionDigits: 1 });
        }
      });
    });

    return cols;
  }, [analyticsData]);


  return (
    <div className="px-0 h-full flex flex-col dark:text-white/50">
      <UniversalKeywordTable
        data={flattenData}
        columns={columns}
        searchPlaceholder="Search data..."
        isLoading={isLoading}
        headerActions={
          <div className="flex items-center gap-2">
            {/* Dimension Select */}
            <Select
              onValueChange={(val) => handleFilteredAnalytics(val)}
              value={selectedDimension}
            >
              <SelectTrigger className="w-[150px] h-9 text-xs bg-white dark:bg-brand-darker border-gray-200 dark:border-brand-dark focus:ring-1 focus:ring-offset-0 rounded-xl mr-2">
                <SelectValue placeholder="Select dimension" />
              </SelectTrigger>
              <SelectContent className="dark:text-white text-xs dark:bg-brand-darker dark:border-brand-dark">
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="landings">Landings</SelectItem>
                <SelectItem value="country">Country</SelectItem>
                <SelectItem value="city">City</SelectItem>
                <SelectItem value="device">Device</SelectItem>
              </SelectContent>
            </Select>

            <div className="w-px h-6 bg-gray-200 dark:bg-brand-dark mx-1"></div>

            {/* Date Picker Group */}
            <div className="flex items-center gap-1.5 h-9 px-2.5 border border-gray-200 dark:border-brand-dark rounded-xl bg-white dark:bg-brand-darker shadow-sm">
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

            <button
              onClick={() => handleFilteredAnalytics(selectedDimension)}
              className="h-9 w-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-brand-dark rounded-xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-brand-dark text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-brand-dark mx-1"></div>
          </div>
        }
      />
    </div>
  );
}
